# V1 verification record

Verified on 2026-09-07 using Windows, Python 3.11.9 and Node.js 24.19.0.

## Passed
- **40 pytest tests**: safety/exclusion precedence, interactions, allergy/genomic rules, missing data, invalid/conflicting/stale/low evidence, unsupported context, finite numeric thresholds, five-objective Pareto behavior, provider result isolation and fallback, API persistence, review roles and eligibility, immutable records, input/library snapshots, revision conflicts, real Argon2 login, hashed sessions, expiry/logout, rate limiting, report escaping, admin create/update/retire and audit events.
- Fresh Alembic migration into an isolated database, followed by two seed runs: 21 domain tables plus the Alembic version table, 3 accounts, 10 cases, 6 therapies, 10 analyses and 2 synthetic seed reviews; no duplicate records from reseeding.
- **5 Playwright browser workflows** against the running Next.js production frontend and FastAPI backend: sign-in → exclusion inspection → eligible review → reload → report/audit; missing-data abstention and information request; case creation/edit/analysis; researcher restrictions; mobile navigation and absence of page overflow at 390px.
- Next.js optimized production build and TypeScript compilation.
- Frontend npm dependency audit: zero reported vulnerabilities at installation time. This is a point-in-time dependency check, not a security certification.
- Compose configuration parses successfully. Official container tags exist. Backend lockfile resolves for Python 3.11 Linux and frontend lockfile includes Alpine-compatible native dependencies.
- PostgreSQL offline migration compilation reviewed; database startup dependency, internal networking, nonroot app users, generated secrets and seed paths reviewed.
- Desktop and mobile screenshots captured under `docs/screenshots/` and visually inspected.

## Fixes found during QA
- Non-finite rule thresholds rejected instead of allowing invalid comparisons to rank.
- Case selector accessible name made explicit.
- Mobile table positioning fixed so visually hidden table headers cannot cause page overflow.
- Approval rechecks current evidence freshness in addition to saved input/library identity.
- Request body bounds cover missing content-length; malformed length values receive a controlled error.

## Not verified / not claimed
- Docker Desktop's engine was unavailable (missing Docker Linux-engine named pipe). Full container builds, startup, persistence across container restart and a live PostgreSQL integration run could not be executed in this environment. Compose is configured; this is not a claim that containers ran.
- No public domain or cloud deployment was provisioned. The website and API run locally at ports 3000 and 8000.
- No real Hugging Face weights were downloaded or run. The default template and mocked failure/integrity paths were tested.
- No clinical validation, medical accuracy study, regulatory assessment, clinician usability study, full accessibility certification, external penetration test or load test occurred.
- Two upstream test-client deprecation warnings remain; they do not fail the backend tests.

Browser tests append synthetic QA cases and review events to the connected local demo database. The shipped JSON seed files still contain exactly ten fictional cases. Use a disposable database for repeated browser runs.

## Continuation verification — 2026-09-08
- Re-ran all 40 backend tests successfully after adding database-backend identification for deployment checks.
- Tested managed local startup, health verification, idempotent repeated startup, process ownership verification and stopping/restarting both services. Fixed PowerShell JSON timestamp conversion and the Windows virtualenv launcher/child lifecycle.
- Ran the authenticated deployment smoke check successfully on SQLite: login, Pareto ranking, hard exclusion, rejection of excluded-candidate approval, missing-data abstention, clinician review, audit/report and researcher authorization.
- Stopped and restarted the services, then verified the exact prior result hash, original input hash and clinician review remained persisted.
- Added a container CI workflow and private credential-file override for browser tests. CI/container execution remains pending; configuration alone is not a passing runtime test.
- Docker's service is stopped. Starting it was denied by Windows service permissions; Docker Desktop did not establish its engine. No privilege bypass or system configuration change was attempted.
