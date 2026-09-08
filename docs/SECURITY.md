# PRIVAVEDA Security Architecture

> **Security Paradigm:** Defense in Depth, Least Privilege, Local-First, Zero Trust.

---

## 1. Cryptographic Specifications

- **Symmetric Authenticated Encryption:** AES-256-GCM (NIST SP 800-38D).
- **Key Hierarchy:**
  - **Data Encryption Key (DEK):** Random 256-bit key per patient generated via cryptographically secure random bytes (`os.urandom(32)`).
  - **Key Encryption Key (KEK):** Master wrapping key derived via Argon2id (iterations=3, memory=64MB, lanes=4) or managed via platform `KeyProvider`.
- **Pseudonym Tokenization:** HMAC-SHA256 with a 32-byte protected salt key producing deterministic non-invertible tokens (`PT-...`).

---

## 2. Vault Segregation

| Partition | Data Types | Access Role | Key Material |
|---|---|---|---|
| **Identity Vault** | Name, MRN, Date of Birth, Contact Details | Direct Clinician, Admin | Identity KEK + Per-Patient DEK |
| **Clinical Vault** | Vitals, Labs, Genomics, Interventions | Clinician, Researcher, Engine | Clinical KEK + Per-Patient DEK |
| **Knowledge Graph** | Disease topologies, Enzymes, Evidence | Public/Internal Services | None (Pseudonymous Only) |

---

## 3. Tamper-Evident Audit Logging

Events are appended to an immutable hash chain:
$$H_n = \text{SHA-256}(\text{canonical\_json}(\text{event}_n) \parallel H_{n-1})$$

- **Genesis:** $H_0 = \text{SHA-256}(\text{"PRIVAVEDA\_AUDIT\_GENESIS\_CHAIN\_V1"})$
- **Verification:** Any modification, deletion, or reordering of historic events causes immediate verification failure.
- **Privacy:** Unnecessary clinical plaintext is excluded from audit event digests.

---

## 4. Access Control (RBAC + ABAC)

- **Roles:** `PATIENT`, `CLINICIAN`, `LAB`, `RESEARCHER`, `ADMIN`.
- **Contextual Attributes:** `purpose` (Care Delivery vs Research vs Emergency), `patient_consent`, `device_trust`.
- **Research De-Identification:** Automated stripping of direct and quasi-identifiers prior to research export.
- **Break-Glass Procedure:** Explicit clinician invocation, mandatory justification reason, high-severity audit event generation, minimal emergency field disclosure.
