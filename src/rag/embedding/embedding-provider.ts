export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export const EMBEDDING_DIMENSION = 1024;

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private readonly baseUrl: string;
  private readonly model = 'bge-m3';

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ?? process.env.OLLAMA_URL ?? 'http://localhost:11434';
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt: text }),
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
        `Expected ${EMBEDDING_DIMENSION}-dim embedding from Ollama "${this.model}", got ${data.embedding.length}.`,
      );
    }

    return data.embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }
}

export class CloudflareEmbeddingProvider implements EmbeddingProvider {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly model = '@cf/baai/bge-m3';

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
      throw new Error(
        'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must both be set in .env.',
      );
    }
    this.accountId = accountId;
    this.apiToken = apiToken;
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/${this.model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Cloudflare embedding request failed (${response.status}): ${body}`,
      );
    }

    const data = (await response.json()) as {
      result: { data: number[][]; shape: number[]; pooling: string };
      success: boolean;
    };

    const vector = data.result?.data?.[0];
    if (!vector || vector.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Expected ${EMBEDDING_DIMENSION}-dim embedding from Cloudflare bge-m3, got ${vector?.length ?? 'none'}.`,
      );
    }

    return vector;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }
}
