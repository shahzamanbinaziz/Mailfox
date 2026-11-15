import type { Metadata } from "next";
import { NoCampaignsIllustration } from "@mailfox/ui";
import { Badge, Card, Table, Td, Th, Tr, cn } from "@mailfox/ui/components";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getWorkspaceContext } from "@/lib/auth/context";
import { fmt, fmtDate, fmtPct } from "@/lib/format";
import { prisma } from "@/lib/server";
import { percent } from "@mailfox/core";

export const metadata: Metadata = { title: "Campaigns" };

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const ctx = await getWorkspaceContext();
  const { highlight } = await searchParams;
  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId: ctx.workspace.id, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      mailbox: { select: { name: true } },
      pool: { select: { name: true } },
      _count: { select: { variants: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Every campaign in this workspace."
        eyebrow={<Badge>Campaign wizard arrives in Phase 6</Badge>}
      />
      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center py-14 text-center">
          <NoCampaignsIllustration />
          <h2 className="mt-2 text-lg font-bold">No campaigns yet</h2>
          <p className="text-sm text-muted-foreground">
            Create your first campaign once the wizard lands in Phase 6.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th>Campaign</Th>
                <Th>Status</Th>
                <Th>Sender</Th>
                <Th>When</Th>
                <Th className="text-right">Recipients</Th>
                <Th className="text-right">Open rate</Th>
                <Th className="text-right">Click rate</Th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <Tr key={c.id} className={cn(highlight === c.id && "bg-accent/60")}>
                  <Td className="max-w-[320px]">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.subject}
                      {c.abEnabled && ` · A/B test (${c._count.variants} variants)`}
                    </p>
                  </Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                  <Td className="text-muted-foreground">
                    {c.mailbox?.name ?? (c.pool ? `${c.pool.name} (pool)` : "—")}
                  </Td>
                  <Td className="text-muted-foreground">
                    {fmtDate(c.completedAt ?? c.scheduledAt ?? c.createdAt, ctx.workspace.timezone)}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {c.recipientCount ? fmt(c.recipientCount) : "—"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {c.deliveredCount ? fmtPct(percent(c.uniqueOpenCount, c.deliveredCount)) : "—"}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {c.deliveredCount ? fmtPct(percent(c.uniqueClickCount, c.deliveredCount)) : "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
