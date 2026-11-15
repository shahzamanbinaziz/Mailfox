"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/server";
import { audit, getAuth, getWorkspaceContext } from "@/lib/auth/context";
import { SESSION_COOKIE, WORKSPACE_COOKIE, invalidateSession, secureCookies } from "@/lib/auth/session";

export async function logoutAction(): Promise<void> {
  const auth = await getAuth();
  if (auth) {
    const m = await prisma.membership.findFirst({ where: { userId: auth.user.id } });
    if (m) await audit({ workspaceId: m.workspaceId, userId: auth.user.id }, "user.logout");
    await invalidateSession(auth.session.id);
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function switchWorkspaceAction(workspaceId: string): Promise<void> {
  const ctx = await getWorkspaceContext();
  if (!ctx.memberships.some((m) => m.workspaceId === workspaceId)) return;
  (await cookies()).set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: 365 * 24 * 3600,
  });
  revalidatePath("/", "layout");
}

export async function markNotificationsReadAction(): Promise<void> {
  const ctx = await getWorkspaceContext();
  await prisma.notification.updateMany({
    where: { workspaceId: ctx.workspace.id, readAt: null, OR: [{ userId: null }, { userId: ctx.user.id }] },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}

export async function setSidebarCollapsedAction(collapsed: boolean): Promise<void> {
  (await cookies()).set("mf_sidebar", collapsed ? "collapsed" : "expanded", {
    path: "/",
    sameSite: "lax",
    maxAge: 365 * 24 * 3600,
  });
}
