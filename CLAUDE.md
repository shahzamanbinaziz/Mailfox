# CLAUDE.md — Mailfox project brief

> Source of truth for every Claude Code session. Current progress: see `CHANGELOG.md`. Decisions: `DECISIONS.md`.

## 1. Who you are and what we are building

You are the lead engineer and designer for **Mailfox**, a self-hosted email campaign platform (Mailchimp/Brevo alternative) owned by the company **Mailfox**. You will build it end to end in this GitHub repo, phase by phase, committing working code after each phase.

Mailfox lets an admin:
- connect and manage **many sending mailboxes** (our own SMTP server on a VPS + external SMTP mailboxes),
- manage **contacts, lists, segments and tags**,
- design **email templates** (drag-and-drop + HTML),
- write emails with an **AI writing agent** powered by the **Google Gemini API (free tier)**,
- send **large campaigns (thousands of emails per day)** through a queue with throttling and mailbox rotation,
- **track** opens, clicks, bounces, unsubscribes and complaints,
- view everything in a **beautiful, modern admin dashboard**.

All sending is **permission-based** (opt-in contacts only). Compliance features (unsubscribe, suppression list, physical address footer, consent records) are core requirements, not extras.

## 2. Working rules

1. **Work in phases** (section 7). At the start of each phase, write a short plan; at the end, run the app, run tests, fix errors, update `README.md` and `CHANGELOG.md`, and commit with a clear message.
2. **Never hardcode secrets.** Everything goes in `.env` (with a complete `.env.example` committed). SMTP passwords stored in DB must be **encrypted at rest** (AES-256-GCM with a key from env).
3. **TypeScript strict mode everywhere.** No `any` unless justified in a comment.
4. Prefer **boring, proven libraries**. Ask me before adding anything heavy or paid.
5. Everything must run locally with **one command**: `docker compose up`.
6. Write **seed data** (demo admin, demo mailbox, 500 fake contacts, 3 templates, 2 campaigns) so the dashboard looks alive on first run.
7. When something is ambiguous, pick the sensible default, note it in `DECISIONS.md`, and continue.
8. Keep the code **VPS-ready from day one**: no GitHub-only or vendor-locked features in the core app.

## 3. Tech stack (use this unless you have a strong reason — then explain it)

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web app (admin dashboard) | Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion + Recharts |
| API | Next.js route handlers **or** a separate Fastify/NestJS service in `apps/api` (choose one, document why) |
| Database | PostgreSQL + Prisma ORM |
| Queue / jobs | Redis + BullMQ |
| Workers | `apps/worker` — Node service that sends mail, processes bounces, schedules campaigns |
| Email sending | Nodemailer (SMTP pooling) |
| Email templates | MJML (responsive HTML) + a block-based drag-and-drop editor (e.g. GrapesJS with MJML preset, or Unlayer-free alternative) |
| Auth | Auth.js (NextAuth) or Lucia — email+password, roles: Owner, Admin, Editor, Viewer; 2FA (TOTP) |
| AI | Google Gemini API via `@google/genai` SDK; model name from env `GEMINI_MODEL` (do not hardcode) |
| Tracking service | `apps/tracker` — tiny Fastify service for open pixel, click redirects, unsubscribe pages |
| Testing | Vitest (unit), Playwright (E2E), Mailpit (local SMTP catcher for dev) |
| Deploy | Docker Compose + Caddy (auto HTTPS) on VPS; GitHub Actions for CI |

Folder layout:
```
mailfox/
  apps/
    web/        # Next.js admin dashboard + public pages
    worker/     # BullMQ workers (send, bounce, schedule, warmup)
    tracker/    # open/click/unsubscribe endpoints
  packages/
    db/         # Prisma schema + client
    core/       # shared types, validation (zod), utils, encryption
    email/      # MJML templates, renderer, personalization engine
    ai/         # Gemini wrapper, prompts, rate limiter
    ui/         # shared React components + brand tokens
  brand/        # logo, favicon, animations, brand guide
  infra/        # docker-compose, Caddyfile, Postfix/OpenDKIM configs, scripts
  docs/
```

