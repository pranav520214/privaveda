# Fast Arm V1 design

Next.js serves a responsive clinician workspace and proxies `/api/v1` to FastAPI on the same origin. FastAPI owns cookie sessions, role checks, Pydantic validation, SQLAlchemy persistence, a deterministic safety pipeline and append-only audit events. SQLite is the local fallback; Compose uses PostgreSQL. Alembic versions the schema. Fictional therapies and synthetic cases are the only seed data.

## Backend and safety
Persist normalized domain entities alongside immutable input, library and result snapshots. Approvals mean demo-library approval only. Evaluate hard rules before evidence eligibility, apply conservative missing-data and conflict abstention, compute five-objective Pareto status and a explicitly uncalibrated uncertainty heuristic. No dose field or medical interpretation of notes. Store configuration and library content hashes, every evaluated rule, provider metadata and clinician review history. Explanation providers cannot modify result objects; optional local HF output is accepted only as selection of existing rationale sentences.

## Frontend
Dashboard, case entry/editing, persisted analyses, clickable Pareto chart, evidence and safety inspector, review, admin library editor, audit, validation metrics and printable reports. Excluded and abstained candidates are separated from ranked candidates. Approval disabled for ineligible candidates and abstained analyses.

## Security
Argon2 passwords, random opaque sessions stored hashed in DB, HttpOnly SameSite cookies, same-origin checks for mutation, explicit roles, CORS allowlist, bounded input and rate limits. No credentials in source; bootstrap generates local credentials in an ignored file. React escapes output. Reports use escaped server templates. No public deployment or external inference by default. All demo users share a synthetic workspace; no PHI tenancy claims.

## Delivery / acceptance
Implement schema and migration → seed library → safety/ranking/uncertainty → API → dashboard → review/audit → explanation adapters → regression and integration tests → Docker and documentation → browser QA. Acceptance includes persisted results after reload, all safety outcomes, enforced roles, review/audit/report, working local services, frontend production build and reproducible container configuration. Public hosting requires a configured deployment destination.
