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
