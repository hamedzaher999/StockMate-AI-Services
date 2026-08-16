import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3100),

  DATABASE_URL: Joi.string().required(),
  CHATBOT_INTERNAL_SECRET: Joi.string().min(32).required(),

  OLLAMA_URL: Joi.string().default('http://localhost:11434'),
  OLLAMA_EMBEDDING_MODEL: Joi.string().default('bge-m3'),

  CLOUDFLARE_ACCOUNT_ID: Joi.string().allow('').optional(),
  CLOUDFLARE_API_TOKEN: Joi.string().allow('').optional(),

  EMBEDDING_DIMENSIONS: Joi.number().default(1024),
  OPENROUTER_API_KEY: Joi.string().required(),
  OPENROUTER_MODEL: Joi.string().default('openai/gpt-4o-mini'),

  GEMINI_API_KEY: Joi.string().optional(),
  GEMINI_MODEL: Joi.string().default('gemini-2.5-flash'),

  LLM_PROVIDER: Joi.string()
    .valid('openrouter', 'gemini')
    .default('openrouter'),
});
