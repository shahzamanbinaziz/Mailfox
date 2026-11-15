const nf = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const fmt = (n: number) => nf.format(n);
export const fmtCompact = (n: number) => compact.format(n);
export const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export function timeAgo(input: string | Date, now = Date.now()): string {
  const t = typeof input === "string" ? new Date(input).getTime() : input.getTime();
  const s = Math.round((now - t) / 1000);
  const abs = Math.abs(s);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) if (abs >= secs) return rtf.format(-Math.round(s / secs), unit);
  return abs < 10 ? "just now" : rtf.format(-s, "second");
}

export function fmtDate(d: Date | string, tz?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(d));
}
