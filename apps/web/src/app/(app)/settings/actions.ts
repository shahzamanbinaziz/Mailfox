"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { z } from "zod";
import {
  ROLES,
  decryptSecret,
  encryptSecret,
  generateTotpSecret,
  hashPassword,
  passwordSchema,
  randomToken,
  sha256,
  totpUri,
  verifyPassword,
  verifyTotp,
  type RoleName,
} from "@mailfox/core";
import { ForbiddenError, audit, getWorkspaceContext, requireRole } from "@/lib/auth/context";
import { invalidateOtherSessions } from "@/lib/auth/session";
import { getEncryptionKey, prisma } from "@/lib/server";

export interface ActionResult {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string | undefined>;
  /** Monotonic id so clients can react to every result, even identical ones. */
  at?: number;
}

const ok = (message: string): ActionResult => ({ ok: true, message, at: Date.now() });
const fail = (error: string, fieldErrors?: ActionResult["fieldErrors"]): ActionResult => ({
  ok: false,
  error,
  fieldErrors,
  at: Date.now(),
});

function firstErrors(err: z.ZodError): Record<string, string | undefined> {
  const fe = z.flattenError(err).fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v?.[0]]));
}

async function guarded(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ForbiddenError) return fail(e.message);
    throw e;
  }
}

// ── Profile ──────────────────────────────────────────────────
export async function updateProfileAction(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const ctx = await getWorkspaceContext();
  const parsed = z
    .object({ name: z.string().trim().min(1, "Enter your name").max(80, "Keep it under 80 characters") })
    .safeParse({ name: form.get("name") });
  if (!parsed.success) return fail("Please fix the highlighted field.", firstErrors(parsed.error));
  await prisma.user.update({ where: { id: ctx.user.id }, data: { name: parsed.data.name } });
  revalidatePath("/", "layout");
  return ok("Profile saved.");
}

export async function changePasswordAction(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const ctx = await getWorkspaceContext();
  const parsed = z
    .object({
      current: z.string().min(1, "Enter your current password"),
      next: passwordSchema,
      confirm: z.string(),
    })
    .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Passwords don’t match" })
    .safeParse({ current: form.get("current"), next: form.get("next"), confirm: form.get("confirm") });
  if (!parsed.success) return fail("Please fix the highlighted fields.", firstErrors(parsed.error));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
  if (!(await verifyPassword(parsed.data.current, user.passwordHash)))
    return fail("Current password is incorrect.", { current: "Current password is incorrect" });
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });
  const signedOut = await invalidateOtherSessions(user.id, ctx.session.id);
  await audit({ workspaceId: ctx.workspace.id, userId: user.id }, "user.password_change", undefined, {
    signedOutSessions: signedOut,
  });
  return ok(
    signedOut
      ? `Password changed. ${signedOut} other session${signedOut === 1 ? "" : "s"} signed out.`
      : "Password changed.",
  );
}

// ── Two-factor ───────────────────────────────────────────────
export interface TotpSetup {
  secret: string;
  qr: string;
}

export async function startTotpSetupAction(): Promise<TotpSetup | { error: string }> {
  const ctx = await getWorkspaceContext();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
  if (user.totpEnabled) return { error: "Two-factor is already on." };
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecretEnc: encryptSecret(secret, getEncryptionKey()) },
  });
  const qr = await QRCode.toDataURL(totpUri(secret, user.email), {
    margin: 1,
    width: 220,
    color: { dark: "#0F1729", light: "#FFFFFF" },
  });
  return { secret, qr };
}

function newRecoveryCodes(): { codes: string[]; hashes: string[] } {
  const codes = Array.from({ length: 8 }, () => {
    const raw = randomToken(6)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "x")
      .slice(0, 8);
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
  });
  return { codes, hashes: codes.map((c) => sha256(c)) };
}

export async function confirmTotpAction(
  _p: ActionResult & { codes?: string[] },
  form: FormData,
): Promise<ActionResult & { codes?: string[] }> {
  const ctx = await getWorkspaceContext();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
  if (!user.totpSecretEnc || user.totpEnabled) return fail("Start the setup again.");
  const code = String(form.get("code") ?? "").replace(/\s+/g, "");
  const step = verifyTotp(decryptSecret(user.totpSecretEnc, getEncryptionKey()), code);
  if (step === null)
    return fail("That code didn’t match. Check your phone’s clock and try the newest code.", {
      code: "Code didn’t match",
    });
  const { codes, hashes } = newRecoveryCodes();
  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true, totpLastStep: step, recoveryCodeHashes: hashes },
  });
  await audit({ workspaceId: ctx.workspace.id, userId: user.id }, "user.2fa_enabled");
  revalidatePath("/settings/security");
  return { ...ok("Two-factor authentication is on."), codes };
}

export async function disableTotpAction(_p: ActionResult, form: FormData): Promise<ActionResult> {
  const ctx = await getWorkspaceContext();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
  if (!(await verifyPassword(String(form.get("password") ?? ""), user.passwordHash)))
    return fail("Password is incorrect.", { password: "Password is incorrect" });
  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecretEnc: null, totpLastStep: null, recoveryCodeHashes: [] },
  });
  await audit({ workspaceId: ctx.workspace.id, userId: user.id }, "user.2fa_disabled");
  revalidatePath("/settings/security");
  return ok("Two-factor authentication is off.");
}

