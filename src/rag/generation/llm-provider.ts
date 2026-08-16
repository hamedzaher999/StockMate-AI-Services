import { GoogleGenAI } from '@google/genai';

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

// 1. Existing OpenRouter Provider
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
      throw new Error(`OpenRouter returned no text.`);
    }
    return text;
  }

  async complete(prompt: string, temperature: number): Promise<string> {
    return this.chat('', [{ role: 'user', content: prompt }], temperature);
  }
}

// 2. New Gemini Provider
export class GeminiProvider implements LlmProvider {
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(model: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'No Gemini API key found. Set GEMINI_API_KEY in your .env.',
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async chat(
    systemPrompt: string,
    messages: LlmMessage[],
    temperature: number,
  ): Promise<string> {
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini API returned empty response.');
    }
    return text;
  }

  async complete(prompt: string, temperature: number): Promise<string> {
    return this.chat('', [{ role: 'user', content: prompt }], temperature);
  }
}

// 3. Dynamic Factory Switcher
export function createLlmProvider(): LlmProvider {
  const choice = process.env.LLM_PROVIDER ?? 'openrouter';

  if (choice === 'gemini') {
    return new GeminiProvider(process.env.GEMINI_MODEL ?? 'gemini-2.5-flash');
  }

  return new OpenRouterProvider(
    process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
  );
}
