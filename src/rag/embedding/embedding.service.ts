import { Injectable, Logger } from '@nestjs/common';
import {
  EmbeddingProvider,
  OllamaEmbeddingProvider,
  CloudflareEmbeddingProvider,
} from './embedding-provider';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly ollama: EmbeddingProvider;
  private _cloudflare: EmbeddingProvider | null = null;

  constructor() {
    this.ollama = new OllamaEmbeddingProvider();
  }

  private get cloudflare(): EmbeddingProvider {
    if (!this._cloudflare) {
      this._cloudflare = new CloudflareEmbeddingProvider();
    }
    return this._cloudflare;
  }

  async embedForIngestion(text: string): Promise<number[]> {
    return this.ollama.embed(text);
  }

  async embedBatchForIngestion(texts: string[]): Promise<number[][]> {
    this.logger.debug(
      `Embedding ${texts.length} chunk(s) via Ollama (ingestion path)`,
    );
    return this.ollama.embedBatch(texts);
  }

  async embedForQuery(text: string): Promise<number[]> {
    return this.cloudflare.embed(text);
  }
}