## 4. Brand identity — build this FIRST (Phase 0)

Company and product name: **Mailfox**. Personality: fast, clever, trustworthy, friendly. Think "a smart fox that delivers your mail".

Create in `/brand`:
1. **Logo** (hand-written, clean SVG, no raster):
   - `logo-mark.svg` — a geometric fox head whose shape subtly forms an envelope (or an envelope with fox ears/tail). Must read clearly at 16px.
   - `logo-full.svg` — mark + "Mailfox" wordmark (modern geometric sans, e.g. Inter / Plus Jakarta Sans / Sora).
   - `logo-full-dark.svg` and `logo-mono.svg` (single color, for footers/emails).
2. **Color palette** — primary fox orange (around `#FF6A1A`), deep ink navy (around `#0F1729`), plus neutral grays, success/warning/danger. Generate full 50–950 scales, check WCAG AA contrast, and export as Tailwind theme tokens in `packages/ui/tokens.ts` and CSS variables. Support **light and dark mode**.
3. **Favicon set** — `favicon.ico` (16/32/48), `favicon.svg`, `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `site.webmanifest`. Write a script (`brand/scripts/build-icons.mjs` using `sharp`) that generates all PNG/ICO from the SVG.
4. **Animations**:
   - Animated logo intro (SVG + CSS/Framer Motion): fox ears pop up, envelope folds shut, a short "swoosh" trail. Under 1.5s, respects `prefers-reduced-motion`.
   - Loading spinner / skeleton based on the fox mark.
   - "Campaign sent" success animation (envelope flies off with a fox-tail trail).
   - Empty-state illustrations (simple SVG) for: no campaigns, no contacts, no mailboxes.
5. **Brand guide page** at `/brand` route in the web app showing logo variants, clear-space rules, colors, typography, and animation previews with download buttons.
6. **Email branding**: default MJML layout (header with logo, footer with company address + unsubscribe link) using brand colors.

## 5. Feature specification

### 5.1 Admin dashboard (design is a top priority)
- Layout: collapsible sidebar, top bar with global search (⌘K command palette), workspace switcher, notifications, profile menu, dark/light toggle.
- Visual style: modern SaaS (Linear / Vercel / Resend level polish) — generous spacing, soft shadows, rounded-xl cards, subtle Framer Motion transitions, crisp data tables, skeleton loaders, toast notifications.
- **Home overview**: emails sent today / 7d / 30d, delivery rate, open rate, click rate, bounce rate, complaint rate, unsubscribes; send-volume chart; per-mailbox health; recent campaigns; queue status (live).
- Fully responsive (works on mobile for monitoring).

### 5.2 Mailbox (sender) management
- Add mailbox: name, from email, from name, reply-to, SMTP host/port/security/user/password, IMAP settings (for bounce/reply reading).
- **Test connection** button (SMTP verify + send test email).
- Per-mailbox limits: max per hour, max per day, min delay between sends (with random jitter).
- **Warmup mode**: daily limit ramps up automatically over N days (configurable schedule).
- Health score per mailbox (bounce rate, complaint rate, failures) — auto-pause mailbox if thresholds are crossed, and notify admin.
- **Mailbox pools/rotation**: a campaign can send through a pool; worker rotates mailboxes respecting each one's limits.
- Domain section: for each sending domain show required **SPF, DKIM, DMARC, MX, rDNS/PTR** records and a **"Check DNS"** button that verifies them live.

### 5.3 Contacts, lists, segments
- Import CSV/XLSX with column mapping, duplicate detection, validation, and import report. Export CSV.
- Custom fields (text, number, date, boolean, select).
- Lists, tags, and dynamic **segments** (rule builder: field/operator/value, AND/OR groups, engagement rules like "opened in last 30 days").
- Contact profile page: fields, tags, activity timeline (sent, opened, clicked, bounced, unsubscribed).
- **Consent**: store opt-in source, date, IP; support **double opt-in** with confirmation email.
- Email validation on import: syntax, MX lookup, disposable-domain list, role-address flag.
- Global **suppression list** (unsubscribed, hard-bounced, complained, manually blocked) — never sent to, enforced in the worker.
- Hosted **signup forms** + embeddable form snippet + simple REST API to add contacts.

### 5.4 Templates and editor
- Drag-and-drop block editor (text, image, button, columns, divider, social, spacer, HTML) producing MJML → responsive HTML.
- Raw HTML/MJML code mode with live preview.
- Desktop/mobile preview, dark-mode preview, send test email.
- Personalization tags: `{{first_name|"there"}}`, custom fields, conditional blocks.
- Saved templates library + 6 starter templates (newsletter, announcement, promo, welcome, digest, plain-text style).
- Auto-generate plain-text version for every email.

### 5.5 AI writing agent (Gemini free API)
- `packages/ai` wraps Gemini with: env-based API key and model, **rate limiter + retry with backoff** (free tier has strict per-minute and per-day limits), response caching, and graceful error messages when quota is exhausted.
- Features:
  1. **Write campaign from brief** — inputs: goal, audience, tone, length, language, CTA → outputs subject line, preheader, body (as editor blocks).
  2. **Subject line generator** — 10 variants with predicted style labels (curiosity, urgency, benefit…).
  3. **Rewrite / improve** selected text: shorter, friendlier, more formal, fix grammar, translate.
  4. **Spam-word & deliverability check** — flags risky phrases, too many links/images, missing alt text, ALL CAPS.
  5. **Agent mode**: a multi-step flow (plan → draft → self-review → final) that produces a full campaign draft the user can approve or edit. Never sends without human approval.
- AI side panel inside the editor with chat history per campaign.
- Log token usage per user in DB and show it in settings.

### 5.6 Campaigns
- Campaign wizard: recipients (lists/segments/exclusions) → sender (mailbox or pool) → content (template/editor/AI) → settings → review → schedule/send.
- **A/B testing**: subject or content variants, test % of audience, auto-pick winner by open or click rate after X hours.
- Send now, schedule (with timezone), or **send in recipient's local time**.
- **Throttling**: global sends/hour, per-mailbox limits, per-recipient-domain limits (e.g. max N/min to gmail.com, outlook.com, yahoo.com).
- Pause / resume / cancel a running campaign; live progress bar (queued, sent, failed, deferred).
- Automations (phase 2 of campaigns): welcome series, drip sequences with delays, triggers (joined list, tag added, date field).
- Duplicate campaign, campaign archive, campaign notes.

### 5.7 Sending engine (worker)
- Campaign → expand recipients in batches → create `Send` jobs in BullMQ.
- Worker picks jobs, applies suppression check, renders personalized HTML + text, injects tracking, signs with DKIM (when using own server), sends via pooled SMTP connection.
- Headers: `List-Unsubscribe` (mailto + URL) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (required by Gmail/Yahoo for bulk senders), unique `Message-ID`, `Feedback-ID`.
- **VERP / unique return-path** per send for bounce matching.
- Retry soft failures (4xx) with exponential backoff; mark hard failures (5xx) and suppress.
- Idempotency: one contact never gets the same campaign twice, even after worker restarts.
- Must comfortably handle **50,000+ emails/day** on a single mid-size VPS; document benchmarks.

### 5.8 Tracking and analytics
- Open tracking pixel, click tracking redirects (signed URLs to prevent tampering), per-link click stats.
- Detect and label machine opens (Apple Mail Privacy Protection, security scanners) so open rates are honest.
- Bounce processing: read bounce mailbox via IMAP, parse DSNs, classify hard/soft, update contact status.
- Complaint handling (feedback loop addresses) → auto-suppress.
- Campaign report page: funnel, timeline chart, top links, opens by device/client/country, bounce reasons, unsubscribe reasons; export PDF/CSV.
- Unsubscribe page (branded) with "unsubscribe from all" or "manage preferences", plus optional reason.

### 5.9 Admin, team and settings
- Users and roles, invite by email, 2FA, session management.
- Audit log (who did what, when).
- Company settings: name, physical address (required in footer), default sender, timezone, tracking domain.
- API keys for the public REST API + webhooks (events: sent, delivered, opened, clicked, bounced, unsubscribed).
- System health page: Redis, Postgres, worker status, queue depth, failed jobs (with retry button).

## 6. Own SMTP server (VPS) — infra deliverables in `/infra`
- Docker setup for **Postfix + OpenDKIM** (or document using Postal / Haraka as alternatives, with trade-offs).
- Scripts to generate DKIM keys and print the DNS records to add.
- Checklist doc `docs/deliverability.md`: PTR/rDNS setup, SPF/DKIM/DMARC, dedicated IP warmup plan, Gmail/Yahoo bulk-sender rules (one-click unsubscribe, spam rate < 0.3%), blocklist monitoring, and a note that many VPS providers **block port 25 by default** and must be asked to open it.
- Caddy reverse proxy with automatic HTTPS for `app.`, `track.` and `api.` subdomains.
- Backup script for Postgres (daily, keep 7 days).

## 7. Build phases (do them in order, commit after each)

| Phase | Deliverable |
|---|---|
| **0** | Repo scaffold (monorepo, Docker Compose with Postgres/Redis/Mailpit), **full brand kit** (section 4), CI (lint, typecheck, test), README |
| **1** | Auth, roles, dashboard shell with sidebar/topbar/command palette, dark mode, brand guide page |
| **2** | Mailbox management, encryption, test connection, limits, DNS checker |
| **3** | Contacts, custom fields, import/export, lists, tags, segments, suppression list, double opt-in, signup forms |
| **4** | Template editor (MJML), starter templates, personalization, previews, test send |
| **5** | Gemini AI package + AI writer panel + subject generator + spam checker + agent mode |
| **6** | Campaign wizard, BullMQ sending engine, throttling, rotation, warmup, pause/resume, A/B testing |
| **7** | Tracker service, open/click tracking, unsubscribe pages, bounce + complaint processing, reports |
| **8** | Automations/drips, REST API, webhooks, audit log, system health page |
| **9** | Production hardening: rate limits, security headers, load test, Postfix/OpenDKIM infra, Caddy, backups, VPS deploy guide (`docs/deploy-vps.md`) |

## 8. Development on GitHub before the VPS
- Use **GitHub Codespaces** (add `.devcontainer/`) so the whole stack runs in the browser without a server.
- GitHub Actions: lint + typecheck + tests on every push; build Docker images and push to **GitHub Container Registry (GHCR)**.
- In dev, all mail goes to **Mailpit** (never real inboxes) unless `SEND_MODE=live`.
- Final step: a `deploy.yml` workflow (manual trigger) that SSHes into the VPS and runs `docker compose pull && docker compose up -d`.

## 9. Quality bar / definition of done
- `docker compose up` → open `http://localhost:3000` → log in with seeded admin → see a populated, polished dashboard.
- No TypeScript errors, lint clean, tests passing in CI.
- Every form has zod validation and clear error messages; every list has empty, loading and error states.
- Lighthouse ≥ 90 on dashboard pages; accessible (keyboard navigation, focus states, alt text).
- Sending a 1,000-recipient test campaign to Mailpit completes with correct tracking, unsubscribe and suppression behavior.

## 10. Start now
Begin with **Phase 0**. First show me:
1. your final stack choices (and any changes from section 3 with reasons),
2. the Prisma schema draft (all core models: User, Workspace, Mailbox, Domain, Contact, CustomField, List, Tag, Segment, Suppression, Template, Campaign, CampaignVariant, Send, Event, Automation, ApiKey, Webhook, AuditLog, AiUsage),
3. 2–3 logo concept descriptions for Mailfox — then build the one you think is strongest.

Then implement Phase 0 completely and commit.