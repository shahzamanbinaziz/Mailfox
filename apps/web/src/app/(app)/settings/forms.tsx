"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  Copy,
  KeyRound,
  LaptopMinimal,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Trash2,
} from "lucide-react";
import type { RoleName } from "@mailfox/core";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  Table,
  Td,
  Th,
  Tr,
  toast,
} from "@mailfox/ui/components";
import { timeAgo } from "@/lib/format";
import {
  changePasswordAction,
  confirmTotpAction,
  disableTotpAction,
  regenerateRecoveryCodesAction,
  removeMemberAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
  startTotpSetupAction,
  updateMemberRoleAction,
  updateProfileAction,
  updateWorkspaceAction,
  type ActionResult,
} from "./actions";

const empty: ActionResult = { ok: false };

/** Toast every new action result (keyed on `at`, so identical messages still show). */
function useResultToast(state: ActionResult) {
  useEffect(() => {
    if (!state.at) return;
    if (state.ok && state.message) toast.success(state.message);
    else if (state.error) toast.error(state.error);
  }, [state.at, state.ok, state.message, state.error]);
}

function Submit({
  pending,
  children,
  variant,
}: {
  pending: boolean;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline";
}) {
  return (
    <Button type="submit" disabled={pending} variant={variant}>
      {pending && <LoaderCircle className="animate-spin" />}
      {children}
    </Button>
  );
}

// ── Profile ──────────────────────────────────────────────────
export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, empty);
  useResultToast(state);
  return (
    <form action={action} className="grid max-w-md gap-4" noValidate>
      <div className="flex items-center gap-4">
        <Avatar name={name || email} className="size-14 text-base" />
        <div>
          <p className="font-semibold">{name || "Unnamed"}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>
      <Field id="name" label="Full name" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={name} autoComplete="name" />
      </Field>
      <Field id="email-ro" label="Email" hint="Changing your email arrives with invitations in Phase 8.">
        <Input value={email} readOnly disabled />
      </Field>
      <div>
        <Submit pending={pending}>Save profile</Submit>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, empty);
  useResultToast(state);
  return (
    <form action={action} key={state.ok ? state.at : "pw"} className="grid max-w-md gap-4" noValidate>
      <Field id="current" label="Current password" error={state.fieldErrors?.current}>
        <Input name="current" type="password" autoComplete="current-password" />
      </Field>
      <Field
        id="next"
        label="New password"
        error={state.fieldErrors?.next}
        hint="At least 10 characters, with letters and a number."
      >
        <Input name="next" type="password" autoComplete="new-password" />
      </Field>
      <Field id="confirm" label="Confirm new password" error={state.fieldErrors?.confirm}>
        <Input name="confirm" type="password" autoComplete="new-password" />
      </Field>
      <p className="text-xs text-muted-foreground">Changing your password signs out every other device.</p>
      <div>
        <Submit pending={pending}>Change password</Submit>
      </div>
    </form>
  );
}

