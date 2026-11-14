import { z } from "zod";

/** Shared server environment schema. Each app picks the subset it needs via `loadEnv(schema.pick(...))`. */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  TRACKING_URL: z.url().default("http://localhost:3001"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  ENCRYPTION_KEY: z.string().min(1, "ENCRYPTION_KEY is required"),
  AUTH_SECRET: z.string().min(16).optional(),
  TRACKING_SIGNING_SECRET: z.string().min(16).optional(),
  SEND_MODE: z.enum(["dev", "live"]).default("dev"),
  MAILPIT_SMTP_HOST: z.string().default("localhost"),
  MAILPIT_SMTP_PORT: z.coerce.number().int().positive().default(1025),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validate `process.env` (or a given record) against a zod schema and throw one readable error
 * listing every problem, instead of failing later with `undefined`.
 */
export function loadEnv<S extends z.ZodType>(
  schema: S,
  source: Record<string, string | undefined> = process.env,
): z.infer<S> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join("\n")}`);
  }
  return result.data;
}
