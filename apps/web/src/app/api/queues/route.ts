import { Queue } from "bullmq";
import { QUEUES, WORKER_HEARTBEAT_KEY } from "@mailfox/core";
import { getAuth } from "@/lib/auth/context";
import { redis } from "@/lib/server";

export const dynamic = "force-dynamic";

const shown: [keyof typeof QUEUES, string][] = [
  ["send", "Send"],
  ["campaign", "Campaign expand"],
  ["schedule", "Scheduler"],
  ["bounce", "Bounces"],
  ["webhook", "Webhooks"],
];

const g = globalThis as unknown as { __mfQueues?: Map<string, Queue> };

function queue(name: string): Queue {
  g.__mfQueues ??= new Map();
  let q = g.__mfQueues.get(name);
  if (!q) {
    q = new Queue(name, { connection: redis() });
    g.__mfQueues.set(name, q);
  }
  return q;
}

export async function GET() {
  if (!(await getAuth())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [lastBeat, ...counts] = await Promise.all([
      redis().get(WORKER_HEARTBEAT_KEY),
      ...shown.map(([key]) => queue(QUEUES[key]).getJobCounts("waiting", "active", "delayed", "failed")),
    ]);
    return Response.json(
      {
        ok: true,
        worker: { online: lastBeat !== null && Date.now() - new Date(lastBeat).getTime() < 90_000, lastBeat },
        queues: shown.map(([key, label], i) => ({
          name: QUEUES[key],
          label,
          waiting: counts[i]?.waiting ?? 0,
          active: counts[i]?.active ?? 0,
          delayed: counts[i]?.delayed ?? 0,
          failed: counts[i]?.failed ?? 0,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, worker: { online: false, lastBeat: null }, queues: [] },
      { status: 503 },
    );
  }
}
