# infra

Production infrastructure lands in **Phase 9**:

- `docker-compose.prod.yml` — pulls images from GHCR, requires real secrets (`${VAR:?}`)
- `Caddyfile` — automatic HTTPS for `app.`, `track.` and `api.` subdomains
- `postfix/`, `opendkim/` — own SMTP server, plus DKIM key generation script that prints DNS records
- `scripts/backup-postgres.sh` — daily dump, keep 7 days

Local development uses the root `docker-compose.yml`.
