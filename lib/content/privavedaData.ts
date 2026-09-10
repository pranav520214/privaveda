/**
 * PRIVAVEDA Central Knowledge Base & Clinical Architecture
 * Grounded directly in Privaveda_FINAL.pptx and authentic prototype captures.
 */

export interface PatientCase {
  id: string;
  name: string;
  condition: string;
  weightKg: number;
  eGFR: number;
  cyp2d6Score: number;
  cyp2d6Status: string;
  age: number;
  isMale: boolean;
  concomitantMeds: string[];
  allometricFormula: string;
  clinicalNarrative: string;
  sampleAgeHours: number;
  defaultDoseMg: number;
  defaultRoute: 'Oral' | 'IV_Bolus';
}

export const PATIENT_CASES: PatientCase[] = [
  {
    id: 'case-1',
    name: 'Case 1: CKD Stage 3b & CYP2D6 IM',
    condition: 'Type 2 Diabetes, Diabetic Nephropathy',
    weightKg: 68,
    eGFR: 38,
    cyp2d6Score: 0.5,
    cyp2d6Status: '*1/*4 (Intermediate Metabolizer)',
    age: 64,
    isMale: true,
    concomitantMeds: ['Metformin (held)', 'Lisinopril 20mg', 'Atorvastatin 40mg'],
    allometricFormula: 'CL proportional to W^0.75 * (eGFR/90)^0.85 * CYP_factor',
    clinicalNarrative: 'Impaired renal filtration combined with intermediate CYP2D6 hepatic clearance requires careful exposure curve inspection to avoid toxic accumulation while maintaining therapeutic efficacy.',
    sampleAgeHours: 4.2,
    defaultDoseMg: 100,
    defaultRoute: 'Oral',
  },
  {
    id: 'case-2',
    name: 'Case 2: Trauma ICU Hyperfiltration',
    condition: 'Polytrauma Sepsis, Augmented Renal Clearance',
    weightKg: 82,
    eGFR: 145,
    cyp2d6Score: 1.0,
    cyp2d6Status: '*1/*1 (Normal Extensive Metabolizer)',
    age: 29,
    isMale: true,
    concomitantMeds: ['Norepinephrine inf.', 'Fentanyl PRN', 'Cefepime 2g q8h'],
    allometricFormula: 'CL proportional to W^0.75 * (eGFR/90)^0.85 * CYP_factor',
    clinicalNarrative: 'High cardiac output and augmented renal clearance (ARC) cause rapid drug elimination. Standard population dosing leads to severe subtherapeutic exposure failure.',
    sampleAgeHours: 2.1,
    defaultDoseMg: 150,
    defaultRoute: 'IV_Bolus',
  },
  {
    id: 'case-3',
    name: 'Case 3: Geriatric Frailty & Polypharmacy',
    condition: 'Atrial Fibrillation, CKD Stage 3a, Sarcopenia',
    weightKg: 52,
    eGFR: 46,
    cyp2d6Score: 0.0,
    cyp2d6Status: '*4/*4 (Poor Metabolizer)',
    age: 81,
    isMale: false,
    concomitantMeds: ['Apixaban 2.5mg BID', 'Bisoprolol 5mg', 'Omeprazole 20mg'],
    allometricFormula: 'CL proportional to W^0.75 * (eGFR/90)^0.85 * CYP_factor',
    clinicalNarrative: 'Low body mass index and complete CYP2D6 metabolic deficit cause prolonged elimination half-life, drastically increasing the risk of accumulation on repetitive daily dosing.',
    sampleAgeHours: 6.8,
    defaultDoseMg: 50,
    defaultRoute: 'Oral',
  },
];

export const SYSTEM_LAYERS = [
  {
    id: '01',
    name: 'Patient Context Layer',
    subtitle: 'Multimodal Clinical Baseline',
    desc: 'Aggregates structured laboratory markers (serum creatinine, eGFR), current medication regimens, metabolic genotypes (CYP2D6), and physical body habitus.',
    color: '#0EA5E9',
  },
  {
    id: '02',
    name: 'Data Quality & Freshness Gate',
    subtitle: 'Pre-flight Integrity Scanner',
    desc: 'Evaluates sample timestamps, laboratory degradation latency, physiological ranges, and missing covariates before computational models are initialized.',
    color: '#00A896',
  },
  {
    id: '03',
    name: 'Pharmacokinetic ODE Engine',
    subtitle: 'Mechanistic Physiological Solvers',
    desc: 'Implements analytical and numerical differential equations modeling absorption, central vascular distribution, and non-linear organ elimination.',
    color: '#10B981',
  },
  {
    id: '04',
    name: 'Bayesian Updating Core',
    subtitle: 'Conjugate Posterior Inference',
    desc: 'Merges population pharmacokinetic priors with patient-specific Therapeutic Drug Monitoring (TDM) serum levels to contract parameter variance.',
    color: '#6366F1',
  },
  {
    id: '05',
    name: 'Simulation Engine',
    subtitle: 'Deterministic Trajectory Solver',
    desc: 'Simulates continuous concentration-time exposure curves across custom dosing schedules (QD, BID, continuous infusion) over 24-48 hour horizons.',
    color: '#8B5CF6',
  },
  {
    id: '06',
    name: 'Uncertainty Propagation Engine',
    subtitle: 'Monte Carlo Variance Envelope',
    desc: 'Propagates residual error and population parameter dispersion into 10th-to-90th percentile credible intervals, ensuring uncertainty is never hidden.',
    color: '#EC4899',
  },
  {
    id: '07',
    name: 'Evidence Gate & Abstention Switch',
    subtitle: 'Automated Safety Constraint',
    desc: 'Explicitly halts simulations or issues safety blocks if clinical inputs fall outside validated module domains or violate deterministic safety bounds.',
    color: '#F59E0B',
  },
  {
    id: '08',
    name: 'Clinician Review Workbench',
    subtitle: 'Interactive Scenario Comparison',
    desc: 'Provides clinicians with side-by-side scenario overlays, sensitivity sweeps, and mechanistic explanations without autonomous decision usurpation.',
    color: '#028090',
  },
  {
    id: '09',
    name: 'Immutable Audit Record',
    subtitle: 'Cryptographic Provenance',
    desc: 'Generates tamper-evident hashes of input states, model version hashes, simulation seeds, and clinician sign-offs for hospital compliance.',
    color: '#05668D',
  },
];

