# Architecture

```
                    ┌──────────── Caddy (HTTPS) ─────────────┐
                    │  app.<domain>    track.<domain>        │
                    └──────┬──────────────────┬──────────────┘
                           │                  │
                 ┌─────────▼────────┐  ┌──────▼─────────┐
                 │ apps/web (Next)  │  │ apps/tracker   │  open pixel, click redirect,
                 │ dashboard + API  │  │ (Fastify)      │  unsubscribe, one-click POST
                 └───┬─────────┬────┘  └──────┬─────────┘
          enqueue    │         │ read/write   │ write events
                 ┌───▼───┐  ┌──▼──────────────▼──┐
                 │ Redis │  │     PostgreSQL     │
                 │BullMQ │  │  (Prisma, packages/db)
                 └───┬───┘  └──▲─────────────────┘
                     │         │
                 ┌───▼─────────┴────┐     SMTP (pooled)   ┌───────────────────────┐
                 │ apps/worker      ├────────────────────►│ own Postfix+OpenDKIM  │
                 │ send · bounce ·  │                     │ or external mailboxes │
                 │ schedule · warmup│◄──── IMAP bounces ──┤ (Mailpit in dev)      │
                 └──────────────────┘                     └───────────────────────┘
```

## Sending pipeline (built in Phase 6)

1. Campaign is scheduled → `mf-schedule` job fires at `scheduledAt`.
2. `mf-campaign` expands audiences (lists/segments minus exclusions minus suppressions) in batches and
   inserts `Send` rows — `@@unique([campaignId, contactId])` makes this idempotent.
3. One `mf-send` job per `Send`. The worker picks a mailbox (direct or pool rotation, respecting hourly/daily
   limits, warmup schedule and per-recipient-domain throttles), re-checks suppression, renders personalised
   HTML + text, rewrites links for tracking, adds `List-Unsubscribe` / `List-Unsubscribe-Post`, `Message-ID`,
   `Feedback-ID` and a VERP `Return-Path`, then sends over a pooled SMTP connection.
4. 4xx → `DEFERRED` + exponential backoff; 5xx → `FAILED`/`BOUNCED` + suppression.

## Packages

- `@mailfox/core` — framework-free: env, crypto, roles, queue names, utils.
- `@mailfox/db` — Prisma schema/client; the only package that talks to Postgres directly.
- `@mailfox/email` — MJML layout/renderer/personalization; no DB access, pure functions.
- `@mailfox/ai` — Gemini wrapper (Phase 5).
- `@mailfox/ui` — React components + design tokens; consumed only by `apps/web`.

Node packages compile to `dist/` (NodeNext ESM); `@mailfox/ui` is transpiled by Next directly.

## Security baseline

- Secrets at rest (SMTP/IMAP passwords, TOTP, DKIM private keys, webhook secrets): AES-256-GCM, versioned payloads.
- API keys and tokens are stored as SHA-256 hashes; only a short prefix is kept for display.
- Tracking and unsubscribe links are HMAC-signed.
