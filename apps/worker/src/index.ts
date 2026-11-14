/**
 * Mailfox worker — BullMQ consumers for sending, bounces, scheduling and warmup.
 *
 * Phase 0: boots, validates env, connects to Redis + Postgres, runs a heartbeat job and exposes
 * /health. The send/bounce/schedule/warmup processors are added in Phases 6–8.
 */
import { createServer } from "node:http";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { z } from "zod";
import { QUEUES, WORKER_HEARTBEAT_KEY, loadEnv } from "@mailfox/core";
import { getPrisma } from "@mailfox/db";

const env = loadEnv(
  z.object({
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
    WORKER_HEALTH_PORT: z.coerce.number().int().positive().default(3002),
    SEND_MODE: z.enum(["dev", "live"]).default("dev"),
  }),
);

const log = (msg: string, extra: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ t: new Date().toISOString(), svc: "worker", msg, ...extra }));

// BullMQ requires maxRetriesPerRequest: null on the blocking connection.
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const prisma = getPrisma();

const systemQueue = new Queue(QUEUES.system, { connection });
const systemWorker = new Worker(
  QUEUES.system,
  async (job) => {
    if (job.name === "heartbeat") {
      await connection.set(WORKER_HEARTBEAT_KEY, new Date().toISOString(), "EX", 120);
    }
  },
  { connection, concurrency: 1 },
);
systemWorker.on("failed", (job, err) =>
  log("job failed", { queue: QUEUES.system, job: job?.name, err: err.message }),
);

// Repeatable heartbeat every 30s (upsert = idempotent across restarts).
await systemQueue.upsertJobScheduler("heartbeat", { every: 30_000 }, { name: "heartbeat" });
await connection.set(WORKER_HEARTBEAT_KEY, new Date().toISOString(), "EX", 120);

const health = createServer(async (req, res) => {
  if (req.url !== "/health") {
    res.writeHead(404).end();
    return;
  }
  const [redis, database] = await Promise.all([
    connection.ping().then(
      () => "ok" as const,
      () => "error" as const,
    ),
    prisma.$queryRaw`SELECT 1`.then(
      () => "ok" as const,
      () => "error" as const,
    ),
  ]);
  const ok = redis === "ok" && database === "ok";
  res.writeHead(ok ? 200 : 503, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      status: ok ? "ok" : "degraded",
      service: "worker",
      redis,
      database,
      sendMode: env.SEND_MODE,
    }),
  );
});
health.listen(env.WORKER_HEALTH_PORT, () =>
  log("worker ready", { healthPort: env.WORKER_HEALTH_PORT, sendMode: env.SEND_MODE }),
);

async function shutdown(signal: string) {
  log("shutting down", { signal });
  health.close();
  await systemWorker.close(); // waits for in-flight jobs
  await systemQueue.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
