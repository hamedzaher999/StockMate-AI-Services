import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { EmbeddingService } from '../embedding/embedding.service';
import { PG_POOL } from 'src/common/db.module';

export interface RetrievalFilter {
  module?: string;
  actor?: string;
  platform?: string;
}

export interface RetrievalOptions {
  limit?: number;
  minSimilarity?: number;
  excludeSectionTypes?: string[];
}

export interface RetrievedChunk {
  id: string;
  documentFeature: string;
  sectionHeading: string;
  sectionType: string;
  content: string;
  module: string;
  requirementRef: string | null;
  similarity: number;
}

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async search(
    queryText: string,
    filter: RetrievalFilter = {},
    options: RetrievalOptions = {},
  ): Promise<RetrievedChunk[]> {
    const {
      limit = 5,
      minSimilarity = 0,
      excludeSectionTypes = ['direct_link', 'requirement_reference'],
    } = options;

    const queryEmbedding = await this.embeddingService.embedForQuery(queryText);
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    const conditions: string[] = [];
    const params: unknown[] = [vectorLiteral];

    if (filter.module) {
      params.push(filter.module);
      conditions.push(`c.module = $${params.length}`);
    }

    if (filter.actor) {
      params.push(filter.actor);
      conditions.push(
        `(cardinality(c.actors) = 0 OR $${params.length} = ANY(c.actors))`,
      );
    }

    if (filter.platform) {
      params.push(filter.platform);
      conditions.push(`(c.platform IS NULL OR c.platform = $${params.length})`);
    }

    if (excludeSectionTypes.length > 0) {
      params.push(excludeSectionTypes);
      conditions.push(`c.section_type <> ALL($${params.length})`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit);
    const limitParamIndex = params.length;

    const result = await this.pool.query<{
      id: string;
      section_heading: string;
      section_type: string;
      content: string;
      module: string;
      requirement_ref: string | null;
      feature: string;
      similarity: number;
    }>(
      `
            SELECT
                c.id,
                c.section_heading,
                c.section_type,
                c.content,
                c.module,
                c.requirement_ref,
                d.feature,
                1 - (c.embedding <=> $1::vector) AS similarity
            FROM chunks c
            JOIN documents d ON d.id = c.document_id
            ${whereClause}
            ORDER BY c.embedding <=> $1::vector
            LIMIT $${limitParamIndex}
            `,
      params,
    );

    const rows = result.rows;

    this.logger.debug(
      `Query "${queryText}" -> ${rows.length} raw results ` +
        `(filter: ${JSON.stringify(filter)}, top similarity: ${rows[0]?.similarity?.toFixed(4) ?? 'n/a'})`,
    );

    const results = rows.map((row) => ({
      id: row.id,
      documentFeature: row.feature,
      sectionHeading: row.section_heading,
      sectionType: row.section_type,
      content: row.content,
      module: row.module,
      requirementRef: row.requirement_ref,
      similarity: row.similarity,
    }));

    const filtered = results.filter((r) => r.similarity >= minSimilarity);

    if (filtered.length === 0 && results.length > 0) {
      this.logger.warn(
        `Query "${queryText}" had no results above minSimilarity=${minSimilarity} ` +
          `(best was ${results[0].similarity.toFixed(4)}). Likely a knowledge-base gap.`,
      );
    }

    return filtered;
  }
}
