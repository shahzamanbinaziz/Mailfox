"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { decryptSecret, normalizeEmail, sha256, verifyPassword, verifyTotp } from "@mailfox/core";
import { getEncryptionKey, prisma } from "@/lib/server";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { audit, requestMeta } from "@/lib/auth/context";
import {
  PENDING_2FA_COOKIE,
  SESSION_COOKIE,
  createPendingTicket,
  createSession,
  readPendingTicket,
  secureCookies,
  sessionCookieOptions,
} from "@/lib/auth/session";

export interface LoginState {
  step: "credentials" | "2fa";
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "code", string>>;
  email?: string;
}

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email")
    .refine((v) => normalizeEmail(v) !== null, "Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const GENERIC = "Email or password is incorrect.";

async function startSession(userId: string) {
  const { token } = await createSession(userId, await requestMeta());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
  jar.delete(PENDING_2FA_COOKIE);
  const membership = await prisma.membership.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
  if (membership) await audit({ workspaceId: membership.workspaceId, userId }, "user.login");
}

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  const emailRaw = String(form.get("email") ?? "");
  if (!parsed.success) {
    const fe = z.flattenError(parsed.error).fieldErrors;
    return {
      step: "credentials",
      email: emailRaw,
      fieldErrors: { email: fe.email?.[0], password: fe.password?.[0] },
    };
  }
  const email = normalizeEmail(parsed.data.email) as string;
  const { ip } = await requestMeta();

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login:ip:${ip ?? "unknown"}`, 30, 15 * 60),
    rateLimit(`login:email:${email}`, 8, 15 * 60),
  ]);
  if (!byIp.ok || !byEmail.ok) {
    const minutes = Math.ceil(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds) / 60);
    return {
      step: "credentials",
      email,
      error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash);
  if (!user || !valid) return { step: "credentials", email, error: GENERIC };

  if (user.totpEnabled) {
    (await cookies()).set(PENDING_2FA_COOKIE, createPendingTicket(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookies(),
      path: "/",
      maxAge: 5 * 60,
    });
    return { step: "2fa", email };
  }

  await resetRateLimit(`login:email:${email}`);
  await startSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function verifyTwoFactorAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const jar = await cookies();
  const userId = readPendingTicket(jar.get(PENDING_2FA_COOKIE)?.value);
  if (!userId) return { step: "credentials", error: "Your sign-in timed out. Enter your password again." };

  const limit = await rateLimit(`2fa:${userId}`, 6, 10 * 60);
  if (!limit.ok) return { step: "2fa", error: "Too many codes tried. Wait a few minutes and sign in again." };

  const code = String(form.get("code") ?? "").replace(/\s+/g, "");
  if (!code) return { step: "2fa", fieldErrors: { code: "Enter the 6-digit code from your app" } };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpEnabled || !user.totpSecretEnc)
    return { step: "credentials", error: "Two-factor is not set up for this account." };

  if (/^\d{6}$/.test(code)) {
    const step = verifyTotp(decryptSecret(user.totpSecretEnc, getEncryptionKey()), code);
    // Reject codes from a time-step we already accepted (replay protection).
    if (step === null || (user.totpLastStep !== null && step <= user.totpLastStep)) {
      return {
        step: "2fa",
        fieldErrors: { code: "That code didn't work. Wait for a new one and try again." },
      };
    }
    await prisma.user.update({ where: { id: user.id }, data: { totpLastStep: step } });
  } else {
    // Recovery code (xxxx-xxxx). Each works once.
    const hash = sha256(code.toLowerCase());
    if (!user.recoveryCodeHashes.includes(hash)) {
      return { step: "2fa", fieldErrors: { code: "Enter a 6-digit code or one of your recovery codes" } };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { recoveryCodeHashes: user.recoveryCodeHashes.filter((h) => h !== hash) },
    });
  }

  await resetRateLimit(`login:email:${user.email}`);
  await startSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function cancelTwoFactorAction(): Promise<void> {
  (await cookies()).delete(PENDING_2FA_COOKIE);
}
