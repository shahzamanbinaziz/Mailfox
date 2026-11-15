# Decisions

Sensible defaults picked when the brief left room, with the reason. Newest at the bottom of each phase.

## Phase 0

### D-001 · API lives in Next.js route handlers (no separate `apps/api`)

One deployable for the dashboard and its API, shared auth/session code, fewer moving parts on a single VPS.
Heavy and long-running work already sits outside the request path (`apps/worker`), and the public,
high-traffic endpoints (open pixel, clicks, unsubscribe) live in `apps/tracker`. The public REST API
(Phase 8) will be versioned route handlers under `/api/v1`. Can be split out later without touching the DB layer.

### D-002 · Auth: in-house database sessions (Lucia pattern), not Auth.js — _revised in Phase 1_

Phase 0 planned Auth.js v5. On implementation (Nov 2026) Auth.js v5 is still a beta on npm, and its credentials
provider cannot use database sessions — which "sign out other devices" and server-side revocation need.
Lucia v3 is deprecated; its author now publishes the session pattern itself as the recommended approach. We follow it:
random 256-bit token in an httpOnly cookie, only its SHA-256 stored in `Session`, 30-day sliding expiry,
revocation = deleting rows. Passwords: bcryptjs (cost 12) — pure JS, no native build in Docker.
~150 lines we fully control and test (`apps/web/src/lib/auth`).

### D-003 · TypeScript 6.0, not 7

TypeScript 7 (the Go-native compiler) is current, but `typescript-eslint` still requires TS < 6.1.
We pin `~6.0.3` and will move when the lint toolchain supports 7.

### D-004 · Prisma 7.10 stable (not 8.0 RC) with the `pg` driver adapter

`latest` on npm is an 8.0 release candidate; we stay on stable. Prisma 7 needs no Rust query engine at
runtime (`@prisma/adapter-pg`), which keeps images small. Generated client lives in `packages/db/src/generated`
(git-ignored, compiled into `dist`).

### D-005 · ESLint 9 (flat config)

ESLint 10 is out, but `eslint-config-next` plugins (react, import, jsx-a11y) are validated against 9.

### D-006 · Drag-and-drop editor = GrapesJS + grapesjs-mjml (Phase 4)

Free and open source, outputs MJML natively. Unlayer's useful tier is paid.

### D-007 · Fonts are self-hosted via Fontsource

`next/font/google` downloads at build time and leaks visitor IPs to Google. Fontsource packages are
served from our own domain — VPS-friendly and privacy-friendly.

### D-008 · Wordmark is outlined from Plus Jakarta Sans ExtraBold

`brand/scripts/build-wordmark.mjs` converts the text to SVG paths with opentype.js so logos never depend
on installed fonts. The same path data is exported to `packages/ui/src/brand/wordmark.ts`.

### D-009 · Email logos are PNG

Gmail and Outlook don't render SVG, so `build-icons.mjs` also exports `logo-full-email.png` (@3x).

### D-010 · Contrast rules

White text on fox-500 is only 2.9:1 (fails AA). Primary buttons use fox-500 background with ink-950 text
(6.2:1); orange text on light backgrounds uses fox-700 (6.1:1); on dark, fox-400 (7.7:1). Enforced by unit tests.

### D-011 · `packages/ui/src/tokens.ts` is the token source

The brief names `packages/ui/tokens.ts`; it lives under `src/` like all other source and is exported as
`@mailfox/ui/tokens`. Tailwind v4 is CSS-first, so `pnpm tokens:build` generates `tokens.css`
(`@theme` palette + light/dark semantic CSS variables with shadcn/ui-compatible names).

### D-012 · Brand guide page shipped in Phase 0 (polish in Phase 1)

The phase table lists `/brand` in Phase 1, but section 4 makes it part of the brand kit. A complete page ships
now; Phase 1 moves it inside the dashboard shell.

### D-013 · Dev-only default secrets in `docker-compose.yml`

Rule 5 (one command) and rule 2 (no hardcoded secrets) conflict for a first run. Compose provides clearly
labelled DEV-ONLY defaults that any `.env` overrides; the production compose file (Phase 9) uses `${VAR:?}`
and refuses to start without real secrets.

### D-014 · One multi-stage Dockerfile, targets per service

`web` uses Next's standalone output (small image). `worker`, `tracker` and `migrate` reuse the build stage
for now; Phase 9 slims them with `pnpm deploy`. A one-shot `migrate` service applies migrations and runs the
idempotent seed before the apps start.

### D-015 · Send idempotency is enforced by the database

`Send` has `@@unique([campaignId, contactId])` (and the same for automation steps), so a restarted worker can
never create a second email for the same contact + campaign.

### D-016 · Engagement and counters are denormalised

`Contact.lastOpenedAt/lastClickedAt` power engagement segments without scanning `Event`; `Campaign.*Count`
columns make dashboards O(1). `Event` remains the append-only source of truth.

## Phase 1

### D-017 · TOTP implemented in `@mailfox/core` (RFC 6238), verified against the RFC test vectors

TOTP is ~60 lines of HMAC; the popular library (otplib) changed its API in v13 and pulls extra deps. Our
implementation is checked against RFC 6238 Appendix B and RFC 4226 vectors in unit tests. Codes are accepted
±1 step for clock drift; the accepted step is stored (`User.totpLastStep`) so a code can never be replayed.
8 one-time recovery codes are stored as SHA-256 hashes. QR codes via the `qrcode` package.

### D-018 · Two-step login uses a signed, 5-minute "pending 2FA" ticket — not a half-session

After a correct password on a 2FA account we set an HMAC-signed cookie with `{uid, exp}`. Only the 2FA step accepts
it; no session exists until the second factor passes.

### D-019 · Login rate limits in Redis, with an in-memory fallback

30 attempts / 15 min per IP and 8 per email; 6 code attempts / 10 min per user at the 2FA step. If Redis is down,
an in-process window keeps limits on rather than failing open or blocking sign-in.

### D-020 · Server Actions allow `*.app.github.dev`

Codespaces forwards port 3000 via `*.app.github.dev` while sending `x-forwarded-host: localhost:3000`, which Next.js
rejects as a cross-origin Server Action. `next.config.ts` allows that suffix plus anything in
`SERVER_ACTIONS_ALLOWED_ORIGINS` (read at build time) for production domains.

### D-021 · Web server code never reads env at import time

`next build` imports route modules with no secrets (Docker build stage). `lib/server.ts` exposes `getEnv()`,
`getEncryptionKey()` and a lazy Prisma proxy so the build stays secret-free.

### D-022 · shadcn/ui-style primitives are hand-written in `@mailfox/ui`

The shadcn CLI fetches components from its registry at generation time. We keep the same API shape (Radix +
`cva` + `tailwind-merge`) in `packages/ui/src/components`, owned by the repo and reviewed like any other code.

### D-023 · Chart colours are validated, not eyeballed

Overview chart: sends = fox-600, unique opens = info-700 (light) / info-600 (dark). Checked with the dataviz
palette validator (CVD ΔE ≥ 25, ≥ 3:1 vs surface, both modes). One y-axis (both series are emails); a table view
toggle is provided for accessibility.

### D-024 · Brand guide stays a public page

`/brand` lives outside the authenticated shell so designers and partners can use it without an account; the sidebar links to it.

### D-025 · Seed is now versioned by idempotent blocks

The base seed still runs once. Phase 1 adds `seedTeam` (3 demo members) and `seedWelcomeSeries` (an active welcome
automation with ~30 days of sends) that each check for their own data, so existing databases (e.g. your Codespace)
pick them up on the next `docker compose up`.
