# PRIVAVEDA · Precision Medicine Digital-Twin Platform

> **यथा देहः तथा चिकित्सा** (*Yathā dehaḥ tathā cikitsā*)  
> *"As the patient, so the treatment."*  
>
> **Core Engineering Principle:** SIMULATION BEFORE SUGGESTION.  
> **Product Category:** Local-first research prototype for patient-specific bio-mathematical digital-twin simulation and model-informed precision-medicine research.

---

## CRITICAL SAFETY & SCOPE BOUNDARY
- **Research & Education Prototype:** Not validated for direct patient care or real-world dosing.
- **NOT an Autonomous Prescriber:** PRIVAVEDA evaluates clinician-defined candidate scenarios; it never issues autonomous dosing orders.
- **Explicit Distinctions:** Rigorously distinguishes observed inputs, derived quantities, model assumptions, estimated parameters, simulated outputs, and uncertainty intervals.
- **Synthetic Data Default:** All demonstration fixtures and test profiles are entirely synthetic.

---

## Architectural Highlights

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
                      (ODE-based, SciPy solve_ivp)
                                  |
                                  v
                         PARAMETER INFERENCE
                      (Bayesian MAP / Least Squares)
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

- **LLM Decoupling:** The Language Model (LLM) **never sits inside the numerical calculation path**. Calculations proceed purely through mechanistic ODEs and deterministic rules.
- **Local-First & Offline:** `PRIVAVEDA_OFFLINE=true` blocks all outbound network egress.
- **Security & Privacy:** AES-256-GCM envelope encryption with per-patient DEK/KEK. Direct identity is isolated in `IdentityVault`; clinical simulation operates strictly on pseudonymous tokens (`PT-...`).
- **Cryptographic Audit Chain:** Append-only hash chain ($H_n = \text{SHA256}(\text{canonical\_json}_n \parallel H_{n-1})$) with automated tamper detection.
- **Unit Safety:** Powered by `Pint` to guarantee physical dimensional consistency across concentrations, clearances, and rates.

---

## One-Command Golden Demonstration

Run the complete 21-step end-to-end scientific and security demonstration:

```powershell
.\.venv\Scripts\python.exe scripts\run_golden_demo.py
```

### Demonstration Steps:
1. Load synthetic patient (`SYN-NORM-01`, synthetic=true)
2. Verify encrypted vault (AES-256-GCM)
3. Generate pseudonymous patient token (`PT-...`)
4. Execute Data Quality Gate (Pint units, physiological plausibility)
5. Construct NetworkX Medical Knowledge Graph
6. Build digital twin parameter vector ($\theta_{\text{patient}}$)
7. Display prior parameter uncertainty
8. Select candidate regimens (Scenarios A, B, C)
9. Solve mechanistic ODE simulation via SciPy `solve_ivp`
10. Propagate Monte Carlo uncertainty (100 samples)
11. Apply deterministic contraindication rules
12. Demonstrate hard BLOCK on CYP2D6 Poor Metabolizer toxicity
13. Demonstrate clean ABSTENTION on high parameter uncertainty
14. Demonstrate REVIEWABLE status for eligible scenario
15. Display 5th, 50th, and 95th percentile prediction intervals
16. Ingest synthetic observed therapeutic drug monitoring (TDM) point
17. Recalibrate patient parameters via Bayesian MAP
18. Re-run post-calibration digital twin simulation (V2)
19. Demonstrate observed-vs-predicted residual improvement
20. Record cryptographic simulation provenance manifest
21. Verify tamper-evident cryptographic audit chain

---

## Complete Verification Suite

Run the full verification suite (unit, numerical, security, property-based, offline, and E2E):

```powershell
.\.venv\Scripts\python.exe scripts\verify.py
```
or via PowerShell:
```powershell
.\scripts\verify.ps1
```

---

## Optional Medical Language Model (MedGemma)

PRIVAVEDA operates with 100% functionality with the language model disabled via `NullMedicalModel`.

To set up local Google MedGemma:
```powershell
$env:HF_TOKEN = "your_hf_token"
.\.venv\Scripts\python.exe scripts\download_medgemma.py
$env:MEDICAL_MODEL_PROVIDER = "medgemma"
$env:MEDICAL_MODEL_PATH = "models/medgemma"
```
Weights are verified with SHA-256 digests and validated through strict Pydantic schemas with prompt-injection defense.

---

## Documentation Index

- [Architecture & Design](docs/ARCHITECTURE.md)
- [Numerical Validation Report](docs/VALIDATION.md)
- [Security Architecture](docs/SECURITY.md)
- [Threat Model (14 Target Threats)](docs/THREAT_MODEL.md)
- [Model Card (Mechanistic, Estimator, LLM)](docs/MODEL_CARD.md)
- [Knowledge & Provenance Standards](docs/KNOWLEDGE_PROVENANCE.md)
- [Golden Demonstration Guide](docs/DEMO.md)
- [Offline Deployment & Hardware Detection](docs/OFFLINE_DEPLOYMENT.md)
- [Architectural Decisions (ADRs)](docs/DECISIONS.md)
- [Scope Boundaries & Limitations](docs/LIMITATIONS.md)

---

## License
MIT License. See [LICENSE](LICENSE) for details.
