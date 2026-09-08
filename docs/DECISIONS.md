# PRIVAVEDA Architectural Decision Records (ADRs)

---

## ADR-001: Separation of LLM from Numerical ODE Calculation Path
- **Status:** Accepted
- **Context:** Language models hallucinate clinical numbers and lack mathematical determinism.
- **Decision:** The language model NEVER sits inside the numerical calculation path. Biological kinetics are calculated purely via SciPy ODE solvers. LLMs are restricted strictly to post-hoc natural language explanation of already-calculated outputs.
- **Consequence:** The platform functions with 100% reliability and zero loss of scientific capability if the LLM is disabled.

---

## ADR-002: Envelope Encryption with Cryptographic Identity/Clinical Vault Segregation
- **Status:** Accepted
- **Context:** Medical data leaks often expose direct patient identifiers alongside sensitive clinical parameters.
- **Decision:** Segregate data into an `IdentityVault` (direct identifiers) and a `ClinicalVault` (clinical observations indexed solely by pseudonymous tokens `PT-...`). Each record is encrypted with a random per-patient AES-256-GCM DEK wrapped by a master KEK.
- **Consequence:** The digital twin builder, knowledge graph, and numerical simulation never touch or store direct patient identity.

---

## ADR-003: Local-First Offline Enforcement via Socket Guard
- **Status:** Accepted
- **Context:** Privacy in clinical precision medicine requires certainty that patient records do not leak to external APIs.
- **Decision:** Implement `PRIVAVEDA_OFFLINE=true` with a network egress interceptor that raises `NetworkEgressBlockedError` on non-loopback outbound socket connections.
- **Consequence:** Eliminates all accidental egress to remote analytics, telemetry, or cloud inference.

---

## ADR-004: Pint Unit Registry for Physical Dimensionality Enforcement
- **Status:** Accepted
- **Context:** Comparing drug concentrations or clearance rates with mismatched units (e.g. mg/L vs ug/mL or mL/min vs L/h) causes catastrophic dosing calculation errors.
- **Decision:** Utilize Pint's `UnitRegistry` to validate physical dimensionality and convert all inputs to canonical SI simulation units prior to ODE integration.
- **Consequence:** Eliminates dimensional mismatch bugs across clinical observations.

---

## ADR-005: Cryptographic Tamper-Evident Hash Chaining for Audit Logs
- **Status:** Accepted
- **Context:** Audit logs in SQLite or standard databases can be altered by database administrators without leaving traces.
- **Decision:** Enforce cryptographic hash chaining: $H_n = \text{SHA256}(\text{canonical\_json}_n \parallel H_{n-1})$. Provide `verify_integrity()` to mathematically verify history.
- **Consequence:** Any dropped, modified, or reordered audit record causes immediate cryptographic verification failure.