// ── Two-factor ───────────────────────────────────────────────
function RecoveryCodes({ codes }: { codes: string[] }) {
  return (
    <div className="rounded-xl border border-warning-300 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-950">
      <p className="text-sm font-semibold text-warning-900 dark:text-warning-100">
        Save these recovery codes now
      </p>
      <p className="mt-1 text-xs text-warning-800 dark:text-warning-200">
        Each code works once if you lose your phone. They won’t be shown again.
      </p>
      <ol className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm" aria-label="Recovery codes">
        {codes.map((c) => (
          <li key={c} className="rounded-md bg-card px-2 py-1 text-center">
            {c}
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() =>
          void navigator.clipboard
            ?.writeText(codes.join("\n"))
            .then(() => toast.success("Recovery codes copied"))
        }
      >
        <Copy /> Copy codes
      </Button>
    </div>
  );
}

export function TwoFactorCard({ enabled, recoveryLeft }: { enabled: boolean; recoveryLeft: number }) {
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [starting, startTransition] = useTransition();
  const [confirmState, confirm, confirming] = useActionState(
    confirmTotpAction,
    empty as ActionResult & { codes?: string[] },
  );
  const [disableState, disable, disabling] = useActionState(disableTotpAction, empty);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  useResultToast(confirmState);
  useResultToast(disableState);

  const codes = confirmState.codes ?? freshCodes;

  if (enabled) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-900 dark:bg-success-950">
          <ShieldCheck className="size-5 text-success-700 dark:text-success-300" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Two-factor authentication is on</p>
            <p className="text-xs text-muted-foreground">
              {recoveryLeft} recovery code{recoveryLeft === 1 ? "" : "s"} left.
            </p>
          </div>
        </div>
        {codes && <RecoveryCodes codes={codes} />}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              startTransition(async () => {
                const r = await regenerateRecoveryCodesAction();
                if (r.codes) setFreshCodes(r.codes);
                else toast.error(r.error ?? "Could not create codes");
              })
            }
            disabled={starting}
          >
            <KeyRound /> New recovery codes
          </Button>
          <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
            <Button variant="outline" onClick={() => setDisableOpen(true)}>
              <ShieldOff /> Turn off 2FA
            </Button>
            <DialogContent>
              <DialogTitle className="text-lg font-bold">Turn off two-factor?</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Your account will be protected by your password only. Confirm with your password.
              </DialogDescription>
              <form action={disable} className="grid gap-4" noValidate>
                <Field id="disable-password" label="Password" error={disableState.fieldErrors?.password}>
                  <Input name="password" type="password" autoComplete="current-password" autoFocus />
                </Field>
                <Submit pending={disabling} variant="destructive">
                  Turn off 2FA
                </Submit>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="grid max-w-lg gap-4">
        <p className="text-sm text-muted-foreground">
          Add a second step at sign-in with an authenticator app (Google Authenticator, 1Password, Authy).
          Strongly recommended for owners and admins.
        </p>
        <div>
          <Button
            disabled={starting}
            onClick={() =>
              startTransition(async () => {
                const r = await startTotpSetupAction();
                if ("error" in r) toast.error(r.error);
                else setSetup(r);
              })
            }
          >
            {starting ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />} Set up two-factor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="rounded-xl border border-border bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL QR code */}
        <img src={setup.qr} alt="QR code for your authenticator app" width={180} height={180} />
      </div>
      <div className="grid content-start gap-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Scan the QR code with your authenticator app.</li>
          <li>
            Can’t scan? Enter this key:{" "}
            <code
              className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
              data-testid="totp-secret"
            >
              {setup.secret}
            </code>
          </li>
          <li>Enter the 6-digit code it shows.</li>
        </ol>
        <form action={confirm} className="flex max-w-sm items-start gap-2" noValidate>
          <div className="flex-1">
            <Field id="totp-code" label="Code" error={confirmState.fieldErrors?.code}>
              <Input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                className="font-mono tracking-widest"
              />
            </Field>
          </div>
          <div className="pt-6">
            <Submit pending={confirming}>Verify</Submit>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sessions ─────────────────────────────────────────────────
export interface SessionRow {
  id: string;
  current: boolean;
  ip: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  createdAt: string;
}

function describeAgent(ua: string | null): { label: string; mobile: boolean } {
  if (!ua) return { label: "Unknown device", mobile: false };
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return { label: os ? `${browser} on ${os}` : browser, mobile };
}

export function SessionsList({ sessions }: { sessions: SessionRow[] }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });
  return (
    <div className="grid gap-3">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {sessions.map((s) => {
          const { label, mobile } = describeAgent(s.userAgent);
          const Icon = mobile ? Smartphone : LaptopMinimal;
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <Icon className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {label} {s.current && <Badge variant="success">This device</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.ip ?? "IP unknown"} · active {timeAgo(s.lastSeenAt)} · signed in {timeAgo(s.createdAt)}
                </p>
              </div>
              {!s.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => revokeSessionAction(s.id))}
                  aria-label={`Sign out ${label}`}
                >
                  <LogOut /> Sign out
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {sessions.length > 1 && (
        <div>
          <Button variant="outline" disabled={pending} onClick={() => run(revokeOtherSessionsAction)}>
            Sign out all other sessions
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Team ─────────────────────────────────────────────────────
export interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  self: boolean;
  totpEnabled: boolean;
  lastLoginAt: string | null;
}

const roleHelp: Record<RoleName, string> = {
  OWNER: "Everything, incl. billing & deleting the workspace",
  ADMIN: "Manage team, mailboxes and settings",
  EDITOR: "Create and send campaigns, manage contacts",
  VIEWER: "Read-only access to reports",
};

export function TeamTable({
  members,
  canManage,
  isOwner,
}: {
  members: MemberRow[];
  canManage: boolean;
  isOwner: boolean;
}) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <Th>Member</Th>
            <Th>Role</Th>
            <Th>2FA</Th>
            <Th>Last sign-in</Th>
            {canManage && <Th className="sr-only">Actions</Th>}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const editable = canManage && !m.self && (isOwner || m.role !== "OWNER");
            return (
              <Tr key={m.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name || m.email} />
                    <div>
                      <p className="font-medium">
                        {m.name || "—"}{" "}
                        {m.self && <span className="text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  {editable ? (
                    <Select
                      aria-label={`Role for ${m.email}`}
                      defaultValue={m.role}
                      disabled={pending}
                      className="h-8 w-32"
                      onChange={(e) => run(() => updateMemberRoleAction(m.id, e.target.value as RoleName))}
                      title={roleHelp[m.role]}
                    >
                      {(["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const)
                        .filter((r) => isOwner || r !== "OWNER")
                        .map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0) + r.slice(1).toLowerCase()}
                          </option>
                        ))}
                    </Select>
                  ) : (
                    <span title={roleHelp[m.role]} className="text-sm capitalize">
                      {m.role.toLowerCase()}
                    </span>
                  )}
                </Td>
                <Td>
                  {m.totpEnabled ? <Badge variant="success">On</Badge> : <Badge variant="neutral">Off</Badge>}
                </Td>
                <Td className="text-muted-foreground">{m.lastLoginAt ? timeAgo(m.lastLoginAt) : "Never"}</Td>
                {canManage && (
                  <Td className="text-right">
                    {editable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        aria-label={`Remove ${m.email}`}
                        onClick={() =>
                          confirm(`Remove ${m.email} from this workspace?`) &&
                          run(() => removeMemberAction(m.id))
                        }
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </Td>
                )}
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

// ── Workspace ────────────────────────────────────────────────
export function WorkspaceForm({
  values,
  timezones,
  canEdit,
}: {
  values: {
    name: string;
    companyName: string;
    physicalAddress: string;
    timezone: string;
    trackingDomain: string;
  };
  timezones: string[];
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(updateWorkspaceAction, empty);
  useResultToast(state);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid max-w-xl gap-4" noValidate>
      <fieldset disabled={!canEdit} className="grid gap-4">
        <Field id="ws-name" label="Workspace name" error={fe.name}>
          <Input name="name" defaultValue={values.name} />
        </Field>
        <Field
          id="ws-company"
          label="Company name"
          error={fe.companyName}
          hint="Shown in every email footer."
        >
          <Input name="companyName" defaultValue={values.companyName} />
        </Field>
        <Field
          id="ws-address"
          label="Physical address"
          error={fe.physicalAddress}
          hint="Required by anti-spam laws (CAN-SPAM, PECR). Appears in every footer."
        >
          <Input name="physicalAddress" defaultValue={values.physicalAddress} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="ws-tz" label="Timezone" error={fe.timezone}>
            <Select name="timezone" defaultValue={values.timezone}>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            id="ws-track"
            label="Tracking domain"
            error={fe.trackingDomain}
            hint="Optional, e.g. track.yourbrand.com"
          >
            <Input
              name="trackingDomain"
              defaultValue={values.trackingDomain}
              placeholder="track.example.com"
            />
          </Field>
        </div>
      </fieldset>
      {canEdit ? (
        <div>
          <Submit pending={pending}>Save workspace</Submit>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Only admins and owners can change workspace settings.</p>
      )}
    </form>
  );
}
