import { z } from "zod";

/**
 * AI configuration. The Gemini client, rate limiter, cache and prompts arrive in Phase 5;
 * Phase 0 only fixes the contract: key + model always come from the environment.
 */
const aiEnvSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  GEMINI_RPM_LIMIT: z.coerce.number().int().positive().default(10),
  GEMINI_RPD_LIMIT: z.coerce.number().int().positive().default(250),
});

export interface AiConfig {
  enabled: boolean;
  apiKey: string | undefined;
  model: string | undefined;
  requestsPerMinute: number;
  requestsPerDay: number;
}

export function loadAiConfig(env: Record<string, string | undefined> = process.env): AiConfig {
  const e = aiEnvSchema.parse(env);
  return {
    enabled: Boolean(e.GEMINI_API_KEY && e.GEMINI_MODEL),
    apiKey: e.GEMINI_API_KEY,
    model: e.GEMINI_MODEL,
    requestsPerMinute: e.GEMINI_RPM_LIMIT,
    requestsPerDay: e.GEMINI_RPD_LIMIT,
  };
}
