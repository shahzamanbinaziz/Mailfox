#!/usr/bin/env bash
# Runs once when the Codespace / dev container is created.
set -euo pipefail

corepack enable
pnpm install --frozen-lockfile

if [ ! -f .env ]; then
  cp .env.example .env
  key=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  sed -i "s#^ENCRYPTION_KEY=.*#ENCRYPTION_KEY=${key}#" .env
  sed -i "s#^AUTH_SECRET=.*#AUTH_SECRET=$(openssl rand -base64 32)#" .env
  sed -i "s#^TRACKING_SIGNING_SECRET=.*#TRACKING_SIGNING_SECRET=$(openssl rand -base64 32)#" .env
  echo "Created .env with fresh random secrets."
fi

pnpm db:generate
echo
echo "🦊 Ready. Two ways to run Mailfox:"
echo "   docker compose up                     # full stack in containers"
echo "   docker compose up -d postgres redis mailpit && pnpm db:deploy && pnpm db:seed && pnpm dev"
