# PRIVAVEDA — Patient-Specific Simulation for Clinical Review

> **"The model simulates. The clinician decides."**  
> *यथा देहः तथा चिकित्सा* — *As the body, so the medicine.*

PRIVAVEDA is an interactive 3D scientific web platform and clinical decision support system designed for patient-specific pharmacokinetic simulation, Bayesian parameter updating, and auditable clinician review.

---

## Leadership & Vision
- **Team / Project Lead**: Pranav Kumar Mishra (Project Leadership, Software Architecture, Simulation Workflow)
- **Theme**: Healthcare & HealthTech
- **Ethos**: "Start with one medicine. Prove it carefully."

---

## System Architecture & Pipeline
1. **Patient Context Layer**: Multimodal clinical baseline (eGFR, serum creatinine, weight, CYP2D6 metabolizer genotype).
2. **Data Quality & Freshness Gate**: Pre-flight verification scanning specimen timestamps, physiological limits, and automated abstention.
3. **Pharmacokinetic ODE Engine**: Analytical 1-compartment and 2-compartment mechanistic solvers with allometric covariate scaling.
4. **Bayesian Updating Core**: Gaussian conjugate inference and Maximum A Posteriori (MAP) parameter estimation conditioned on observed Therapeutic Drug Monitoring (TDM) serum levels.
5. **Simulation Engine**: Continuous 24–48 hour concentration-time trajectories across custom dosing intervals.
6. **Uncertainty Propagation Engine**: Monte Carlo parameter perturbation (30 to 150 samples) generating explicit 10th-to-90th percentile credible envelopes.
7. **Evidence Gate & Safety Boundary**: Deterministic safety rules (`Reviewable · Zero Blocks`), cautionary flags, and explicit model abstention.
8. **Clinician Review Workbench**: Interactive scenario comparisons (Scenario A vs B), parameter sweeps, and explanations without autonomous prescribing.
9. **Immutable Audit Record**: Tamper-evident cryptographic provenance logging inputs, model version, and clinician authorization.

---

## Technology Stack
- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **3D Engine**: Three.js + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
- **Styling**: Tailwind CSS (warm ivory/charcoal editorial palette with restrained medical teal accents)
- **Icons**: Lucide React
- **Simulation**: Pure TypeScript numerical simulation engine (`lib/simulation/`)

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js v24.19.0)
- npm 9+

### Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive scientific platform.

### Production Build
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

---

## Vercel Deployment Instructions
1. Push this repository to GitHub or your Git provider.
2. Import the project into the [Vercel Dashboard](https://vercel.com).
3. Framework Preset: **Next.js**.
4. Root Directory: `./`
5. Click **Deploy**. No special secret environment variables are required for the public interactive visualization.

---

## Scientific Integrity Notice
PRIVAVEDA is a clinical simulation and decision support research project. All demonstrations on this platform use synthetic patient profiles (Case 1: Diabetic Nephropathy / CKD 3b, Case 2: Trauma ICU Hyperfiltration, Case 3: Geriatric Polypharmacy). The platform does not autonomously prescribe medications.
