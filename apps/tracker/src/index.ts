import { z } from "zod";
import { loadEnv } from "@mailfox/core";
import { getPrisma } from "@mailfox/db";
import { buildTracker } from "./app.js";

const env = loadEnv(
  z.object({
    DATABASE_URL: z.string().min(1),
    TRACKER_PORT: z.coerce.number().int().positive().default(3001),
    HOST: z.string().default("0.0.0.0"),
  }),
);

const prisma = getPrisma();
const app = buildTracker({
  checkDatabase: () =>
    prisma.$queryRaw`SELECT 1`.then(
      () => true,
      () => false,
    ),
});

await app.listen({ port: env.TRACKER_PORT, host: env.HOST });

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    void app
      .close()
      .then(() => prisma.$disconnect())
      .then(() => process.exit(0));
  });
}