export const VALIDATION_STAGES = [
  {
    stage: '01',
    name: 'Synthetic Proof',
    status: 'CURRENT',
    desc: 'Reproduce verified ODE outputs against analytical benchmarks and Monte Carlo convergence baselines under extreme edge covariates.',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  },
  {
    stage: '02',
    name: 'Retrospective Model Evaluation',
    status: 'NEXT',
    desc: 'Evaluate model prediction error and interval calibration against historical de-identified hospital TDM registries across patient subgroups.',
    badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
  {
    stage: '03',
    name: 'Shadow-Mode Clinician Review',
    status: 'PLANNED',
    desc: 'Side-by-side observation in hospital clinical pharmacy teams without altering active bedside administration, testing workflow usability.',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  },
  {
    stage: '04',
    name: 'Site Readiness & Governance',
    status: 'FUTURE',
    desc: 'Hospital IT security audit, local network air-gapping verification, EHR integration compliance, and clinical governance sign-off.',
    badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
  },
  {
    stage: '05',
    name: 'Validated Production Modules',
    status: 'FUTURE',
    desc: 'Modular, medicine-by-medicine rollout expanding from high-stakes narrow therapeutic index drugs to multi-specialty clinical domains.',
    badgeColor: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
  },
];

export const RISK_MATRIX = [
  {
    id: 'model_mismatch',
    risk: 'Model Mismatch',
    impact: 'Misleading exposure estimate in atypical physiology',
    mitigation: 'Multi-center external cohort benchmarking and subgroup-stratified validation boundaries.',
    icon: 'AlertCircle',
  },
  {
    id: 'stale_inputs',
    risk: 'Stale Inputs',
    impact: 'False confidence in a scenario despite shifting renal/hepatic clearance',
    mitigation: 'Automated data-quality gate, specimen timestamp age thresholds, and model abstention.',
    icon: 'Clock',
  },
  {
    id: 'record_security',
    risk: 'Record Security',
    impact: 'Compromise of sensitive patient clinical records and biometric data',
    mitigation: 'On-premise deployment, pseudonymized patient identities, local encrypted storage, and zero cloud exfiltration.',
    icon: 'Shield',
  },
  {
    id: 'model_fit',
    risk: 'Model Fit Degradation',
    impact: 'High residual discrepancy between predicted and measured TDM levels',
    mitigation: 'Chi-squared residual thresholding with mandatory clinician notification and manual parameter override.',
    icon: 'Activity',
  },
  {
    id: 'clinical_workflow',
    risk: 'Workflow Disruption & Alert Fatigue',
    impact: 'Clinicians bypass alerts due to excessive non-actionable warnings',
    mitigation: 'Quiet non-obtrusive scenario overlays; crisp deterministic safety blocks reserved only for toxic excursions.',
    icon: 'UserCheck',
  },
];

export const TARGET_USERS = [
  {
    title: 'Clinical Pharmacists',
    focus: 'Precision Regimen Design',
    desc: 'Connect changing creatinine and concomitant medication interactions to real-time concentration forecasts.',
    roleBenefit: 'Reduces manual dosing calculator fragmentation and makes TDM peak/trough interpretation immediate.',
  },
  {
    title: 'Specialist Clinicians',
    focus: 'Targeted Clinical Review',
    desc: 'Review exposure scenarios and credible ranges within focused, high-stakes intensive care or oncology scenarios.',
    roleBenefit: 'Provides an inspectable trajectory rather than an opaque single number, preserving human clinical autonomy.',
  },
  {
    title: 'Hospital Clinical & IT Teams',
    focus: 'Governance & Local Security',
    desc: 'Verify workflow fit, on-premise deployment isolation, zero external cloud dependencies, and auditable logs.',
    roleBenefit: 'Maintains institutional data sovereignty and complies with strict patient privacy regulations.',
  },
];
