# PRIVAVEDA System Architecture

> **Tagline:** यथा देहः तथा चिकित्सा (*Yathā dehaḥ tathā cikitsā*) — *"As the patient, so the treatment."*  
> **Core Principle:** SIMULATION BEFORE SUGGESTION.

---

## 1. Logical Layered Architecture

```text
                       PATIENT / SYNTHETIC CASE
                                  |
                                  v
                       SECURE LOCAL DATA VAULT
                  (AES-256-GCM Envelope Encryption)
                                  |
                                  v
                          DATA QUALITY GATE
                    (Schema, Pint Units, Bounds)
                                  |
             +--------------------+--------------------+
             |                                         |
             v                                         v
   MEDICAL KNOWLEDGE GRAPH                    PATIENT STATE MODEL
(NetworkX, Pseudonymous Nodes)              (Typed, Pint Unit-Aware)
             |                                         |
             +--------------------+--------------------+
                                  |
                                  v
                        DIGITAL TWIN BUILDER
                   (Parameter Vector θ_patient)
                                  |
                                  v
                           PK / PBPK ENGINE
                      (ODE-based, solve_ivp)
                                  |
                                  v
                         PARAMETER INFERENCE
                      (Optimization / MAP / MLE)
                                  |
                                  v
                         MONTE CARLO ENGINE
                    (Reproducible Random Seeds)
                                  |
                                  v
                        BAYESIAN CALIBRATION
                    (Predict-Learn-Update Loop)
                                  |
                                  v
                      MULTI-SCENARIO SIMULATOR
                       (Scenarios A, B, C...)
                                  |
                                  v
                         SAFETY RULE ENGINE
                   (Deterministic Hard Constraints)
                                  |
                                  v
                      UNCERTAINTY / ABSTENTION
                     ("We Don't Know" Policy)
                                  |
                  +---------------+---------------+
                  |                               |
                  v                               v
               ABSTAIN                        REVIEWABLE
                                                  |
                                                  v
                                             HUMAN REVIEW
                                                  |
                                                  v
                                         OBSERVED MEASUREMENT
                                                  |
                                                  v
                                           RECALIBRATE TWIN
```

---

## 2. Core Architectural Guarantees

1. **LLM Boundary:** The language model NEVER sits inside the numerical calculation path. The system operates with 100% functionality when the LLM is completely disabled.
2. **Local-First Runtime:** `PRIVAVEDA_OFFLINE=true` denies all external network traffic.
3. **Data Vault Separation:** Direct identity information (Name, MRN, contact) is stored in an encrypted `IdentityVault`. The `ClinicalVault` and simulation engine interact solely with pseudonymous patient identifiers (`PT-...`).
4. **First-Class Abstention:** "WE DON'T KNOW" is a first-class output generated whenever uncertainty, missing data, or model divergence precludes responsible simulation.
5. **Deterministic Safety:** Contraindications and pharmacogenomic safety rules are evaluated deterministically; LLMs are never the final authority on safety blocks.
6. **Append-Only Tamper-Evident Audit:** Cryptographic hash chaining ($H_n = \text{SHA256}(\text{canonical\_json}_n \parallel H_{n-1})$) guarantees end-to-end audit integrity.
