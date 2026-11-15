"use client";

import { useEffect, useState } from "react";
import { Activity, CircleAlert } from "lucide-react";
import { Badge } from "@mailfox/ui/components";
import { fmt, timeAgo } from "@/lib/format";

interface QueueRow {
  name: string;
  label: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
}
interface QueuePayload {
  ok: boolean;
  worker: { online: boolean; lastBeat: string | null };
  queues: QueueRow[];
}

/** Live queue depth, polled every 5s from /api/queues. */
export function QueueStatus() {
  const [data, setData] = useState<QueuePayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/queues", { cache: "no-store" })
        .then((r) => r.json() as Promise<QueuePayload>)
        .then((d) => {
          if (!alive) return;
          setData(d);
          setError(!d.ok);
        })
        .catch(() => alive && setError(true));
    void load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!data && !error) {
    return (
      <div className="grid gap-2" aria-busy="true" aria-label="Loading queue status">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="mf-skeleton h-9 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-800 dark:bg-danger-950 dark:text-danger-200"
      >
        <CircleAlert className="mt-0.5 size-4 shrink-0" /> Can’t reach Redis — queue stats unavailable.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="relative flex size-2">
            {data.worker.online && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success-500 opacity-60 motion-reduce:hidden" />
            )}
            <span
              className={`relative inline-flex size-2 rounded-full ${data.worker.online ? "bg-success-500" : "bg-danger-500"}`}
            />
          </span>
          Worker {data.worker.online ? "online" : "offline"}
          {data.worker.lastBeat && <span>· beat {timeAgo(data.worker.lastBeat)}</span>}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Activity className="size-3.5" /> live
        </span>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {data.queues.map((q) => (
          <li key={q.name} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="font-medium">{q.label}</span>
            <span className="flex items-center gap-1.5 text-xs tabular-nums">
              <Badge variant="neutral" title="Waiting">
                {fmt(q.waiting)} waiting
              </Badge>
              {q.active > 0 && <Badge variant="info">{fmt(q.active)} active</Badge>}
              {q.delayed > 0 && <Badge variant="warning">{fmt(q.delayed)} delayed</Badge>}
              {q.failed > 0 && <Badge variant="danger">{fmt(q.failed)} failed</Badge>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
