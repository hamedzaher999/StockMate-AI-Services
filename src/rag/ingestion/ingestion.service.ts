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
      `Ingesting "${frontmatter.feature}" [${frontmatter.doc_type}] (${sections.length} sections) from ${sourcePath}`,
    );

    const documentResult = await this.pool.query<{ id: string }>(
      `
            INSERT INTO documents
                (feature, module, doc_type, platform, routes, requires_permission,
                 requirement_ref, actors, related_features, related_capability,
                 related_ui_flows, related_glossary, tags, raw_content, source_path,
                 last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT (feature) DO UPDATE SET
                module = EXCLUDED.module,
                doc_type = EXCLUDED.doc_type,
                platform = EXCLUDED.platform,
                routes = EXCLUDED.routes,
                requires_permission = EXCLUDED.requires_permission,
                requirement_ref = EXCLUDED.requirement_ref,
                actors = EXCLUDED.actors,
                related_features = EXCLUDED.related_features,
                related_capability = EXCLUDED.related_capability,
                related_ui_flows = EXCLUDED.related_ui_flows,
                related_glossary = EXCLUDED.related_glossary,
                tags = EXCLUDED.tags,
                raw_content = EXCLUDED.raw_content,
                source_path = EXCLUDED.source_path,
                last_updated = EXCLUDED.last_updated
            RETURNING id
            `,
      [
        frontmatter.feature,
        frontmatter.module,
        frontmatter.doc_type,
        frontmatter.platform ?? null,
        frontmatter.routes,
        frontmatter.requires_permission ?? null,
        frontmatter.requirement_ref ?? null,
        frontmatter.actors,
        frontmatter.related_features,
        frontmatter.related_capability ?? null,
        frontmatter.related_ui_flows,
        frontmatter.related_glossary,
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
                     module, doc_type, platform, routes, requires_permission, actors,
                     requirement_ref, embedding)
                VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::vector)
                `,
        [
          documentId,
          section.heading,
          section.sectionType,
          section.content,
          section.index,
          frontmatter.module,
          frontmatter.doc_type,
          frontmatter.platform ?? null,
          frontmatter.routes,
          frontmatter.requires_permission ?? null,
          frontmatter.actors,
          frontmatter.requirement_ref ?? null,
          vectorLiteral,
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
    let succeeded = 0;

    for (const file of files) {
      try {
        await this.ingestFile(file, knowledgeBaseRoot);
        succeeded++;
      } catch (err) {
        errors.push({ file, error: (err as Error).message });
        this.logger.error(`✗ Failed: ${file}`);
      }
    }

    this.logger.log(
      `\nIngestion summary: ${succeeded}/${files.length} succeeded, ${errors.length} failed.`,
    );

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
