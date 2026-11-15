"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button, Field, Input } from "@mailfox/ui/components";
import { cancelTwoFactorAction, loginAction, verifyTwoFactorAction, type LoginState } from "./actions";

const initial: LoginState = { step: "credentials" };

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2.5 text-sm font-medium text-danger-800 dark:border-danger-900 dark:bg-danger-950 dark:text-danger-200"
    >
      {message}
    </div>
  );
}

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, login, loggingIn] = useActionState(loginAction, initial);
  const [twoFa, verify, verifying] = useActionState(verifyTwoFactorAction, { step: "2fa" } as LoginState);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"credentials" | "2fa">("credentials");

  // Follow each new action result (React's "adjust state while rendering" pattern, no effects):
  // a correct password for a 2FA account opens the code step; an expired ticket sends us back.
  const [seenLogin, setSeenLogin] = useState(state);
  if (state !== seenLogin) {
    setSeenLogin(state);
    if (state.step === "2fa") setMode("2fa");
  }
  const [seenTwoFa, setSeenTwoFa] = useState(twoFa);
  if (twoFa !== seenTwoFa) {
    setSeenTwoFa(twoFa);
    if (twoFa.step === "credentials") setMode("credentials");
  }
  const on2fa = mode === "2fa";

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!on2fa ? (
        <motion.form
          key="credentials"
          action={login}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          className="grid gap-5"
          noValidate
        >
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your Mailfox workspace.</p>
          </div>
          <ErrorBanner message={state.error ?? (twoFa.step === "credentials" ? twoFa.error : undefined)} />
          <input type="hidden" name="next" value={next} />
          <Field id="email" label="Email" error={state.fieldErrors?.email}>
            <Input
              name="email"
              type="email"
              autoComplete="username"
              defaultValue={state.email}
              placeholder="you@company.com"
              autoFocus
              required
            />
          </Field>
          <div className="relative">
            <Field id="password" label="Password" error={state.fieldErrors?.password}>
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-10"
                required
              />
            </Field>
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-0 top-5 grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Button type="submit" size="lg" disabled={loggingIn}>
            {loggingIn && <LoaderCircle className="animate-spin" />} Sign in
          </Button>
        </motion.form>
      ) : (
        <motion.form
          key="2fa"
          action={verify}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          className="grid gap-5"
          noValidate
        >
          <div>
            <div className="mb-3 grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Two-factor check</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app for{" "}
              <span className="font-medium text-foreground">{state.email}</span>.
            </p>
          </div>
          <ErrorBanner message={twoFa.error} />
          <input type="hidden" name="next" value={next} />
          <Field
            id="code"
            label="Authentication code"
            error={twoFa.fieldErrors?.code}
            hint="Lost your phone? Enter a recovery code instead."
          >
            <Input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123 456"
              className="text-center font-mono text-lg tracking-[0.4em]"
              autoFocus
              maxLength={12}
            />
          </Field>
          <Button type="submit" size="lg" disabled={verifying}>
            {verifying && <LoaderCircle className="animate-spin" />} Verify and sign in
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              void cancelTwoFactorAction();
              setMode("credentials");
            }}
          >
            <ArrowLeft /> Use a different account
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
