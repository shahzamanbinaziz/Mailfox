import { getPrisma } from "@mailfox/db";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe used by Docker and Caddy. */
export async function GET() {
  const started = Date.now();
  let database: "ok" | "error" = "ok";
  try {
    await getPrisma().$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }
  const ok = database === "ok";
  return Response.json(
    { status: ok ? "ok" : "degraded", service: "web", database, latencyMs: Date.now() - started },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
