<p align="center">
  <img src="brand/logo-full.svg" alt="Mailfox" height="64" />
</p>

<p align="center"><strong>Self-hosted, permission-based email campaigns — delivered by a clever fox.</strong><br/>
A Mailchimp / Brevo alternative you run on your own VPS, with your own mailboxes.</p>

---

> **Status: Phase 1 complete (v0.2.0)** — sign-in with 2FA, roles, sessions, the dashboard shell with ⌘K, and a live
> overview built on the seeded demo workspace. See [CHANGELOG.md](CHANGELOG.md) and the roadmap below.

## Quick start

```bash
docker compose up
```

| URL                          | What                                                                |
| ---------------------------- | ------------------------------------------------------------------- |
| http://localhost:3000        | Mailfox web app (home + live demo stats)                            |
| http://localhost:3000/brand  | Brand guide (logos, colours, motion, email layout, downloads)       |
| http://localhost:8025        | Mailpit — every email sent in dev lands here, never in real inboxes |
| http://localhost:3001/health | Tracker service                                                     |

The first run builds the images, applies migrations and seeds a demo workspace. Sign in with
**admin@mailfox.local / mailfox-admin-123** (Owner). The workspace has 500 contacts, 3 templates, 2 campaigns,
a 30-day welcome series and 3 more team members. Press **⌘K / Ctrl+K** anywhere to search or jump.

> In GitHub Codespaces open the forwarded port 3000 from the **Ports** tab. Server Actions accept
> `*.app.github.dev`; for your own domain set `SERVER_ACTIONS_ALLOWED_ORIGINS` before building (see DECISIONS D-020).

Compose ships **dev-only default secrets** so it starts with zero setup. For anything real, copy `.env.example` to `.env` and fill in fresh values (see below).

### Without Docker for the apps (faster hot reload)

```bash
corepack enable && pnpm install
cp .env.example .env            # then set ENCRYPTION_KEY, AUTH_SECRET, TRACKING_SIGNING_SECRET
docker compose up -d postgres redis mailpit
pnpm db:generate && pnpm db:deploy && pnpm db:seed
pnpm dev                        # web :3000, tracker :3001, worker (health :3002)
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # ENCRYPTION_KEY
openssl rand -base64 32                                                        # AUTH_SECRET / TRACKING_SIGNING_SECRET
```

### GitHub Codespaces

Open the repo in a Codespace — `.devcontainer/` installs everything, creates `.env` with random secrets and forwards the ports. Then run `docker compose up`.

## Repository layout

```
apps/
  web/        Next.js 16 (App Router) admin dashboard + API route handlers + public pages
  worker/     BullMQ workers: send, bounce, schedule, warmup (heartbeat + health in Phase 0)
  tracker/    Fastify: open pixel, click redirects, unsubscribe pages (health in Phase 0)
packages/
  core/       env validation (zod), AES-256-GCM encryption, signing, roles, queue names, utils
  db/         Prisma 7 schema (all core models), migrations, seed, client
  email/      MJML brand layout, renderer, plain-text, personalization engine, starter templates
  ai/         Gemini config contract (full wrapper in Phase 5)
  ui/         design tokens (TS → CSS), Logo, LogoIntro, FoxSpinner, Skeleton, CampaignSent, empty states
brand/        SVG logos, favicon set, animations, empty-state SVGs, generator scripts
infra/        production infra (Caddy, Postfix/OpenDKIM, backups) — Phase 9
docs/         architecture notes, deliverability + deploy guides (later phases)
```

## Scripts

| Command                                      | Does                                                             |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                                   | Run all apps in watch mode                                       |
| `pnpm build` / `lint` / `typecheck` / `test` | Turborepo pipelines across every package                         |
| `pnpm db:migrate`                            | Create a new migration from schema changes (dev)                 |
| `pnpm db:deploy`                             | Apply migrations                                                 |
| `pnpm db:seed`                               | Seed the demo workspace (idempotent)                             |
| `pnpm brand:build`                           | Regenerate logos, favicons, PNGs, empty states and animated SVGs |
| `pnpm tokens:build`                          | Regenerate `packages/ui/src/styles/tokens.css` from `tokens.ts`  |

## Tech stack

pnpm + Turborepo · Next.js 16 · React 19 · Tailwind CSS v4 · Radix UI (shadcn-style) · cmdk · Recharts · Framer Motion · PostgreSQL 17 + Prisma 7 (pg driver adapter) · Redis + BullMQ · Fastify 5 · MJML 5 · Nodemailer · Google Gemini (`@google/genai`) · Vitest · Playwright · Mailpit · Docker Compose · Caddy · GitHub Actions + GHCR.
Why each choice was made: [DECISIONS.md](DECISIONS.md).

## Roadmap

| Phase | Deliverable                                                                                             |     |
| ----- | ------------------------------------------------------------------------------------------------------- | --- |
| 0     | Repo scaffold, Docker Compose, full brand kit, CI                                                       | ✅  |
| 1     | Auth + roles + 2FA, dashboard shell, ⌘K palette, dark mode, brand page polish                           |     |
| 2     | Mailbox management, test connection, limits, DNS checker                                                |     |
| 3     | Contacts, custom fields, import/export, lists, tags, segments, suppression, double opt-in, signup forms |     |
| 4     | MJML drag-and-drop editor, 6 starter templates, previews, test send                                     |     |
| 5     | Gemini AI writer, subject lines, spam check, agent mode                                                 |     |
| 6     | Campaign wizard, sending engine, throttling, rotation, warmup, A/B tests                                |     |
| 7     | Tracking, unsubscribe pages, bounces + complaints, reports                                              |     |
| 8     | Automations, REST API, webhooks, audit log, system health                                               |     |
| 9     | Hardening, Postfix/OpenDKIM, Caddy, backups, VPS deploy guide                                           |     |

## Compliance

Mailfox is for **opt-in contacts only**. Consent records, one-click unsubscribe (`List-Unsubscribe` + `List-Unsubscribe-Post`), a global suppression list enforced by the worker, and a physical address in every footer are core features, not extras.
