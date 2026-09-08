# PRIVAVEDA Golden Demonstration Guide

> **Core Principle:** SIMULATION BEFORE SUGGESTION.  
> **Tagline:** यथा देहः तथा चिकित्सा (*Yathā dehaḥ tathā cikitsā*) — *"As the patient, so the treatment."*

---

## Running the Golden Demonstration

To execute the complete 21-step end-to-end demonstration from the project root:

### Windows PowerShell:
```powershell
.\.venv\Scripts\python.exe scripts\run_golden_demo.py
```

### Linux / macOS:
```bash
./.venv/bin/python scripts/run_golden_demo.py
```

---

## 21-Step Workflow Walkthrough

1. **Load Synthetic Patient:** Loads deterministic synthetic profile (`SYN-NORM-01`) marked `synthetic = true`.
2. **Verify Encrypted Vault:** Initializes AES-256-GCM envelope encryption for isolated Identity and Clinical vaults.
3. **Show Pseudonymous ID:** Registers direct identifiers and isolates clinical computation under token `PT-...`.
4. **Run Data Quality Gate:** Validates physiological plausibility, units (`Pint`), completeness, and timestamp ordering.
5. **Build Knowledge Graph:** Populates NetworkX directed graph linking patient tokens, lab measurements, and medications with full provenance.
6. **Build Digital Twin:** Constructs parameter vector $\theta_{\text{patient}}$ with allometric scaling for clearance and distribution volume.
7. **Initial Parameter Uncertainty:** Quantifies prior variances ($\sigma_{\ln CL} = 25\%$, $\sigma_{\ln V} = 20\%$).
8. **Select Candidate Scenarios:** Loads abstract clinician-defined regimens (Scenario A: Standard, Scenario B: Renal Reduction, Scenario C: Interval Extension).
9. **Run Mechanistic ODE Simulation:** Solves PK mass-balance equations via SciPy `solve_ivp`.
10. **Run Monte Carlo Uncertainty:** Evaluates 100 parameter trajectories to determine percentile bands and tail toxicity risks.
11. **Apply Deterministic Safety Rules:** Executes hard contraindication and pharmacogenomic safety rules.
12. **Show Scenario Blocked:** Demonstrates deterministic hard BLOCK on CYP2D6 Poor Metabolizer accumulation toxicity.
13. **Show Scenario Abstained:** Demonstrates clean ABSTENTION when parameter uncertainty exceeds acceptable bounds ($> 0.70$).
14. **Show Scenario Reviewable:** Flags safe, eligible scenarios for qualified human clinician review.
15. **Display Prediction Interval:** Reports 5th, 50th (median), and 95th percentile concentration bands across time.
16. **Add Synthetic Observed Measurement:** Ingests simulated therapeutic drug monitoring (TDM) laboratory points.
17. **Recalibrate Parameters:** Executes Bayesian MAP parameter update.
18. **Re-run Calibrated Twin:** Simulates post-calibration digital twin (V2).
19. **Show Observed-vs-Predicted Improvement:** Directly compares pre-calibration RMSE against post-calibration RMSE.
20. **Simulation Provenance Manifest:** Records cryptographic SHA-256 manifest of all input hashes, model versions, and solver seeds.
21. **Tamper-Evident Audit Trail:** Validates append-only cryptographic audit chain ($H_n = \text{SHA256}(\text{canonical\_json}_n \parallel H_{n-1})$).
