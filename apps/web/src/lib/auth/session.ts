import "server-only";
import { randomToken, sha256, sign, verifySignature } from "@mailfox/core";
import { getEnv, prisma } from "../server";

/**
 * Database sessions (the pattern Lucia's author recommends after deprecating the library):
 * - the browser holds a random 256-bit token in an httpOnly cookie,
 * - Postgres stores only its SHA-256 hash, so a DB leak can't be replayed,
 * - sessions slide: used within 15 days of expiry → extended to 30 days,
 * - deleting rows signs devices out ("sign out other devices", password change).
 */
export const SESSION_COOKIE = "mf_session";
export const PENDING_2FA_COOKIE = "mf_2fa";
export const WORKSPACE_COOKIE = "mf_ws";

const DAY = 24 * 60 * 60 * 1000;
const SESSION_TTL = 30 * DAY;
const REFRESH_WITHIN = 15 * DAY;
const LAST_SEEN_GRANULARITY = 5 * 60 * 1000;

export function secureCookies(): boolean {
  return getEnv().APP_URL.startsWith("https://");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookies(),
    path: "/",
    // Validity is decided by the DB row; the cookie just needs to outlive it.
    maxAge: 400 * 24 * 60 * 60,
  };
}

export async function createSession(userId: string, meta: { ip?: string | null; userAgent?: string | null }) {
  const token = randomToken(32);
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      ip: meta.ip ?? null,
      userAgent: meta.userAgent?.slice(0, 400) ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL),
    },
  });
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  return { token, session };
}

export async function validateSessionToken(token: string) {
  const row = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, email: true, name: true, avatarUrl: true, totpEnabled: true } } },
  });
  if (!row) return null;
  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    await prisma.session.delete({ where: { id: row.id } }).catch(() => undefined);
    return null;
  }
  const data: { expiresAt?: Date; lastSeenAt?: Date } = {};
  if (row.expiresAt.getTime() - now < REFRESH_WITHIN) data.expiresAt = new Date(now + SESSION_TTL);
  if (now - row.lastSeenAt.getTime() > LAST_SEEN_GRANULARITY) data.lastSeenAt = new Date(now);
  if (data.expiresAt || data.lastSeenAt)
    await prisma.session.update({ where: { id: row.id }, data }).catch(() => undefined);
  const { user, ...session } = row;
  return { session, user };
}

export type AuthResult = NonNullable<Awaited<ReturnType<typeof validateSessionToken>>>;

export async function invalidateSession(sessionId: string) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function invalidateOtherSessions(userId: string, keepSessionId: string) {
  const { count } = await prisma.session.deleteMany({ where: { userId, id: { not: keepSessionId } } });
  return count;
}

// ── Pending 2FA ticket ───────────────────────────────────────
// After a correct password for a 2FA account we issue a short-lived, HMAC-signed ticket
// (not a session) that only the 2FA step accepts.
const TICKET_TTL = 5 * 60 * 1000;

export function createPendingTicket(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + TICKET_TTL })).toString(
    "base64url",
  );
  return `${payload}.${sign(`2fa:${payload}`, getEnv().AUTH_SECRET)}`;
}

export function readPendingTicket(ticket: string | undefined): string | null {
  if (!ticket) return null;
  const [payload, sig] = ticket.split(".");
  if (!payload || !sig || !verifySignature(`2fa:${payload}`, sig, getEnv().AUTH_SECRET)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      uid: string;
      exp: number;
    };
    return exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}
