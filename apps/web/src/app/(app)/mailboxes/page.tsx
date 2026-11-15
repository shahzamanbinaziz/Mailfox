import type { Metadata } from "next";
import { NoMailboxesIllustration } from "@mailfox/ui";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@mailfox/ui/components";
import { effectiveDailyLimit } from "@mailfox/core";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getWorkspaceContext } from "@/lib/auth/context";
import { fmt } from "@/lib/format";
import { prisma } from "@/lib/server";

export const metadata: Metadata = { title: "Mailboxes" };

export default async function MailboxesPage() {
  const ctx = await getWorkspaceContext();
  const mailboxes = await prisma.mailbox.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: "asc" },
    include: {
      domain: { select: { name: true } },
      poolMembers: { include: { pool: { select: { name: true } } } },
    },
  });

  return (
    <>
      <PageHeader
        title="Mailboxes"
        description="Sending mailboxes, limits and warmup."
        eyebrow={<Badge>Add mailbox, test connection & DNS checker arrive in Phase 2</Badge>}
      />
      {mailboxes.length === 0 ? (
        <Card className="flex flex-col items-center py-14 text-center">
          <NoMailboxesIllustration />
          <h2 className="mt-2 text-lg font-bold">No mailboxes connected</h2>
          <p className="text-sm text-muted-foreground">Connecting SMTP mailboxes arrives in Phase 2.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mailboxes.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle className="text-base">{m.name}</CardTitle>
                  <p className="truncate text-sm text-muted-foreground">
                    {m.fromName} &lt;{m.fromEmail}&gt;
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[
                    ["SMTP", `${m.smtpHost}:${m.smtpPort} (${m.smtpSecurity.toLowerCase()})`],
                    ["Domain", m.domain?.name ?? "—"],
                    [
                      "Daily limit",
                      `${fmt(effectiveDailyLimit(m))}${m.warmupEnabled ? ` (warming → ${fmt(m.maxPerDay)})` : ""}`,
                    ],
                    ["Hourly limit", fmt(m.maxPerHour)],
                    ["Delay", `${m.minDelaySeconds}s + up to ${m.jitterSeconds}s jitter`],
                    ["Pools", m.poolMembers.map((p) => p.pool.name).join(", ") || "—"],
                    ["Health score", String(Math.round(m.healthScore))],
                    ["Password", m.smtpPasswordEnc ? "Encrypted (AES-256-GCM)" : "Not set"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
