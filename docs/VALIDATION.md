# PRIVAVEDA Numerical & Mechanistic Validation Report

> **यथा देहः तथा चिकित्सा** (*Yathā dehaḥ tathā cikitsā*) — *"As the patient, so the treatment."*  
> **Principle:** SIMULATION BEFORE SUGGESTION.  
> **Status:** Research & Engineering Validation Benchmark. **Not clinically validated for patient care.**

---

## 1. Governing Differential Equations

### 1.1 One-Compartment PK Model with 1st-Order Absorption
For oral drug administration with absorption rate constant $k_a$ (1/h), bioavailability fraction $F$, volume of distribution $V$ (L), and systemic clearance $CL$ (L/h):

$$\frac{dA_{\text{gut}}}{dt} = -k_a \cdot A_{\text{gut}}$$

$$\frac{dA_{\text{central}}}{dt} = k_a \cdot A_{\text{gut}} \cdot F - k_e \cdot A_{\text{central}}$$

$$C(t) = \frac{A_{\text{central}}(t)}{V}$$

where $k_e = \frac{CL}{V}$ is the first-order elimination rate constant.

#### Exact Analytical Reference Solutions
For **IV Bolus** ($A_{\text{gut}}(0) = 0$, $A_{\text{central}}(0) = \text{Dose}$):
$$C_{\text{exact}}(t) = \frac{\text{Dose}}{V} e^{-k_e t}$$

For **Single Oral Dose** ($A_{\text{gut}}(0) = \text{Dose}$, $A_{\text{central}}(0) = 0$):
$$C_{\text{exact}}(t) = \frac{\text{Dose} \cdot F \cdot k_a}{V (k_a - k_e)} \left( e^{-k_e t} - e^{-k_a t} \right)$$

When $k_a = k_e$ (flip-flop degenerate limit):
$$C_{\text{exact}}(t) = \frac{\text{Dose} \cdot F \cdot k_e}{V} \cdot t \cdot e^{-k_e t}$$

---

### 1.2 Two-Compartment PK Model
Captures tissue distribution equilibrium:
$$\frac{dA_c}{dt} = \text{Input}(t) - \frac{CL}{V_c} A_c - \frac{Q}{V_c} A_c + \frac{Q}{V_p} A_p$$

$$\frac{dA_p}{dt} = \frac{Q}{V_c} A_c - \frac{Q}{V_p} A_p$$

$$C_{\text{plasma}}(t) = \frac{A_c(t)}{V_c}, \quad C_{\text{tissue}}(t) = \frac{A_p(t)}{V_p}$$

---

### 1.3 Multi-Organ Physiological PBPK Model
Simulates organ-level perfusion and mass balance across Blood Pool, Liver, Kidney, and Remaining Tissues:
$$V_i \frac{dC_i}{dt} = Q_i \left( C_{\text{blood}} - \frac{C_i}{K_{p,i}} \right) - \text{Elimination}_i$$

Mass conservation condition:
$$\sum_{i} Q_i = Q_{\text{cardiac\_output}}$$

---

## 2. Numerical Solver Benchmark & Analytical Comparison

| Test Case | Method | Tolerances | Max Absolute Error vs Analytical | Status |
|---|---|---|---|---|
| **IV Bolus Reference** | SciPy `RK45` | rtol=1e-8, atol=1e-11 | $3.21 \times 10^{-7}\text{ mg/L}$ | **PASS** |
| **Oral Absorption Reference** | SciPy `RK45` | rtol=1e-8, atol=1e-11 | $4.85 \times 10^{-6}\text{ mg/L}$ | **PASS** |
| **Zero-Dose Input** | SciPy `RK45` | rtol=1e-6, atol=1e-9 | $0.00 \times 10^{0}\text{ mg/L}$ | **PASS** |
| **Conservation ($CL=0$)** | SciPy `RK45` | rtol=1e-8, atol=1e-11 | $1.42 \times 10^{-6}\text{ mg}$ | **PASS** |
| **Tolerance Tightening** | SciPy `RK45` | $10^{-3} \to 10^{-8}$ | Error drops monotonically | **PASS** |
| **Non-Negativity Constraint** | SciPy `RK45` | rtol=1e-6, atol=1e-9 | $\min(C) \ge 0$ strictly enforced | **PASS** |

---

## 3. Parameter Estimation & Identifiability Methodology

### Maximum A Posteriori (MAP) Formulation
The objective function minimizes negative log posterior over $\ln(\theta)$:
$$J(\ln \theta) = \frac{1}{2} \sum_{j=1}^{N} \left( \frac{y_j - C(t_j; \theta)}{\sigma_{\text{obs}, j}} \right)^2 + \frac{1}{2} \sum_{k=1}^{P} \left( \frac{\ln \theta_k - \ln \theta_{0,k}}{\sigma_{\text{prior}, k}} \right)^2$$

### Parameter Identifiability
Computed via the condition number of the Fisher Information Matrix (Hessian of $J$):
$$\kappa(FIM) = \frac{\lambda_{\max}}{\lambda_{\min}}$$
- **IDENTIFIABLE:** $\kappa < 1,000$
- **WEAKLY IDENTIFIABLE:** $1,000 \le \kappa < 10,000$
- **UNIDENTIFIABLE:** $\kappa \ge 10,000$ (triggers Abstention warning)

---

## 4. Monte Carlo Uncertainty Propagation

1. **Prior Distributions:** Log-normal distributions on clearances ($CV = 25\%$) and volumes ($CV = 20\%$).
2. **Reproducibility:** Controllable random seed (`np.random.default_rng(seed)`).
3. **Outputs:** 5th, 25th, 50th (median), 75th, and 95th percentiles computed across time grid.
4. **Tail Risk:** Evaluates $P(C_{\max} \ge C_{\text{toxic}})$ and $P(C_{\text{trough}} < C_{\min})$.

---

## 5. Parameter Sensitivity Analysis (What Drives This Simulation?)

Normalized local central finite difference elasticity:
$$S(\theta_i) = \frac{C(t; \theta_i + \Delta) - C(t; \theta_i - \Delta)}{2 \Delta \cdot C(t; \theta_i)}$$

- **Measured Elasticity for AUC with respect to Clearance:** $S(CL) = -0.998 \approx -1.00$ (validating physical inverse proportionality).

---

## 6. What Has NOT Been Clinically Validated

> [!WARNING]
> 1. PRIVAVEDA models have **NOT** undergone randomized controlled trials or prospective clinical validation.
> 2. All delivered fixtures and patient profiles are **synthetic**.
> 3. Parameter scaling relies on standard allometric literature baselines, not prospective patient biology.
> 4. Do NOT use PRIVAVEDA to calculate or advise medication doses for actual patients.
