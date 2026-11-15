import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * TOTP (RFC 6238) for 2FA with Google Authenticator / 1Password / Authy.
 * SHA-1, 6 digits, 30-second steps — the defaults every authenticator app supports.
 * Verified against the RFC 6238 Appendix B test vectors in core.test.ts.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** New random 160-bit secret, base32-encoded (what authenticator apps expect). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export interface TotpOptions {
  digits?: number;
  period?: number;
  algorithm?: "sha1" | "sha256" | "sha512";
}

/** HOTP/TOTP code for a counter value (RFC 4226 dynamic truncation). */
export function hotp(
  key: Buffer,
  counter: number,
  { digits = 6, algorithm = "sha1" }: TotpOptions = {},
): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac(algorithm, key).update(msg).digest();
  const offset = (mac[mac.length - 1] ?? 0) & 0x0f;
  const bin =
    (((mac[offset] ?? 0) & 0x7f) << 24) |
    ((mac[offset + 1] ?? 0) << 16) |
    ((mac[offset + 2] ?? 0) << 8) |
    (mac[offset + 3] ?? 0);
  return String(bin % 10 ** digits).padStart(digits, "0");
}

export function totp(secretBase32: string, timeMs = Date.now(), opts: TotpOptions = {}): string {
  const period = opts.period ?? 30;
  return hotp(base32Decode(secretBase32), Math.floor(timeMs / 1000 / period), opts);
}

/**
 * Verify a user-entered code, accepting ±`window` steps of clock drift.
 * Returns the matched time-step (store it to block replay of the same code), or null.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  {
    window = 1,
    timeMs = Date.now(),
    period = 30,
  }: { window?: number; timeMs?: number; period?: number } = {},
): number | null {
  const clean = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const key = base32Decode(secretBase32);
  const step = Math.floor(timeMs / 1000 / period);
  for (let w = -window; w <= window; w++) {
    const expected = Buffer.from(hotp(key, step + w));
    if (timingSafeEqual(expected, Buffer.from(clean))) return step + w;
  }
  return null;
}

/** otpauth:// URI that authenticator apps read from a QR code. */
export function totpUri(secretBase32: string, account: string, issuer = "Mailfox"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
