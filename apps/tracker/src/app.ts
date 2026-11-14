import Fastify, { type FastifyInstance } from "fastify";

/** 43-byte transparent GIF used by the open-tracking pixel (Phase 7). */
export const PIXEL_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export interface TrackerDeps {
  /** Returns true when the database answers. Injected so the app is testable without Postgres. */
  checkDatabase: () => Promise<boolean>;
}

/**
 * Mailfox tracker — tiny public service for open pixels, click redirects and unsubscribe pages.
 * Phase 0 ships the service shell + health check; tracking routes arrive in Phase 7.
 */
export function buildTracker(deps: TrackerDeps): FastifyInstance {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" }, trustProxy: true });

  app.get("/health", async (_req, reply) => {
    const database = (await deps.checkDatabase()) ? "ok" : "error";
    return reply
      .code(database === "ok" ? 200 : 503)
      .header("cache-control", "no-store")
      .send({ status: database === "ok" ? "ok" : "degraded", service: "tracker", database });
  });

  app.get("/", async () => ({
    service: "mailfox-tracker",
    docs: "Tracking endpoints are added in Phase 7.",
  }));

  return app;
}
