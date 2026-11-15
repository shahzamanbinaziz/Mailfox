import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mailfox/ui/components";
import { getWorkspaceContext } from "@/lib/auth/context";
import { prisma } from "@/lib/server";
import { SessionsList, TwoFactorCard } from "../forms";

export const metadata: Metadata = { title: "Security" };

export default async function SecuritySettings() {
  const ctx = await getWorkspaceContext();
  const [user, sessions] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: ctx.user.id },
      select: { totpEnabled: true, recoveryCodeHashes: true },
    }),
    prisma.session.findMany({
      where: { userId: ctx.user.id, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
    }),
  ]);
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Two-factor authentication</CardTitle>
            <CardDescription>A code from your phone at every sign-in.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TwoFactorCard enabled={user.totpEnabled} recoveryLeft={user.recoveryCodeHashes.length} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>
              Devices signed in to your account. Sign out any you don’t recognise.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SessionsList
            sessions={sessions.map((s) => ({
              id: s.id,
              current: s.id === ctx.session.id,
              ip: s.ip,
              userAgent: s.userAgent,
              lastSeenAt: s.lastSeenAt.toISOString(),
              createdAt: s.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
