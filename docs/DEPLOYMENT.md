# Deployment route: unified Docker host

## Local evaluation
Start Docker Engine/Desktop, then `docker compose up --build` from the repository root. Open `http://localhost:3000`. A secrets-init container generates a random PostgreSQL password in a named volume; PostgreSQL reads it through `POSTGRES_PASSWORD_FILE`; the backend reads the same file without exposing it in Compose interpolation or logs. Startup waits for the database, migrates/seeds the backend, then waits for backend health before starting Next.js.

Retrieve demo credentials privately with `docker compose exec backend cat /app/runtime/demo-credentials.txt`. Persistent named volumes hold database data, the database secret and bootstrap credentials. Never publish their contents.

## HTTPS hosting
Use a Linux host with Docker/Compose, a domain and an HTTPS reverse proxy such as an operator-managed Caddy/Nginx installation. The application's single public service is the Next.js frontend at loopback port 3000. Proxy the chosen HTTPS domain to that port; `/api/v1` remains same-origin and Next.js proxies it to the internal backend. WebSockets are only needed for development, not the production build.

1. Copy the repository to the chosen host through an authorized private deployment path.
2. Set `ALLOWED_ORIGINS=https://your-domain.example` and `COOKIE_SECURE=true` in root `.env`. Keep `BIND_ADDRESS=127.0.0.1` when the reverse proxy runs on the host. Use an explicitly configured network if the proxy itself is containerized; never expose the database.
3. Run `docker compose up --build -d`. Configure HTTPS termination and frontend HSTS at the proxy.
4. Check `docker compose ps`, `docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').status)"`, and website login through HTTPS.
5. Retrieve credentials through a private administrator terminal and distribute only to authorized prototype evaluators. Document who has admin access.
6. Run the synthetic workflow: SYN-002 exclusion, SYN-005 abstention, eligible review, audit and report. Confirm persistence across `docker compose restart`.
7. Set up encrypted backups of PostgreSQL and test restore. Restrict server access, set gateway rate limits and monitor health. Keep the prototype disclaimer visible.

This repository does not provision a hosting account, purchase a domain, issue certificates or assert that a public website exists. A public deployment needs a user-controlled destination and its credentials. See QA.md for current environment verification limits.

## Build and update
Frontend proxy target is baked into the Next build (`http://backend:8000` for Compose). Changing the topology requires a rebuild. Each backend release runs `alembic upgrade head`; new schema changes must ship a new versioned migration. Do not modify revision 0001 after deployment. Seed is idempotent and does not reset administrator edits or passwords. Never regenerate review dates to bypass stale-evidence abstention.

For updates: take a database backup, pull the reviewed release, build, apply migrations through normal startup, run smoke tests and retain the previous image for rollback. Restoring a database backup is needed when reversing incompatible schema changes; a code rollback alone is insufficient.

## Troubleshooting
- Docker named-pipe/socket error: the Docker engine is not running. Start/fix Docker Desktop or use the documented local Python/Node route.
- Port 3000 busy: stop the service you own or set `PORT` to another port and update `ALLOWED_ORIGINS` to match.
- Login 403: check the exact browser origin and HTTPS setting. An HTTP site cannot use Secure cookies.
- Login 401: use generated credentials for that installation; env password changes do not overwrite existing users.
- API unavailable: check backend health and migration completion; do not expose database logs or secrets in bug reports.
- All stale-fixture abstentions: inspect review dates; fictional fixtures deliberately expire after the configured freshness window.
- Optional model failure: the template remains available; base images do not install model runtimes or weights.

## Current scaling boundary
One backend worker and one shared synthetic workspace. PostgreSQL supports a deployment foundation, but multi-worker rate limiting, tenancy, external audit integrity and independent load/reliability testing are not implemented. No PHI or direct patient-care deployment is supported.

## Repeatable container verification
On a Docker-enabled machine, after startup, copy credentials privately without printing their contents:

```sh
mkdir -p .local
docker compose cp backend:/app/runtime/demo-credentials.txt .local/container-credentials.txt
python scripts/smoke.py --credentials-file .local/container-credentials.txt --expected-database postgresql
docker compose restart backend frontend
docker compose up --wait --wait-timeout 120
python scripts/smoke.py --credentials-file .local/container-credentials.txt --verify-only --expected-database postgresql
```

Use PowerShell's `New-Item -ItemType Directory -Force .local` instead of `mkdir -p` on Windows. Keep the credential file private. Smoke checks append synthetic analysis/review events; they never delete database volumes. The included CI workflow applies the same checks on an ephemeral Ubuntu runner when this project is used as a repository and the workflow is triggered.
