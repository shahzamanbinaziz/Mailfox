import "server-only";
import { Redis } from "ioredis";
import { z } from "zod";
import { loadEnv, parseEncryptionKey } from "@mailfox/core";
import { getPrisma, type PrismaClient } from "@mailfox/db";

/*
 * Everything here is lazy: `next build` imports route modules without runtime secrets
 * (e.g. inside the Docker build), so nothing may read env or open connections at import time.
 */

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  ENCRYPTION_KEY: z.string().min(1),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
});

let cachedEnv: z.infer<typeof envSchema> | undefined;
/** Validated server env (first call validates and throws a readable error listing every problem). */
export function getEnv() {
  cachedEnv ??= loadEnv(envSchema);
  return cachedEnv;
}

let cachedKey: Buffer | undefined;
export function getEncryptionKey(): Buffer {
  cachedKey ??= parseEncryptionKey(getEnv().ENCRYPTION_KEY);
  return cachedKey;
}

/** Lazy Prisma client: connects on first use, then behaves exactly like the real client. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client) as unknown;
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});

const g = globalThis as unknown as { __mfRedis?: Redis };
/** Shared Redis connection (rate limits, queue stats). Fails fast instead of hanging requests. */
export function redis(): Redis {
  if (!g.__mfRedis) {
    g.__mfRedis = new Redis(getEnv().REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
    g.__mfRedis.on("error", () => {
      /* surfaced per-command; avoid unhandled 'error' events crashing the server */
    });
  }
  return g.__mfRedis;
}
