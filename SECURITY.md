# Security and known boundaries

This release accepts synthetic demonstrations only. It is not approved for PHI and is not a validated medical device.

## Implemented
- Argon2 password hashing and random per-account bootstrap passwords; no source-code credentials.
- Cryptographically random opaque cookie sessions stored only as SHA-256 token hashes in the database, expiring after eight hours and revoked at logout.
- HttpOnly / SameSite=Strict cookies. Secure cookies are configurable and required for HTTPS hosting.
- Server-side CLINICIAN / ADMIN / RESEARCHER authorization on every protected operation. API login response explicitly excludes password hashes.
- Exact CORS origins and cross-origin mutation rejection; same-origin Next.js proxy. Session-required endpoints prevent anonymous data access.
- Pydantic strict field validation, finite numeric rule/score values, bounded arrays/strings and bounded request bodies. SQLAlchemy uses parameterized queries.
- In-process per-client request and login rate limiting; generic login failures and no credentials or case bodies in routine server access logs.
- React escaping, server-report HTML escaping, CSP, anti-framing, no-referrer and nosniff headers. Environment-dependent HSTS on the API.
- Immutable ORM hooks for result/audit/review records and SHA-256 event integrity hashes.
- Pinned dependency manifests and lockfiles, nonroot application containers, no published database/backend ports, loopback-only frontend binding by default.
- Local-only optional model cache: no case data sent to model-hosting services.

## Limitations requiring work before broader use
All users share one synthetic workspace. No patient/tenant access controls, enterprise SSO/MFA, password-reset UI, account lockout, distributed rate limiter, request queue or external audit anchor exists. Rate limits are process-local and the frontend proxy may cause clients to share a bucket. Limit enforcement should move to the trusted HTTPS gateway if scaled; never blindly trust forwarded IP headers.

Audit hashes are unkeyed and stored beside records. A database owner can rewrite data and recompute hashes or delete events. ORM immutability is not database WORM storage. Add least-privileged database roles and independent append-only audit anchoring before any sensitive workflow. Application transactions preserve snapshot consistency for normal V1 use, but concurrent SQLite writes are not a high-concurrency production design; PostgreSQL is preferred.

The frontend CSP permits inline Next.js bootstrapping and development evaluation. A nonce-based production CSP is future hardening. HTTPS termination, HSTS on the frontend, disk encryption, backups, network access policy, monitoring, patching and incident response belong to the deployment operator. Docker named volumes are persistent but not automatically encrypted or backed up.

Generated local credentials are private files and must not be committed or shared. Set Windows ACLs appropriate to the workstation; POSIX chmod does not implement Windows ACL security. Docker bootstrap credential files are readable by the application container user. Rotate/remove bootstrap account access before sharing an installation beyond trusted evaluators.

No LLM output is trusted to create clinical claims. The opt-in HF adapter may consume substantial memory/time and loads only separately supplied cached weights; isolate it in a worker with time/resource limits before broader experimentation. Default deployments avoid this path entirely.

## Reporting
Report vulnerabilities privately to the repository owner. Include a minimal synthetic reproduction and affected version. Do not include secrets, patient data or exploit demonstrations against third-party systems in public issues.
