import "server-only";
import { redis } from "./server";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const memory = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window rate limiter backed by Redis (shared across processes).
 * Falls back to an in-process window if Redis is unreachable, so login never hard-fails.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const k = `mf:rl:${key}`;
  try {
    const r = redis();
    const [[, count], [, ttl]] = (await r.multi().incr(k).ttl(k).exec()) as [[null, number], [null, number]];
    if (ttl < 0) await r.expire(k, windowSeconds);
    const retry = ttl > 0 ? ttl : windowSeconds;
    return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds: retry };
  } catch {
    const now = Date.now();
    const entry = memory.get(k);
    if (!entry || entry.resetAt < now) {
      memory.set(k, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { ok: true, remaining: limit - 1, retryAfterSeconds: windowSeconds };
    }
    entry.count++;
    return {
      ok: entry.count <= limit,
      remaining: Math.max(0, limit - entry.count),
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  memory.delete(`mf:rl:${key}`);
  await redis()
    .del(`mf:rl:${key}`)
    .catch(() => undefined);
}
