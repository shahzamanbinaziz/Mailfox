import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is read lazily so `prisma generate` works without a database.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://mailfox:mailfox@localhost:5432/mailfox",
  },
});
