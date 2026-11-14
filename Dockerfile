# syntax=docker/dockerfile:1.7
# One multi-stage Dockerfile for every Mailfox service. Pick a service with --target:
#   web | worker | tracker | migrate
# docker compose does this for you.

ARG NODE_VERSION=22

# ── base ─────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable
WORKDIR /repo

# ── build: install all deps, generate Prisma client, build every package ──
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --offline
RUN pnpm turbo run build

# ── migrate: one-shot job — apply migrations, then seed demo data (idempotent) ──
FROM build AS migrate
CMD ["sh", "-c", "pnpm --filter @mailfox/db migrate:deploy && pnpm --filter @mailfox/db seed"]

# ── worker ───────────────────────────────────────────────────
# Phase 0 ships the full build stage; Phase 9 slims worker/tracker images with `pnpm deploy`.
FROM build AS worker
ENV NODE_ENV=production
WORKDIR /repo/apps/worker
CMD ["node", "dist/index.js"]

# ── tracker ──────────────────────────────────────────────────
FROM build AS tracker
ENV NODE_ENV=production
WORKDIR /repo/apps/tracker
EXPOSE 3001
CMD ["node", "dist/index.js"]

# ── web: Next.js standalone output, small runtime image ──────
FROM node:${NODE_VERSION}-bookworm-slim AS web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system mailfox && useradd --system --gid mailfox mailfox
COPY --from=build --chown=mailfox:mailfox /repo/apps/web/.next/standalone ./
COPY --from=build --chown=mailfox:mailfox /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=mailfox:mailfox /repo/apps/web/public ./apps/web/public
USER mailfox
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
