import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  decryptSecret,
  encryptSecret,
  hasRole,
  loadEnv,
  normalizeEmail,
  parseEncryptionKey,
  percent,
  sign,
  slugify,
  verifySignature,
} from "../src/index.js";

const key = randomBytes(32);

describe("encryption (AES-256-GCM)", () => {
  it("round-trips secrets", () => {
    const enc = encryptSecret("smtp-p@ssw0rd ✉️", key);
    expect(enc.startsWith("v1:")).toBe(true);
    expect(enc).not.toContain("smtp-p@ssw0rd");
    expect(decryptSecret(enc, key)).toBe("smtp-p@ssw0rd ✉️");
  });

  it("uses a fresh IV every time", () => {
    expect(encryptSecret("same", key)).not.toBe(encryptSecret("same", key));
  });

  it("rejects tampered ciphertext", () => {
    const enc = encryptSecret("secret", key);
    const parts = enc.split(":");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptSecret(parts.join(":"), key)).toThrow();
  });

  it("rejects the wrong key", () => {
    const enc = encryptSecret("secret", key);
    expect(() => decryptSecret(enc, randomBytes(32))).toThrow();
  });

  it("validates key length", () => {
    expect(() => parseEncryptionKey(randomBytes(16).toString("base64"))).toThrow(/32 bytes/);
    expect(parseEncryptionKey(key.toString("base64")).length).toBe(32);
    expect(() => parseEncryptionKey(undefined)).toThrow(/not set/);
  });
});

describe("signatures", () => {
  it("verifies and rejects", () => {
    const sig = sign("send_123|https://example.com", "secret-secret-secret");
    expect(verifySignature("send_123|https://example.com", sig, "secret-secret-secret")).toBe(true);
    expect(verifySignature("send_123|https://evil.com", sig, "secret-secret-secret")).toBe(false);
  });
});

describe("utils", () => {
  it("normalizes emails", () => {
    expect(normalizeEmail("  Ali@Example.COM ")).toBe("ali@example.com");
    expect(normalizeEmail("not-an-email")).toBeNull();
  });
  it("slugifies", () => expect(slugify("Mailfox Demo Workspace!")).toBe("mailfox-demo-workspace"));
  it("percent", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(5, 0)).toBe(0);
  });
  it("roles", () => {
    expect(hasRole("ADMIN", "EDITOR")).toBe(true);
    expect(hasRole("VIEWER", "EDITOR")).toBe(false);
  });
});

describe("loadEnv", () => {
  it("reports every problem at once", () => {
    const schema = z.object({ A: z.string(), B: z.coerce.number() });
    expect(() => loadEnv(schema, { B: "x" })).toThrow(/A:[\s\S]*B:/);
    expect(loadEnv(schema, { A: "a", B: "2" })).toEqual({ A: "a", B: 2 });
  });
});

import {
  base32Decode,
  base32Encode,
  hotp,
  totp,
  totpUri,
  verifyTotp,
  generateTotpSecret,
  hashPassword,
  verifyPassword,
  passwordSchema,
} from "../src/index.js";

describe("TOTP (RFC 6238 Appendix B vectors, SHA-1, 8 digits)", () => {
  const secret = base32Encode(Buffer.from("12345678901234567890"));
  it.each([
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ])("t=%i → %s", (t, code) => {
    expect(totp(secret, t * 1000, { digits: 8 })).toBe(code);
  });

  it("RFC 4226 HOTP vector", () => {
    expect(hotp(Buffer.from("12345678901234567890"), 1)).toBe("287082");
  });

  it("base32 round-trips", () => {
    const b = Buffer.from("hello fox!");
    expect(base32Decode(base32Encode(b)).toString()).toBe("hello fox!");
  });

  it("verifies within ±1 step and rejects outside", () => {
    const s = generateTotpSecret();
    const now = 1_800_000_000_000;
    expect(verifyTotp(s, totp(s, now), { timeMs: now })).toBe(Math.floor(now / 30000));
    expect(verifyTotp(s, totp(s, now - 30_000), { timeMs: now })).not.toBeNull();
    expect(verifyTotp(s, totp(s, now - 90_000), { timeMs: now })).toBeNull();
    expect(verifyTotp(s, "12ab56", { timeMs: now })).toBeNull();
  });

  it("builds an otpauth URI", () => {
    expect(totpUri("ABC", "a@b.co")).toMatch(
      /^otpauth:\/\/totp\/Mailfox%3Aa%40b\.co\?secret=ABC&issuer=Mailfox/,
    );
  });
});

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const h = await hashPassword("fox-secret-123");
    expect(await verifyPassword("fox-secret-123", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
    expect(await verifyPassword("anything", null)).toBe(false);
  }, 20_000);

  it("enforces policy", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("longbutnodigits").success).toBe(false);
    expect(passwordSchema.safeParse("long-enough-123").success).toBe(true);
  });
});

import { effectiveDailyLimit } from "../src/index.js";

describe("effectiveDailyLimit (warmup)", () => {
  const base = { maxPerDay: 1000, warmupEnabled: true, warmupDays: 11, warmupStartPerDay: 100 };
  const start = new Date("2026-01-01T00:00:00Z");
  it("ramps linearly from start to max", () => {
    expect(effectiveDailyLimit({ ...base, warmupStartedAt: start }, new Date("2026-01-01T12:00:00Z"))).toBe(
      100,
    );
    expect(effectiveDailyLimit({ ...base, warmupStartedAt: start }, new Date("2026-01-06T12:00:00Z"))).toBe(
      550,
    );
    expect(effectiveDailyLimit({ ...base, warmupStartedAt: start }, new Date("2026-02-01T00:00:00Z"))).toBe(
      1000,
    );
  });
  it("uses an explicit schedule when present, capped at max", () => {
    const schedule = [
      { day: 1, limit: 50 },
      { day: 3, limit: 200 },
      { day: 5, limit: 5000 },
    ];
    const m = { ...base, warmupStartedAt: start, warmupSchedule: schedule };
    expect(effectiveDailyLimit(m, new Date("2026-01-02T00:00:00Z"))).toBe(50);
    expect(effectiveDailyLimit(m, new Date("2026-01-04T00:00:00Z"))).toBe(200);
    expect(effectiveDailyLimit(m, new Date("2026-01-09T00:00:00Z"))).toBe(1000);
  });
  it("is the plain max when warmup is off", () => {
    expect(effectiveDailyLimit({ ...base, warmupEnabled: false, warmupStartedAt: null })).toBe(1000);
  });
});
