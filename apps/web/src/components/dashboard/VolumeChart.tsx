"use client";

import { useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table, Td, Th, Tr, cn } from "@mailfox/ui/components";
import { semantic } from "@mailfox/ui/tokens";
import { useIsDark } from "@/components/theme";
import { fmt } from "@/lib/format";

interface Point {
  day: string;
  sent: number;
  opens: number;
}

const dayLabel = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

interface TipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  label?: string | number;
  colors: { sent: string; opens: string };
}

function ChartTooltip({ active, payload, label, colors }: TipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as Point | undefined;
  if (!row) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">{dayLabel(String(label))}</p>
      {(
        [
          ["Sent", row.sent, colors.sent],
          ["Unique opens", row.opens, colors.opens],
        ] as const
      ).map(([name, value, color]) => (
        <p key={name} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: color }} />
          <span className="flex-1">{name}</span>
          <span className="font-semibold tabular-nums text-foreground">{fmt(value)}</span>
        </p>
      ))}
    </div>
  );
}

/** 30-day send volume vs unique opens. One axis (same unit: emails), crosshair tooltip, table view. */
export function VolumeChart({ data }: { data: Point[] }) {
  const dark = useIsDark();
  const t = dark ? semantic.dark : semantic.light;
  const colors = { sent: t["chart-1"], opens: t["chart-2"] };
  const [view, setView] = useState<"chart" | "table">("chart");
  const total = data.reduce((a, p) => a + p.sent, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground" aria-label="Legend">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ background: colors.sent }} /> Sent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ background: colors.opens }} /> Unique opens
          </span>
        </div>
        <div className="flex rounded-lg bg-muted p-0.5 text-xs font-medium" role="tablist" aria-label="View">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-2.5 py-1 capitalize transition",
                view === v ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      {view === "chart" ? (
        total === 0 ? (
          <div className="grid h-64 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            No emails sent in the last 30 days.
          </div>
        ) : (
          <div
            className="h-64"
            role="img"
            aria-label={`Daily emails sent and unique opens over the last 30 days. ${fmt(total)} sent in total.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="mf-sent-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={colors.sent} stopOpacity={0.18} />
                    <stop offset="1" stopColor={colors.sent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={t.border} />
                <XAxis
                  dataKey="day"
                  tickFormatter={dayLabel}
                  tick={{ fontSize: 11, fill: t["muted-foreground"] }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: t["muted-foreground"] }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip
                  cursor={{ stroke: t["muted-foreground"], strokeDasharray: "3 3" }}
                  content={(p) => (
                    <ChartTooltip active={p.active} payload={p.payload} label={p.label} colors={colors} />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke={colors.sent}
                  strokeWidth={2}
                  fill="url(#mf-sent-fill)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: t.card }}
                />
                <Line
                  type="monotone"
                  dataKey="opens"
                  stroke={colors.opens}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: t.card }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
          <Table>
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <Th>Day</Th>
                <Th className="text-right">Sent</Th>
                <Th className="text-right">Unique opens</Th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((p) => (
                <Tr key={p.day}>
                  <Td>{dayLabel(p.day)}</Td>
                  <Td className="text-right tabular-nums">{fmt(p.sent)}</Td>
                  <Td className="text-right tabular-nums">{fmt(p.opens)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
