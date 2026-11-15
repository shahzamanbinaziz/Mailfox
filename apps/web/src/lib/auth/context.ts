import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasRole, type RoleName } from "@mailfox/core";
import { prisma } from "../server";
import { SESSION_COOKIE, WORKSPACE_COOKIE, validateSessionToken } from "./session";

/** Current session + user, or null. Cached per request. */
export const getAuth = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return validateSessionToken(token);
});

export async function requireAuth() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  return auth;
}

/** Auth + the active workspace (from the mf_ws cookie, falling back to the first membership). */
export const getWorkspaceContext = cache(async () => {
  const auth = await requireAuth();
  const memberships = await prisma.membership.findMany({
    where: { userId: auth.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  const wanted = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  const membership = memberships.find((m) => m.workspaceId === wanted) ?? memberships[0];
  if (!membership) redirect("/login?error=no-workspace");
  return {
    ...auth,
    memberships,
    membership,
    workspace: membership.workspace,
    role: membership.role as RoleName,
    can: (required: RoleName) => hasRole(membership.role as RoleName, required),
  };
});

export type WorkspaceContext = Awaited<ReturnType<typeof getWorkspaceContext>>;

export class ForbiddenError extends Error {
  constructor(required: RoleName) {
    super(`This action needs the ${required.toLowerCase()} role or higher.`);
  }
}

/** For server actions: throws ForbiddenError when the role is too low. */
export async function requireRole(required: RoleName): Promise<WorkspaceContext> {
  const ctx = await getWorkspaceContext();
  if (!ctx.can(required)) throw new ForbiddenError(required);
  return ctx;
}

export async function requestMeta() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return { ip, userAgent: h.get("user-agent") };
}

export async function audit(
  ctx: { workspaceId: string; userId?: string | null },
  action: string,
  entity?: { type: string; id: string },
  meta?: Record<string, unknown>,
) {
  const { ip } = await requestMeta();
  await prisma.auditLog
    .create({
      data: {
        workspaceId: ctx.workspaceId,
        userId: ctx.userId ?? null,
        action,
        entityType: entity?.type ?? null,
        entityId: entity?.id ?? null,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
        ip,
      },
    })
    .catch(() => undefined);
}
