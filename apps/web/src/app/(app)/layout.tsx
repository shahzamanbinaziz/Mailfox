import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/AppShell";
import { getWorkspaceContext } from "@/lib/auth/context";
import { prisma } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getWorkspaceContext();
  const notifications = await prisma.notification.findMany({
    where: { workspaceId: ctx.workspace.id, OR: [{ userId: null }, { userId: ctx.user.id }] },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const collapsed = (await cookies()).get("mf_sidebar")?.value === "collapsed";

  return (
    <AppShell
      user={{ name: ctx.user.name ?? "", email: ctx.user.email, avatarUrl: ctx.user.avatarUrl }}
      role={ctx.role}
      workspaces={ctx.memberships.map((m) => ({ id: m.workspaceId, name: m.workspace.name, role: m.role }))}
      currentWorkspaceId={ctx.workspace.id}
      notifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        href: n.href,
        createdAt: n.createdAt.toISOString(),
        read: n.readAt !== null,
      }))}
      initialCollapsed={collapsed}
    >
      {children}
    </AppShell>
  );
}
