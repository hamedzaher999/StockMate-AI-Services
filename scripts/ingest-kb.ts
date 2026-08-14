#!/usr/bin/env ts-node
/**
 * scripts/ingest-kb.ts
 *
 * Standalone script to process the StockMate knowledge base (.md files)
 * and store it in Neon (Postgres + pgvector). Does NOT require the NestJS
 * app to be running — connects directly to Neon and to your local Ollama
 * embedding server.
 *
 * USAGE:
 *   npx ts-node scripts/ingest-kb.ts
 *   npx ts-node scripts/ingest-kb.ts --path ./src/knowledge-base
 *   npx ts-node scripts/ingest-kb.ts --dry-run          (parse + validate only, no DB writes, no embedding calls)
 *
 * REQUIRED ENV VARS (put these in a .env file at the project root, or export them):
 *   DATABASE_URL       -> your Neon connection string, e.g.
 *                          postgresql://user:pass@ep-xxxx.neon.tech/dbname?sslmode=require
 *   OLLAMA_URL         -> defaults to http://localhost:11434 if unset
 *   OLLAMA_EMBEDDING_MODEL -> defaults to bge-m3 if unset
 *
 * INSTALL (run once, in the bot/ project root):
 *   npm install pg dotenv
 *   npm install -D ts-node typescript @types/pg @types/node
 *
 * Run 001_init_schema.sql against your Neon database BEFORE running this script.
 */

import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const pathArgIndex = args.indexOf('--path');
const kbRoot =
  pathArgIndex !== -1 && args[pathArgIndex + 1]
    ? args[pathArgIndex + 1]
    : './knowledge-base';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DATABASE_URL = process.env.DATABASE_URL;
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? 'bge-m3';
const EMBEDDING_DIMENSION = 1024;

if (!dryRun && !DATABASE_URL) {
  console.error(
    '✗ DATABASE_URL is not set. Put it in a .env file or export it before running.\n' +
      '  Example: DATABASE_URL=postgresql://user:pass@ep-xxxx.neon.tech/dbname?sslmode=require',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (mirrors markdown-parser.ts)
// ---------------------------------------------------------------------------
interface ParsedFrontmatter {
  feature: string;
  module: string;
  doc_type: string;
  platform?: string | null;
  routes: string[];
  requires_permission?: string | null;
  requirement_ref?: string | null;
  actors: string[];
  related_features: string[];
  related_capability?: string | null;
  related_ui_flows: string[];
  related_glossary: string[];
  tags: string[];
  last_updated?: string | null;
}

interface ParsedSection {
  heading: string;
  sectionType: string;
  content: string;
  index: number;
}

const HEADING_TO_SECTION_TYPE: Record<string, string> = {
  'نظرة عامة': 'overview',
  'خطوات التنفيذ': 'workflow',
  'حقول النموذج المطلوبة': 'required_fields',
  'الصلاحيات المطلوبة': 'permissions',
  'سير الموافقة': 'approval_workflow',
  'قواعد التحقق': 'validation_rules',
  'إجراءات ذات صلة': 'related_actions',
  'رابط الصفحة': 'direct_link',
  'مرجع المتطلب': 'requirement_reference',
  'What this is': 'overview',
  'What this is NOT': 'overview',
  'How to get here': 'navigation',
  'How this works': 'overview',
  'Creation rules': 'validation_rules',
  Deactivation: 'business_rules',
  'Deactivation effects': 'business_rules',
  'Who can do what': 'permissions',
  'Who can create one': 'permissions',
  'Common questions this answers': 'faq',
  'Common questions': 'faq',
};

function headingToSectionType(heading: string): string {
  return HEADING_TO_SECTION_TYPE[heading.trim()] ?? 'general';
}

function parseFrontmatter(raw: string): {
  frontmatter: ParsedFrontmatter;
  body: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(
      'No YAML frontmatter block found (expected file to start with ---)',
    );
  }

  const [, yamlBlock, body] = match;
  const fm: Record<string, any> = {};

  for (const line of yamlBlock.split('\n')) {
    if (!line.trim()) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value: any = line.slice(colonIdx + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    } else if (value === 'null' || value === '') {
      value = null;
    }

    fm[key] = value;
  }

  const frontmatter: ParsedFrontmatter = {
    feature: fm.feature,
    module: fm.module,
    doc_type: fm.doc_type ?? 'capability',
    platform: fm.platform ?? null,
    routes: fm.routes ?? [],
    requires_permission: fm.requires_permission ?? null,
    requirement_ref: fm.requirement_ref ?? null,
    actors: fm.actors ?? [],
    related_features: fm.related_features ?? [],
    related_capability: fm.related_capability ?? null,
    related_ui_flows: fm.related_ui_flows ?? [],
    related_glossary: fm.related_glossary ?? [],
    tags: fm.tags ?? [],
    last_updated: fm.last_updated ?? null,
  };

  if (!frontmatter.feature || !frontmatter.module || !frontmatter.doc_type) {
    throw new Error(
      `Frontmatter missing required fields (feature, module, doc_type). Got: ${JSON.stringify(fm)}`,
    );
  }

  return { frontmatter, body };
}

function splitIntoSections(body: string): ParsedSection[] {
  const lines = body.split('\n');
  const sections: ParsedSection[] = [];

  let currentHeading: string | null = null;
  let currentContent: string[] = [];
  let index = 0;

  const flush = () => {
    if (currentHeading !== null) {
      const content = currentContent.join('\n').trim();
      if (content.length > 0) {
        sections.push({
          heading: currentHeading,
          sectionType: headingToSectionType(currentHeading),
          content,
          index: index++,
        });
      }
    }
  };

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      flush();
      currentHeading = h2Match[1].trim();
      currentContent = [];
    } else if (line.match(/^#\s+/)) {
      continue;
    } else {
      currentContent.push(line);
    }
  }
  flush();

  return sections;
}

