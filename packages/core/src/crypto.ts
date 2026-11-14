import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * AES-256-GCM encryption for secrets at rest (SMTP/IMAP passwords, TOTP secrets, webhook secrets).
 *
 * Format: `v1:<iv b64url>:<authTag b64url>:<ciphertext b64url>` — versioned so keys/algorithms can rotate.
 * The key is 32 raw bytes, supplied base64-encoded via ENCRYPTION_KEY.
 */
const VERSION = "v1";
const IV_BYTES = 12; // GCM standard nonce size

export function parseEncryptionKey(base64Key: string | undefined): Buffer {
  if (!base64Key) throw new Error("ENCRYPTION_KEY is not set");
  const key = Buffer.from(base64Key, "base64");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must decode to 32 bytes (got ${key.length}). Generate one with: openssl rand -base64 32`,
    );
  }
  return key;
}

export function encryptSecret(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptSecret(payload: string, key: Buffer): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== VERSION || !ivB64 || !tagB64 || dataB64 === undefined) {
    throw new Error("Unsupported or malformed encrypted payload");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64url")), decipher.final()]).toString(
    "utf8",
  );
}

/** SHA-256 hex digest — for storing API keys / tokens (never store them in plain text). */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** HMAC-SHA256 signature (base64url) for tamper-proof tracking and unsubscribe links. */
export function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifySignature(value: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(sign(value, secret));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** URL-safe random token (e.g. double opt-in confirmation, invitation, VERP id). */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}
