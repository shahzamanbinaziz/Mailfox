import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Info, Plus } from "lucide-react";
import { NoCampaignsIllustration, NoMailboxesIllustration } from "@mailfox/ui";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  Td,
  Th,
  Tr,
  cn,
} from "@mailfox/ui/components";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { QueueStatus } from "@/components/dashboard/QueueStatus";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { getWorkspaceContext } from "@/lib/auth/context";
import { getOverview } from "@/lib/dashboard";
import { fmt, fmtPct, timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

type Tone = "good" | "warn" | "bad" | "neutral";

function RateTile({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: Tone;
  hint?: string;
}) {
  const toneLabel = { good: "Healthy", warn: "Watch", bad: "Action needed", neutral: null }[tone];
  const toneClass = {
    good: "text-success",
    warn: "text-warning",
    bad: "text-destructive",
    neutral: "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className={cn("mt-1 min-h-4 text-[11px] font-semibold", toneClass)}>{toneLabel ?? hint ?? ""}</p>
    </div>
  );
}

function VolumeTile({ label, value, delta }: { label: string; value: number; delta?: number | null }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-4xl font-extrabold tabular-nums tracking-tight">{fmt(value)}</p>
        {delta !== undefined && delta !== null && (
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 text-xs font-semibold",
              delta >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta)}% vs prior 30d
          </span>
        )}
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const ctx = await getWorkspaceContext();
  const o = await getOverview(ctx.workspace.id, ctx.workspace.timezone);
  const r = o.rates;
  const delta30 =
    o.volume.prev30 > 0 ? Math.round(((o.volume.d30 - o.volume.prev30) / o.volume.prev30) * 100) : null;
  const firstName = ctx.user.name?.split(" ")[0];
  const canEdit = ctx.can("EDITOR");

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Overview"}
        description={`${ctx.workspace.name} · last 30 days · times in ${ctx.workspace.timezone}`}
        actions={
          canEdit && (
            <Button asChild>
              <Link href="/campaigns">
                <Plus /> New campaign
              </Link>
            </Button>
          )
        }
      />

      <section aria-label="Send volume" className="grid gap-4 sm:grid-cols-3">
        <VolumeTile label="Sent today" value={o.volume.today} />
        <VolumeTile label="Last 7 days" value={o.volume.d7} />
        <VolumeTile label="Last 30 days" value={o.volume.d30} delta={delta30} />
      </section>

      <section
        aria-label="Engagement and deliverability"
        className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
      >
        <RateTile
          label="Delivery rate"
          value={fmtPct(r.deliveryRate)}
          tone={
            r.sent === 0 ? "neutral" : r.deliveryRate >= 98 ? "good" : r.deliveryRate >= 95 ? "warn" : "bad"
          }
        />
        <RateTile
          label="Open rate"
          value={fmtPct(r.openRate)}
          hint={r.machineOpens ? `${fmt(r.machineOpens)} machine opens excluded` : "Unique, human opens"}
        />
        <RateTile label="Click rate" value={fmtPct(r.clickRate)} hint="Unique clicks / delivered" />
        <RateTile
          label="Bounce rate"
          value={fmtPct(r.bounceRate, 2)}
          tone={r.sent === 0 ? "neutral" : r.bounceRate < 2 ? "good" : r.bounceRate < 5 ? "warn" : "bad"}
        />
        <RateTile
          label="Complaint rate"
          value={fmtPct(r.complaintRate, 2)}
          tone={
            r.sent === 0 ? "neutral" : r.complaintRate < 0.1 ? "good" : r.complaintRate < 0.3 ? "warn" : "bad"
          }
        />
        <RateTile label="Unsubscribes" value={fmt(r.unsubscribes)} hint="Last 30 days" />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Send volume</CardTitle>
              <CardDescription>Daily emails sent and unique human opens.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <VolumeChart data={o.series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Queue status</CardTitle>
              <CardDescription>Jobs waiting in Redis right now.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <QueueStatus />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent campaigns</CardTitle>
              <CardDescription>Latest activity across this workspace.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/campaigns">View all</Link>
            </Button>
          </CardHeader>
          {o.campaigns.length === 0 ? (
            <CardContent className="flex flex-col items-center py-6 text-center">
              <NoCampaignsIllustration width={180} height={135} />
              <p className="mt-2 font-semibold">No campaigns yet</p>
              <p className="text-sm text-muted-foreground">Your first campaign will show up here.</p>
            </CardContent>
          ) : (
            <Table>
              <thead>
                <tr className="border-y border-border bg-muted/40">
                  <Th>Campaign</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Sent</Th>
                  <Th className="text-right">Opens</Th>
                  <Th className="text-right">Clicks</Th>
                </tr>
              </thead>
              <tbody>
                {o.campaigns.map((c) => (
                  <Tr key={c.id}>
                    <Td className="max-w-[260px]">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.sender} · {timeAgo(c.date)}
                      </p>
                    </Td>
                    <Td>
                      <StatusBadge status={c.status} />
                    </Td>
                    <Td className="text-right tabular-nums">{c.sentCount ? fmt(c.sentCount) : "—"}</Td>
                    <Td className="text-right tabular-nums">{c.sentCount ? fmtPct(c.openRate) : "—"}</Td>
                    <Td className="text-right tabular-nums">{c.sentCount ? fmtPct(c.clickRate) : "—"}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Mailbox health</CardTitle>
              <CardDescription>Today’s usage against each daily limit.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {o.mailboxes.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <NoMailboxesIllustration width={160} height={120} />
                <p className="mt-2 text-sm text-muted-foreground">Connect a mailbox to start sending.</p>
              </div>
            ) : (
              <ul className="grid gap-4">
                {o.mailboxes.map((m) => {
                  const pct = m.dailyLimit
                    ? Math.min(100, Math.round((m.sentToday / m.dailyLimit) * 100))
                    : 0;
                  return (
                    <li key={m.id}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{m.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.fromEmail}</p>
                        </div>
                        <StatusBadge status={m.status} />
                      </div>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${m.name} daily usage`}
                      >
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                        <span className="tabular-nums">
                          {fmt(m.sentToday)} / {fmt(m.dailyLimit)} today
                          {m.warmup && ` · warmup day ${m.warmup.day} of ${m.warmup.of}`}
                        </span>
                        <span className="font-semibold text-foreground">Health {m.healthScore}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5" /> Open rates exclude Apple Mail Privacy Protection and scanner opens so
        they stay honest.
        <Badge variant="neutral" className="ml-1">
          Gmail/Yahoo rule: complaints &lt; 0.3%
        </Badge>
      </p>
    </>
  );
}
