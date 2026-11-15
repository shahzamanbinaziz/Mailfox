/**
 * Effective daily send limit for a mailbox, including warmup.
 * Warmup ramps linearly from `warmupStartPerDay` on day 1 to `maxPerDay` on day `warmupDays`,
 * unless an explicit schedule ([{ day, limit }]) is provided — then the last step reached applies.
 */
export interface WarmupInput {
  maxPerDay: number;
  warmupEnabled: boolean;
  warmupStartedAt: Date | null;
  warmupDays: number;
  warmupStartPerDay: number;
  warmupSchedule?: unknown;
}

export function warmupDay(startedAt: Date, now = new Date()): number {
  return Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / 86_400_000) + 1);
}

export function effectiveDailyLimit(m: WarmupInput, now = new Date()): number {
  if (!m.warmupEnabled || !m.warmupStartedAt) return m.maxPerDay;
  const day = warmupDay(m.warmupStartedAt, now);
  if (Array.isArray(m.warmupSchedule) && m.warmupSchedule.length > 0) {
    const steps = (m.warmupSchedule as { day: number; limit: number }[])
      .filter((s) => typeof s.day === "number" && typeof s.limit === "number")
      .sort((a, b) => a.day - b.day);
    let limit = steps[0]?.limit ?? m.warmupStartPerDay;
    for (const s of steps) if (s.day <= day) limit = s.limit;
    return Math.min(limit, m.maxPerDay);
  }
  if (day >= m.warmupDays) return m.maxPerDay;
  const span = Math.max(1, m.warmupDays - 1);
  return Math.round(m.warmupStartPerDay + ((m.maxPerDay - m.warmupStartPerDay) * (day - 1)) / span);
}