// ---------------------------------------------------------------------------
// Ollama embedding
// ---------------------------------------------------------------------------
async function embed(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Ollama embedding request failed (${response.status}): ${body}`,
    );
  }

  const data = (await response.json()) as { embedding: number[] };

  if (data.embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSION}-dim embedding from Ollama "${OLLAMA_MODEL}", got ${data.embedding.length}.`,
    );
  }

  return data.embedding;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const [i, text] of texts.entries()) {
    process.stdout.write(`\r  embedding chunk ${i + 1}/${texts.length}...`);
    results.push(await embed(text));
  }
  process.stdout.write('\n');
  return results;
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(fullPath)));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`StockMate KB ingestion`);
  console.log(`  knowledge base root: ${kbRoot}`);
  console.log(
    `  mode: ${dryRun ? 'DRY RUN (no DB writes, no embedding calls)' : 'LIVE'}`,
  );
  console.log('');

  const files = await findMarkdownFiles(kbRoot);
  console.log(`Found ${files.length} markdown file(s).\n`);

  if (files.length === 0) {
    console.error(`✗ No .md files found under "${kbRoot}". Check --path.`);
    process.exit(1);
  }

  const pool = dryRun
    ? null
    : new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });

  const errors: { file: string; error: string }[] = [];
  let filesSucceeded = 0;
  let totalChunks = 0;

  // Collect feature slugs up front so we can validate cross-links
  const allSlugs = new Set<string>();
  const parsedDocs: {
    file: string;
    sourcePath: string;
    raw: string;
    frontmatter: ParsedFrontmatter;
    sections: ParsedSection[];
  }[] = [];

  for (const file of files) {
    const sourcePath = relative(kbRoot, file);
    try {
      const raw = await readFile(file, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(raw);
      const sections = splitIntoSections(body);

      if (sections.length === 0) {
        throw new Error(`produced zero ## sections — check heading format`);
      }

      allSlugs.add(frontmatter.feature);
      parsedDocs.push({ file, sourcePath, raw, frontmatter, sections });
    } catch (err) {
      errors.push({ file: sourcePath, error: (err as Error).message });
      console.error(
        `✗ Parse failed: ${sourcePath}\n    ${(err as Error).message}`,
      );
    }
  }

  // Validate cross-links (warn only, doesn't block ingestion)
  console.log('Validating cross-links...');
  let brokenLinks = 0;
  for (const doc of parsedDocs) {
    const allRefs = [
      ...(doc.frontmatter.related_capability
        ? [doc.frontmatter.related_capability]
        : []),
      ...doc.frontmatter.related_ui_flows,
      ...doc.frontmatter.related_glossary,
      ...doc.frontmatter.related_features,
    ];
    for (const ref of allRefs) {
      if (!allSlugs.has(ref)) {
        console.warn(
          `  ⚠ ${doc.sourcePath}: references unknown feature slug "${ref}"`,
        );
        brokenLinks++;
      }
    }
  }
  console.log(
    brokenLinks === 0
      ? '  ✓ all cross-links resolve\n'
      : `  ${brokenLinks} broken cross-link(s) found (see above) — ingestion will continue anyway\n`,
  );

  if (dryRun) {
    console.log(
      `Dry run complete: ${parsedDocs.length} file(s) parsed successfully, ${errors.length} failed.`,
    );
    if (errors.length > 0) process.exit(1);
    return;
  }

  // Ingest each doc
  for (const doc of parsedDocs) {
    try {
      console.log(
        `Ingesting "${doc.frontmatter.feature}" [${doc.frontmatter.doc_type}] (${doc.sections.length} sections) from ${doc.sourcePath}`,
      );

      const documentResult = await pool!.query<{ id: string }>(
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
          doc.frontmatter.feature,
          doc.frontmatter.module,
          doc.frontmatter.doc_type,
          doc.frontmatter.platform,
          doc.frontmatter.routes,
          doc.frontmatter.requires_permission,
          doc.frontmatter.requirement_ref,
          doc.frontmatter.actors,
          doc.frontmatter.related_features,
          doc.frontmatter.related_capability,
          doc.frontmatter.related_ui_flows,
          doc.frontmatter.related_glossary,
          doc.frontmatter.tags,
          doc.raw,
          doc.sourcePath,
          doc.frontmatter.last_updated,
        ],
      );

      const documentId = documentResult.rows[0].id;

      await pool!.query('DELETE FROM chunks WHERE document_id = $1', [
        documentId,
      ]);

      const embeddings = await embedBatch(doc.sections.map((s) => s.content));

      for (const [i, section] of doc.sections.entries()) {
        const vectorLiteral = `[${embeddings[i].join(',')}]`;

        await pool!.query(
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
            doc.frontmatter.module,
            doc.frontmatter.doc_type,
            doc.frontmatter.platform,
            doc.frontmatter.routes,
            doc.frontmatter.requires_permission,
            doc.frontmatter.actors,
            doc.frontmatter.requirement_ref,
            vectorLiteral,
          ],
        );
      }

      console.log(`  ✓ ${doc.sections.length} chunks embedded and stored\n`);
      filesSucceeded++;
      totalChunks += doc.sections.length;
    } catch (err) {
      errors.push({ file: doc.sourcePath, error: (err as Error).message });
      console.error(
        `  ✗ Failed: ${doc.sourcePath}\n    ${(err as Error).message}\n`,
      );
    }
  }

  await pool!.end();

  console.log('─'.repeat(60));
  console.log(
    `Done: ${filesSucceeded}/${files.length} files ingested, ${totalChunks} total chunks, ${errors.length} error(s).`,
  );
  if (errors.length > 0) {
    console.log('\nFailed files:');
    for (const e of errors) console.log(`  - ${e.file}: ${e.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n✗ Fatal error during ingestion:', err);
  process.exit(1);
});
