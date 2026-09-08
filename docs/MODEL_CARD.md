# PRIVAVEDA Model Card

> **Architectural Separation:** PRIVAVEDA maintains strict modular separation between:
> 1. Mechanistic Bio-Mathematical Models (ODE Pharmacokinetics / PBPK)
> 2. Parameter Estimator & Bayesian Calibrator
> 3. Optional Medical Language Model (MedGemma / Local Extractive Provider)
>
> They are never conflated into a monolithic "AI model".

---

## Component A: Mechanistic Pharmacokinetic & PBPK Model

- **Model Version:** `OneCompartment_PK_v1.0`, `TwoCompartment_PK_v1.0`, `Physiological_PBPK_v1.0`
- **Purpose:** Deterministic simulation of drug absorption, distribution, metabolism, and elimination across physiological compartments over time.
- **Governing Equations:** Mass balance differential equations solved via SciPy `solve_ivp` (`RK45`, `Radau`, `BDF`).
- **Inputs:**
  - Patient parameter vector $\theta_{\text{patient}}$: Clearance ($CL$), Volume of distribution ($V$), Absorption rate ($k_a$), Organ blood flows ($Q_i$), Partition coefficients ($K_{p,i}$).
  - Intervention: Dose (mg), route (oral / IV bolus / infusion), dosing interval.
- **Outputs:**
  - Time-course concentration trajectories $C(t)$ (mg/L).
  - Derived exposure metrics: $AUC_{0-t}$, $C_{\max}$, $t_{\max}$, $C_{\text{trough}}$, terminal elimination half-life $t_{1/2}$.
- **Training/Source Information:** First-principles physiological mass-balance physics; no statistical machine learning training data.
- **Validation:** Validated against closed-form analytical solutions with maximum absolute error $< 10^{-5}$ mg/L.
- **Failure Modes:** Stiff systems causing solver divergence, extreme parameter ratios causing overflow, unphysical negative rates.
- **Limitations:** Assumes perfusion-limited organ uptake and linear clearance; non-linear Michaelis-Menten kinetics are uncalibrated.
- **Intended Use:** Retrospective simulation, research comparison of candidate regimens, educational exploration.
- **Out-of-Scope Use:** Direct clinical dosing instructions for real patients.
- **Uncertainty Representation:** Propagated via Monte Carlo sampling; exposed as 5th–95th percentile prediction bands.

---

## Component B: Patient-Specific Parameter Estimator & Bayesian Calibrator

- **Model Version:** `Bayesian_MAP_Estimator_v1.0`
- **Purpose:** Updates physiological clearance and distribution volumes given sparse observed therapeutic drug monitoring (TDM) measurements.
- **Methodology:** Maximum A Posteriori (MAP) bounded optimization (L-BFGS-B) on log-parameter space with Gaussian priors.
- **Inputs:**
  - Prior parameter distributions ($\theta_0, \sigma_{\text{prior}}$).
  - Observed concentration measurements $(t_j, y_j, \sigma_j)$.
- **Outputs:**
  - Posterior parameter point estimates ($\theta_{\text{calibrated}}$).
  - 95% Wald confidence intervals.
  - Fisher Information Matrix condition number ($\kappa_{\text{FIM}}$) for identifiability.
  - Residual fit metrics: RMSE, MAE, $R^2$.
- **Training/Source Information:** Optimization-based statistical inference.
- **Validation:** Recovered known synthetic ground-truth parameters within $25\%$ margin; verified predict-learn-update loop.
- **Failure Modes:** Ill-conditioned Hessian due to collinear parameters or sparse observations ($N < 2$).
- **Limitations:** Relies on local quadratic approximation of posterior; does not sample full posterior geometry when multi-modal.
- **Intended Use:** Parameter refinement based on documented synthetic/retrospective laboratory points.
- **Out-of-Scope Use:** Automated dose adjustments without human clinician oversight.
- **Uncertainty Representation:** Quantified via posterior standard error and parameter credible intervals.

---

## Component C: Optional Medical Language Model (MedGemma Adapter)

- **Model Identifier:** `google/medgemma-4b-it` (or `NullMedicalModel` when offline/unloaded)
- **Purpose:** Medical text normalization and clinician-facing natural-language summaries of already-computed mechanistic ODE simulation outputs.
- **Inputs:** Structured simulation summaries (C_max, AUC, safety flags) and local literature citations.
- **Outputs:** Pydantic-validated JSON structures containing textual explanations and key driver summaries.
- **Training/Source Information:** Google MedGemma instruction-tuned foundation weights (when installed locally).
- **Validation:** Strict Pydantic output schema validation; prompt-injection sanitization filters.
- **Failure Modes:** Incomplete sentence generation, schema validation rejection, prompt injection exploitation attempts.
- **Limitations:** Does NOT perform numerical calculations; does NOT author safety rules; cannot override deterministic contraindications.
- **Intended Use:** Augmenting structured simulation results with readable natural language for clinician inspection.
- **Out-of-Scope Use:** Autonomous prescribing, medical diagnosis, inventing unverified drug associations.
- **Uncertainty Representation:** Explicit disclaimer included in all outputs; reports fallback status when weights are unavailable.
