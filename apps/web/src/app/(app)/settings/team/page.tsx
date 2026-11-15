import type { Metadata } from "next";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mailfox/ui/components";
import type { RoleName } from "@mailfox/core";
import { getWorkspaceContext } from "@/lib/auth/context";
import { prisma } from "@/lib/server";
import { TeamTable } from "../forms";

export const metadata: Metadata = { title: "Team" };

export default async function TeamSettings() {
  const ctx = await getWorkspaceContext();
  const members = await prisma.membership.findMany({
    where: { workspaceId: ctx.workspace.id },
    include: { user: { select: { name: true, email: true, totpEnabled: true, lastLoginAt: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Team members</CardTitle>
          <CardDescription>
            Owners and admins manage roles. Editors create and send; viewers can only look.
          </CardDescription>
        </div>
        <Badge variant="neutral">Invites by email: Phase 8</Badge>
      </CardHeader>
      <CardContent>
        <TeamTable
          canManage={ctx.can("ADMIN")}
          isOwner={ctx.role === "OWNER"}
          members={members.map((m) => ({
            id: m.id,
            name: m.user.name ?? "",
            email: m.user.email,
            role: m.role as RoleName,
            self: m.userId === ctx.user.id,
            totpEnabled: m.user.totpEnabled,
            lastLoginAt: m.user.lastLoginAt?.toISOString() ?? null,
          }))}
        />
      </CardContent>
    </Card>
  );
}
