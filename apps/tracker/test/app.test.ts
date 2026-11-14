import { describe, expect, it } from "vitest";
import { PIXEL_GIF, buildTracker } from "../src/app.js";

describe("tracker", () => {
  it("reports healthy when the database answers", async () => {
    const app = buildTracker({ checkDatabase: async () => true });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok", service: "tracker" });
    await app.close();
  });

  it("returns 503 when the database is down", async () => {
    const app = buildTracker({ checkDatabase: async () => false });
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(503);
    await app.close();
  });

  it("ships a valid 1x1 GIF for the open pixel", () => {
    expect(PIXEL_GIF.subarray(0, 6).toString("ascii")).toBe("GIF89a");
  });
});