export async function regenerateRecoveryCodesAction(): Promise<{ codes?: string[]; error?: string }> {
  const ctx = await getWorkspaceContext();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } });
  if (!user.totpEnabled) return { error: "Turn on two-factor first." };
  const { codes, hashes } = newRecoveryCodes();
  await prisma.user.update({ where: { id: user.id }, data: { recoveryCodeHashes: hashes } });
  await audit({ workspaceId: ctx.workspace.id, userId: user.id }, "user.recovery_codes_regenerated");
  revalidatePath("/settings/security");
  return { codes };
}

// ── Sessions ─────────────────────────────────────────────────
export async function revokeSessionAction(sessionId: string): Promise<ActionResult> {
  const ctx = await getWorkspaceContext();
  if (sessionId === ctx.session.id) return fail("Use “Sign out” to end this session.");
  await prisma.session.deleteMany({ where: { id: sessionId, userId: ctx.user.id } });
  await audit({ workspaceId: ctx.workspace.id, userId: ctx.user.id }, "user.session_revoked", {
    type: "Session",
    id: sessionId,
  });
  revalidatePath("/settings/security");
  return ok("Session signed out.");
}

export async function revokeOtherSessionsAction(): Promise<ActionResult> {
  const ctx = await getWorkspaceContext();
  const count = await invalidateOtherSessions(ctx.user.id, ctx.session.id);
  await audit({ workspaceId: ctx.workspace.id, userId: ctx.user.id }, "user.sessions_revoked", undefined, {
    count,
  });
  revalidatePath("/settings/security");
  return ok(
    count ? `Signed out ${count} other session${count === 1 ? "" : "s"}.` : "No other sessions were active.",
  );
}

// ── Team ─────────────────────────────────────────────────────
export async function updateMemberRoleAction(membershipId: string, role: RoleName): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireRole("ADMIN");
    if (!ROLES.includes(role)) return fail("Unknown role.");
    const target = await prisma.membership.findFirst({
      where: { id: membershipId, workspaceId: ctx.workspace.id },
    });
    if (!target) return fail("Member not found.");
    if (target.userId === ctx.user.id) return fail("You can’t change your own role.");
    if ((target.role === "OWNER" || role === "OWNER") && ctx.role !== "OWNER")
      return fail("Only an owner can grant or change the owner role.");
    if (target.role === "OWNER" && role !== "OWNER") {
      const owners = await prisma.membership.count({
        where: { workspaceId: ctx.workspace.id, role: "OWNER" },
      });
      if (owners <= 1) return fail("A workspace needs at least one owner.");
    }
    await prisma.membership.update({ where: { id: target.id }, data: { role } });
    await audit(
      { workspaceId: ctx.workspace.id, userId: ctx.user.id },
      "member.role_change",
      { type: "Membership", id: target.id },
      { from: target.role, to: role },
    );
    revalidatePath("/settings/team");
    return ok(`Role updated to ${role.toLowerCase()}.`);
  });
}

export async function removeMemberAction(membershipId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireRole("ADMIN");
    const target = await prisma.membership.findFirst({
      where: { id: membershipId, workspaceId: ctx.workspace.id },
    });
    if (!target) return fail("Member not found.");
    if (target.userId === ctx.user.id) return fail("You can’t remove yourself.");
    if (target.role === "OWNER" && ctx.role !== "OWNER") return fail("Only an owner can remove an owner.");
    await prisma.membership.delete({ where: { id: target.id } });
    await audit({ workspaceId: ctx.workspace.id, userId: ctx.user.id }, "member.remove", {
      type: "Membership",
      id: target.id,
    });
    revalidatePath("/settings/team");
    return ok("Member removed.");
  });
}

// ── Workspace ────────────────────────────────────────────────
const workspaceSchema = z.object({
  name: z.string().trim().min(2, "At least 2 characters").max(60),
  companyName: z.string().trim().min(2, "Enter the legal or trading name").max(100),
  physicalAddress: z
    .string()
    .trim()
    .min(10, "A full postal address is required in every email footer (CAN-SPAM)")
    .max(300),
  timezone: z
    .string()
    .refine((tz) => Intl.supportedValuesOf("timeZone").includes(tz) || tz === "UTC", "Pick a valid timezone"),
  trackingDomain: z
    .string()
    .trim()
    .max(253)
    .refine(
      (v) => v === "" || /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v),
      "Enter a domain like track.example.com",
    ),
});

export async function updateWorkspaceAction(_p: ActionResult, form: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireRole("ADMIN");
    const parsed = workspaceSchema.safeParse(
      Object.fromEntries(
        ["name", "companyName", "physicalAddress", "timezone", "trackingDomain"].map((k) => [
          k,
          String(form.get(k) ?? ""),
        ]),
      ),
    );
    if (!parsed.success) return fail("Please fix the highlighted fields.", firstErrors(parsed.error));
    const { trackingDomain, ...rest } = parsed.data;
    await prisma.workspace.update({
      where: { id: ctx.workspace.id },
      data: { ...rest, trackingDomain: trackingDomain || null },
    });
    await audit({ workspaceId: ctx.workspace.id, userId: ctx.user.id }, "workspace.update", {
      type: "Workspace",
      id: ctx.workspace.id,
    });
    revalidatePath("/", "layout");
    return ok("Workspace settings saved.");
  });
}
