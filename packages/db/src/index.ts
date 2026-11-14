import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

export * from "./generated/prisma/client.js";

export interface CreateClientOptions {
  /** Defaults to process.env.DATABASE_URL. */
  connectionString?: string;
  /** Pool size per process (web + worker + tracker each get their own pool). */
  max?: number;
}

/** Create a Prisma client backed by the `pg` driver adapter (Prisma 7, no Rust query engine). */
export function createPrismaClient(opts: CreateClientOptions = {}): PrismaClient {
  const connectionString = opts.connectionString ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaPg({ connectionString, max: opts.max ?? 10 });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { __mailfoxPrisma?: PrismaClient };

/**
 * Process-wide singleton. In development, Next.js hot reload would otherwise create a new
 * pool on every reload and exhaust Postgres connections.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__mailfoxPrisma) globalForPrisma.__mailfoxPrisma = createPrismaClient();
  return globalForPrisma.__mailfoxPrisma;
}
