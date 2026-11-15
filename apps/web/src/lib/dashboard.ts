import "server-only";
import { effectiveDailyLimit, percent } from "@mailfox/core";
import { prisma } from "./server";

/*
 * Prisma stores DateTime as `timestamp(3)` holding UTC. All day boundaries are computed in the
 * workspace's timezone: `ts AT TIME ZONE 'UTC'` → timestamptz, then `AT TIME ZONE $tz` → local time.
 */

const n = (v: bigint | number | null | undefined) => Number(v ?? 0);

export async function startOfTodayUtc(tz: string): Promise<Date> {
  const [row] = await prisma.$queryRaw<{ start: Date }[]>`
    SELECT ((date_trunc('day', now() AT TIME ZONE ${tz}) AT TIME ZONE ${tz}) AT TIME ZONE 'UTC') AS start`;
  return row?.start ?? new Date(new Date().setUTCHours(0, 0, 0, 0));
}

export async function getOverview(workspaceId: string, tz: string) {
  const todayStart = await startOfTodayUtc(tz);

  const [volume] = await prisma.$queryRaw<{ today: bigint; d7: bigint; d30: bigint; prev30: bigint }[]>`
    SELECT
      count(*) FILTER (WHERE "sentAt" >= ${todayStart}) AS today,
      count(*) FILTER (WHERE "sentAt" >= (now() AT TIME ZONE 'UTC') - interval '7 days') AS d7,
      count(*) FILTER (WHERE "sentAt" >= (now() AT TIME ZONE 'UTC') - interval '30 days') AS d30,
      count(*) FILTER (WHERE "sentAt" <  (now() AT TIME ZONE 'UTC') - interval '30 days'
                         AND "sentAt" >= (now() AT TIME ZONE 'UTC') - interval '60 days') AS prev30
    FROM "Send" WHERE "workspaceId" = ${workspaceId} AND "sentAt" IS NOT NULL`;

  const [eng] = await prisma.$queryRaw<
    {
      sent: bigint;
      delivered: bigint;
      bounced: bigint;
      uopens: bigint;
      machine: bigint;
      uclicks: bigint;
      complaints: bigint;
      unsubs: bigint;
    }[]
  >`
    WITH s AS (
      SELECT id, status FROM "Send"
      WHERE "workspaceId" = ${workspaceId} AND "sentAt" >= (now() AT TIME ZONE 'UTC') - interval '30 days'
    )
    SELECT
      (SELECT count(*) FROM s) AS sent,
      (SELECT count(*) FROM s WHERE status NOT IN ('BOUNCED', 'FAILED')) AS delivered,
      (SELECT count(*) FROM s WHERE status = 'BOUNCED') AS bounced,
      (SELECT count(DISTINCT e."sendId") FROM "Event" e JOIN s ON s.id = e."sendId" WHERE e.type = 'OPEN' AND NOT e."isMachine") AS uopens,
      (SELECT count(*) FROM "Event" e JOIN s ON s.id = e."sendId" WHERE e.type = 'OPEN' AND e."isMachine") AS machine,
      (SELECT count(DISTINCT e."sendId") FROM "Event" e JOIN s ON s.id = e."sendId" WHERE e.type = 'CLICK') AS uclicks,
      (SELECT count(*) FROM "Event" e JOIN s ON s.id = e."sendId" WHERE e.type = 'COMPLAINT') AS complaints,
      (SELECT count(*) FROM "Event" e JOIN s ON s.id = e."sendId" WHERE e.type = 'UNSUBSCRIBE') AS unsubs`;

  const series = await prisma.$queryRaw<{ day: string; sent: bigint; opens: bigint }[]>`
    WITH days AS (
      SELECT generate_series(
        (date_trunc('day', now() AT TIME ZONE ${tz}) - interval '29 days')::date,
        (date_trunc('day', now() AT TIME ZONE ${tz}))::date,
        interval '1 day')::date AS day
    ),
    sent AS (
      SELECT (("sentAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date AS day, count(*) AS c
      FROM "Send"
      WHERE "workspaceId" = ${workspaceId} AND "sentAt" >= (now() AT TIME ZONE 'UTC') - interval '31 days'
      GROUP BY 1
    ),
    opens AS (
      SELECT (("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date AS day, count(DISTINCT "sendId") AS c
      FROM "Event"
      WHERE "workspaceId" = ${workspaceId} AND type = 'OPEN' AND NOT "isMachine"
        AND "createdAt" >= (now() AT TIME ZONE 'UTC') - interval '31 days'
      GROUP BY 1
    )
    SELECT to_char(days.day, 'YYYY-MM-DD') AS day, coalesce(sent.c, 0) AS sent, coalesce(opens.c, 0) AS opens
    FROM days LEFT JOIN sent USING (day) LEFT JOIN opens USING (day)
    ORDER BY days.day`;

  const mailboxes = await prisma.mailbox.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
  const sentTodayByMailbox = await prisma.send.groupBy({
    by: ["mailboxId"],
    where: { workspaceId, sentAt: { gte: todayStart } },
    _count: { _all: true },
  });

  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { mailbox: { select: { name: true } }, pool: { select: { name: true } } },
  });

  const sent30 = n(eng?.sent);
  const delivered = n(eng?.delivered);
  return {
    volume: { today: n(volume?.today), d7: n(volume?.d7), d30: n(volume?.d30), prev30: n(volume?.prev30) },
    rates: {
      sent: sent30,
      delivered,
      deliveryRate: percent(delivered, sent30),
      openRate: percent(n(eng?.uopens), delivered),
      clickRate: percent(n(eng?.uclicks), delivered),
      bounceRate: percent(n(eng?.bounced), sent30, 2),
      complaintRate: percent(n(eng?.complaints), delivered, 2),
      unsubscribes: n(eng?.unsubs),
      machineOpens: n(eng?.machine),
    },
    series: series.map((r) => ({ day: r.day, sent: n(r.sent), opens: n(r.opens) })),
    mailboxes: mailboxes.map((m) => {
      const limit = effectiveDailyLimit(m);
      const sentToday = sentTodayByMailbox.find((g) => g.mailboxId === m.id)?._count._all ?? 0;
      return {
        id: m.id,
        name: m.name,
        fromEmail: m.fromEmail,
        status: m.status,
        healthScore: Math.round(m.healthScore),
        sentToday,
        dailyLimit: limit,
        warmup:
          m.warmupEnabled && m.warmupStartedAt
            ? {
                day: Math.floor((Date.now() - m.warmupStartedAt.getTime()) / 86_400_000) + 1,
                of: m.warmupDays,
              }
            : null,
        lastUsedAt: m.lastUsedAt?.toISOString() ?? null,
      };
    }),
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      sender: c.mailbox?.name ?? (c.pool ? `${c.pool.name} (pool)` : "—"),
      sentCount: c.sentCount,
      openRate: percent(c.uniqueOpenCount, c.deliveredCount),
      clickRate: percent(c.uniqueClickCount, c.deliveredCount),
      date: (c.completedAt ?? c.scheduledAt ?? c.updatedAt).toISOString(),
    })),
  };
}

export type Overview = Awaited<ReturnType<typeof getOverview>>;
