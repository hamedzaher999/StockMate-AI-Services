export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmProvider {
  chat(
    systemPrompt: string,
    messages: LlmMessage[],
    temperature: number,
  ): Promise<string>;
  complete(prompt: string, temperature: number): Promise<string>;
}

export class OpenRouterProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(model: string) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error(
        'No OpenRouter API key found. Set OPENROUTER_API_KEY in your .env.',
      );
    }
    this.apiKey = key;
    this.model = model;
  }

  async chat(
    systemPrompt: string,
    messages: LlmMessage[],
    temperature: number,
  ): Promise<string> {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://stockmate.internal',
          'X-Title': 'StockMate Assistant',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          temperature,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `OpenRouter request failed (${response.status}): ${body}`,
      );
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(
        `OpenRouter returned no text. Full response: ${JSON.stringify(data)}`,
      );
    }
    return text;
  }

  async complete(prompt: string, temperature: number): Promise<string> {
    return this.chat('', [{ role: 'user', content: prompt }], temperature);
  }
}

export function createLlmProvider(): LlmProvider {
  return new OpenRouterProvider(
    process.env.OPENROUTER_MODEL ?? 'google/gemini-2.5-flash',
  );
}
