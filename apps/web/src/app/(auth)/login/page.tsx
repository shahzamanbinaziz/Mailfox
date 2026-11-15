import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@mailfox/ui";
import { getAuth } from "@/lib/auth/context";
import { LoginForm } from "./LoginForm";
import { LoginArt } from "./LoginArt";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAuth()) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <LoginArt />
      <section className="flex flex-col px-6 py-8 sm:px-12">
        <div className="lg:hidden">
          <Logo height={30} />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {error === "no-workspace" && (
            <p role="alert" className="mb-6 rounded-lg bg-warning-100 px-3 py-2 text-sm text-warning-900">
              Your account isn’t a member of any workspace yet. Ask an admin to invite you.
            </p>
          )}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-center text-xs text-muted-foreground">Permission-based email only · Mailfox</p>
      </section>
    </main>
  );
}
