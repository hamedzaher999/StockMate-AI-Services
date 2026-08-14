import 'dotenv/config';

import { Pool } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import {
  parseMarkdownDocument,
  ParsedSection,
} from '../src/rag/ingestion/markdown-parser';

const DATABASE_URL = process.env.DATABASE_URL;
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';

const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? 'bge-m3';

const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS ?? 1024);

const KNOWLEDGE_BASE_ROOT =
  process.env.KNOWLEDGE_BASE_ROOT ?? './knowledge-base';

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from .env');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, {
    withFileTypes: true,
  });

  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function embed(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Ollama embedding failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    embedding: number[];
  };

  if (!data.embedding) {
    throw new Error('Ollama returned no embedding.');
  }

  if (data.embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS}-dimensional embedding, ` +
        `got ${data.embedding.length}.`,
    );
  }

  return data.embedding;
}

async function embedBatch(sections: ParsedSection[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < sections.length; i++) {
    console.log(`   Embedding section ${i + 1}/${sections.length}...`);

    const vector = await embed(sections[i].content);

    embeddings.push(vector);
  }

  return embeddings;
}

async function ingestFile(filePath: string): Promise<void> {
  const raw = await readFile(filePath, 'utf8');

  const sourcePath = relative(KNOWLEDGE_BASE_ROOT, filePath);

  console.log(`\n📄 ${sourcePath}`);

  const parsed = parseMarkdownDocument(raw);

  const { frontmatter, sections } = parsed;

  console.log(`   Feature: ${frontmatter.feature}`);

  console.log(`   Sections: ${sections.length}`);

  /*
   * 1. Create/update the document
   */
  const documentResult = await pool.query<{
    id: string;
  }>(
    `
      INSERT INTO documents (
        feature,
        module,
        requirement_ref,
        doc_type,
        actors,
        related_features,
        tags,
        raw_content,
        source_path,
        last_updated
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10
      )
      ON CONFLICT (feature)
      DO UPDATE SET
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

  /*
   * 2. Remove old chunks
   *
   * This makes the script safe to run again
   * after changing a markdown document.
   */
  await pool.query(
    `
      DELETE FROM chunks
      WHERE document_id = $1
    `,
    [documentId],
  );

  /*
   * 3. Generate embeddings
   */
  const embeddings = await embedBatch(sections);

  /*
   * 4. Store chunks + vectors
   */
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const embedding = embeddings[i];

    const vectorLiteral = `[${embedding.join(',')}]`;

    await pool.query(
      `
        INSERT INTO chunks (
          document_id,
          section_heading,
          section_type,
          content,
          chunk_index,
          embedding,
          module,
          actors,
          requirement_ref
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          $4,
          $5,
          $6::vector,
          $7,
          $8,
          $9
        )
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

  console.log(`   ✅ ${sections.length} vectors stored`);
}

async function main() {
  console.log('======================================');
  console.log(' StockMate Knowledge Base Ingestion');
  console.log('======================================');

  console.log(`Database: Neon PostgreSQL`);

  console.log(`Embedding model: ${OLLAMA_EMBEDDING_MODEL}`);

  console.log(`Embedding dimensions: ${EMBEDDING_DIMENSIONS}`);

  console.log(`Knowledge base: ${KNOWLEDGE_BASE_ROOT}`);

  /*
   * Test database connection
   */
  await pool.query('SELECT 1');

  console.log('✅ Database connection successful');

  /*
   * Verify pgvector
   */
  const vectorCheck = await pool.query<{
    exists: boolean;
  }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'vector'
      ) AS exists
    `,
  );

  if (!vectorCheck.rows[0].exists) {
    throw new Error('pgvector extension is not installed in Neon.');
  }

  console.log('✅ pgvector extension available');

  /*
   * Find all markdown files
   */
  const files = await findMarkdownFiles(KNOWLEDGE_BASE_ROOT);

  console.log(`\nFound ${files.length} markdown files.`);

  if (files.length === 0) {
    console.log('No markdown files found.');

    return;
  }

  /*
   * Process every document
   */
  let successful = 0;
  let failed = 0;

  for (const file of files) {
    try {
      await ingestFile(file);

      successful++;
    } catch (error) {
      failed++;

      console.error(`\n❌ Failed: ${file}`);

      console.error(error instanceof Error ? error.message : error);
    }
  }

  console.log('\n======================================');
  console.log(' Ingestion finished');
  console.log('======================================');

  console.log(`Successful: ${successful}`);

  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Ingestion failed');

    console.error(error instanceof Error ? error.stack : error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
