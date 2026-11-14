/** Workspace roles, highest privilege first. Mirrors the Prisma `Role` enum. */
export const ROLES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;
export type RoleName = (typeof ROLES)[number];

const rank: Record<RoleName, number> = { OWNER: 4, ADMIN: 3, EDITOR: 2, VIEWER: 1 };

/** True when `role` is at least as privileged as `required`. */
export function hasRole(role: RoleName, required: RoleName): boolean {
  return rank[role] >= rank[required];
}
