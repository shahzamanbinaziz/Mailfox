import Link from "next/link";
import { getPrisma } from "@mailfox/db";
import { percent } from "@mailfox/core";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HomeIntro } from "./HomeIntro";

export const dynamic = "force-dynamic";

async function loadStats() {
  try {
    const prisma = getPrisma();
    const [contacts, campaigns, sent, agg] = await Promise.all([
      prisma.contact.count({ where: { status: "SUBSCRIBED" } }),
      prisma.campaign.count(),
      prisma.send.count({ where: { status: { in: ["SENT", "BOUNCED"] } } }),
      prisma.campaign.aggregate({
        _sum: { deliveredCount: true, uniqueOpenCount: true, uniqueClickCount: true },
      }),
    ]);
    const delivered = agg._sum.deliveredCount ?? 0;
    return {
      ok: true as const,
      items: [
        ["Subscribed contacts", contacts.toLocaleString("en-US")],
        ["Campaigns", campaigns.toLocaleString("en-US")],
        ["Emails sent", sent.toLocaleString("en-US")],
        ["Open rate", `${percent(agg._sum.uniqueOpenCount ?? 0, delivered)}%`],
        ["Click rate", `${percent(agg._sum.uniqueClickCount ?? 0, delivered)}%`],
      ] as const,
    };
  } catch {
    return { ok: false as const };
  }
}

const roadmap = [
  ["0", "Brand kit, monorepo, Docker, CI", true],
  ["1", "Auth, roles, dashboard shell, ⌘K", false],
  ["2", "Mailboxes, encryption, DNS checker", false],
  ["3", "Contacts, lists, segments, opt-in", false],
  ["4", "MJML template editor", false],
  ["5", "Gemini AI writer & agent", false],
  ["6", "Campaigns & sending engine", false],
  ["7", "Tracking, bounces, reports", false],
  ["8", "Automations, API, webhooks", false],
  ["9", "Hardening & VPS deploy", false],
] as const;

export default async function Home() {
  const stats = await loadStats();
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-8 sm:px-8">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <section className="flex flex-col items-center py-12 text-center">
        <HomeIntro />
        <h1 className="mt-8 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Email campaigns, delivered by a <span className="text-link">clever fox</span>.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Self-hosted, permission-based sending with your own mailboxes. Phase 0 is in place — the dashboard
          lands in Phase 1.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/brand"
            className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-sm transition hover:brightness-95"
          >
            Open the brand guide
          </Link>
          <a
            href="http://localhost:8025"
            className="rounded-xl border border-border bg-card px-5 py-2.5 font-semibold transition hover:bg-muted"
          >
            Mailpit inbox ↗
          </a>
        </div>
      </section>

      <section
        aria-labelledby="seed-heading"
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 id="seed-heading" className="font-semibold">
            Demo workspace
          </h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${stats.ok ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}
          >
            {stats.ok ? "Database connected" : "Database offline"}
          </span>
        </div>
        {stats.ok ? (
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {stats.items.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-muted p-4">
                <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Start Postgres and run <code className="font-mono">pnpm db:deploy && pnpm db:seed</code> — or just{" "}
            <code className="font-mono">docker compose up</code>.
          </p>
        )}
      </section>

      <section
        aria-labelledby="roadmap-heading"
        className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h2 id="roadmap-heading" className="font-semibold">
          Build roadmap
        </h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {roadmap.map(([n, label, done]) => (
            <li key={n} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                aria-hidden="true"
              >
                {done ? "✓" : n}
              </span>
              <span className={done ? "font-medium" : "text-muted-foreground"}>
                Phase {n} · {label}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        Mailfox · self-hosted email campaigns
      </footer>
    </main>
  );
}
