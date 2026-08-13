import { Injectable, Logger } from '@nestjs/common';
import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { Pool } from 'pg';
import { Inject } from '@nestjs/common';
import { EmbeddingService } from '../embedding/embedding.service';
import { parseMarkdownDocument } from './markdown-parser';
import { PG_POOL } from 'src/common/db.module';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly embeddingService: EmbeddingService,
  ) {}

  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.findMarkdownFiles(fullPath)));
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async ingestFile(filePath: string, knowledgeBaseRoot: string): Promise<void> {
    const raw = await readFile(filePath, 'utf-8');
    const sourcePath = relative(knowledgeBaseRoot, filePath);

    let parsed;
    try {
      parsed = parseMarkdownDocument(raw);
    } catch (err) {
      throw new Error(
        `Failed to parse ${sourcePath}: ${(err as Error).message}`,
      );
    }

    const { frontmatter, sections } = parsed;
    this.logger.log(
      `Ingesting "${frontmatter.feature}" (${sections.length} sections) from ${sourcePath}`,
    );

    const documentResult = await this.pool.query<{ id: string }>(
      `
            INSERT INTO documents
                (feature, module, requirement_ref, doc_type, actors, related_features,
                 tags, raw_content, source_path, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (feature) DO UPDATE SET
                module = EXCLUDED.module,
                requirement_ref = EXCLUDED.requirement_ref,
                doc_type = EXCLUDED.doc_type,
                actors = EXCLUDED.actors,
                related_features = EXCLUDED.related_features,
                tags = EXCLUDED.tags,
                raw_content = EXCLUDED.raw_content,
                source_path = EXCLUDED.source_path,
                last_updated = EXCLUDED.last_updated
            RETURNING id
            `,
      [
        frontmatter.feature,
        frontmatter.module,
        frontmatter.requirement_ref ?? null,
        frontmatter.doc_type,
        frontmatter.actors,
        frontmatter.related_features,
        frontmatter.tags,
        raw,
        sourcePath,
        frontmatter.last_updated ?? null,
      ],
    );

    const documentId = documentResult.rows[0].id;

    await this.pool.query('DELETE FROM chunks WHERE document_id = $1', [
      documentId,
    ]);

    const embeddings = await this.embeddingService.embedBatchForIngestion(
      sections.map((s) => s.content),
    );

    for (const [i, section] of sections.entries()) {
      const vectorLiteral = `[${embeddings[i].join(',')}]`;

      await this.pool.query(
        `
                INSERT INTO chunks
                    (document_id, section_heading, section_type, content, chunk_index,
                     embedding, module, actors, requirement_ref)
                VALUES ($1::uuid, $2, $3, $4, $5, $6::vector, $7, $8, $9)
                `,
        [
          documentId,
          section.heading,
          section.sectionType,
          section.content,
          section.index,
          vectorLiteral,
          frontmatter.module,
          frontmatter.actors,
          frontmatter.requirement_ref ?? null,
        ],
      );
    }

    this.logger.log(
      `✓ ${frontmatter.feature}: ${sections.length} chunks embedded and stored`,
    );
  }

  async ingestAll(knowledgeBaseRoot: string): Promise<void> {
    const files = await this.findMarkdownFiles(knowledgeBaseRoot);
    this.logger.log(
      `Found ${files.length} markdown files under ${knowledgeBaseRoot}`,
    );

    const errors: { file: string; error: string }[] = [];

    for (const file of files) {
      try {
        await this.ingestFile(file, knowledgeBaseRoot);
      } catch (err) {
        errors.push({ file, error: (err as Error).message });
        this.logger.error(`✗ Failed: ${file}`);
      }
    }

    if (errors.length > 0) {
      this.logger.error(`\n${errors.length} file(s) failed to ingest:`);
      for (const e of errors) this.logger.error(`  ${e.file}: ${e.error}`);
      throw new Error(
        `Ingestion completed with ${errors.length} error(s) — see log above.`,
      );
    }

    this.logger.log(`All ${files.length} files ingested successfully.`);
  }
}
