# PRIVAVEDA Scope Boundaries & System Limitations

> **CRITICAL DISCLAIMER:**  
> PRIVAVEDA IS A RESEARCH, EDUCATION, AND RETROSPECTIVE-VALIDATION PROTOTYPE.  
> IT IS NOT A MEDICAL DEVICE. IT IS NOT AN AUTONOMOUS PRESCRIBER.  
> DO NOT USE THIS SOFTWARE TO PRESCRIBE OR MODIFY DRUG TREATMENT FOR REAL PATIENTS.

---

## 1. Scope Boundaries

1. **No Autonomous Prescribing:** PRIVAVEDA evaluates clinician-defined or synthetic candidate scenarios. It will never output an instruction telling a patient what dose to take.
2. **Synthetic Data Default:** All demonstration profiles, test fixtures, and sample cases are 100% synthetic. No real Protected Health Information (PHI) is included.
3. **No Silent Clinical Inferences:** Absent clinical parameters are detected by the Data Quality Gate. If missing, the system cleanly abstains rather than silently guessing values.
4. **Distinction of Epistemic Status:**
   - **Observed input data:** Directly measured synthetic values.
   - **Derived quantities:** Mathematically calculated metrics ($AUC$, BMI).
   - **Model assumptions:** Linear clearance, well-stirred organ models.
   - **Estimated parameters:** MAP / Bayesian posterior parameters labeled `ESTIMATED`.
   - **Simulated outputs:** SciPy ODE trajectory solutions.
   - **Uncertainty:** Monte Carlo percentile bands and parameter variances.
   - **Validated knowledge:** Peer-reviewed CPIC / FDA guideline records.
   - **Experimental hypotheses:** Unverified literature records producing `WARN` only.

---

## 2. Technical Limitations

1. **Perfusion-Limited Kinetics:** The standard physiological PBPK model assumes rapid well-stirred perfusion equilibrium; permeability-limited tissue transport is not currently modeled.
2. **Linear Clearance Assumption:** High drug concentrations undergoing saturable non-linear Michaelis-Menten metabolism require specialized kinetic extensions.
3. **Sparse Observation Identifiability:** Estimating both clearance ($CL$) and volume ($V$) reliably requires at least two temporally separated plasma concentration measurements. With single observations, identifiability warnings are raised.
4. **Local Hardware Constraints:** High-fidelity Monte Carlo sweeps ($N \ge 1000$) require modern multi-core CPUs or local GPU acceleration.
