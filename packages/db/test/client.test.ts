import { describe, expect, it } from "vitest";
import { createPrismaClient, ContactStatus, SendStatus } from "../src/index.js";

describe("@mailfox/db", () => {
  it("requires a connection string", () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(() => createPrismaClient()).toThrow(/DATABASE_URL/);
    if (prev) process.env.DATABASE_URL = prev;
  });

  it("exports generated enums", () => {
    expect(ContactStatus.SUBSCRIBED).toBe("SUBSCRIBED");
    expect(SendStatus.SUPPRESSED).toBe("SUPPRESSED");
  });

  it.skipIf(!process.env.DATABASE_URL_TEST)("connects to a real database", async () => {
    const prisma = createPrismaClient({ connectionString: process.env.DATABASE_URL_TEST });
    const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
    expect(rows[0]?.ok).toBe(1);
    await prisma.$disconnect();
  });
});
