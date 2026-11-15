import { Redis } from "ioredis";
import { hashPassword } from "@mailfox/core";
import { createPrismaClient } from "@mailfox/db";

export const E2E_EMAIL = "e2e-admin@mailfox.local";
export const E2E_PASSWORD = "e2e-fox-password-42";

/** Fresh admin user in the demo workspace for every run (no 2FA, no sessions, no rate-limit history). */
export default async function globalSetup() {
  const prisma = createPrismaClient({ connectionString: process.env.DATABASE_URL });
  try {
    const ws = await prisma.workspace.findUnique({ where: { slug: "mailfox-demo" } });
    if (!ws) throw new Error("Demo workspace missing — run `pnpm db:seed` first.");
    await prisma.user.deleteMany({ where: { email: E2E_EMAIL } });
    await prisma.user.create({
      data: {
        email: E2E_EMAIL,
        name: "E2E Admin",
        passwordHash: await hashPassword(E2E_PASSWORD),
        memberships: { create: { workspaceId: ws.id, role: "ADMIN" } },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: 1 });
  try {
    const keys = await redis.keys("mf:rl:*");
    if (keys.length) await redis.del(...keys);
  } catch {
    /* Redis optional for E2E */
  } finally {
    redis.disconnect();
  }
}
