import { describe, expect, it } from "vitest";
import { loadAiConfig } from "../src/index.js";

describe("loadAiConfig", () => {
  it("is disabled without key or model", () => {
    expect(loadAiConfig({}).enabled).toBe(false);
    expect(loadAiConfig({ GEMINI_API_KEY: "k" }).enabled).toBe(false);
  });
  it("reads model from env (never hardcoded)", () => {
    const c = loadAiConfig({ GEMINI_API_KEY: "k", GEMINI_MODEL: "some-model", GEMINI_RPM_LIMIT: "5" });
    expect(c).toMatchObject({
      enabled: true,
      model: "some-model",
      requestsPerMinute: 5,
      requestsPerDay: 250,
    });
  });
});
