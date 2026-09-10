/**
 * PRIVAVEDA Pharmacokinetic Simulation Engine
 * Mechanistic ODE analytical solvers with allometric covariate scaling
 * and Monte Carlo parameter uncertainty propagation.
 * 
 * NOTE: This is an educational and interactive scientific demonstration model
 * reflecting the PRIVAVEDA prototype architecture shown in Case 1.
 */

export interface PatientCovariates {
  weightKg: number;
  eGFR: number; // mL/min
  cyp2d6Score: number; // 0 (poor), 0.5 (intermediate), 1.0 (normal), 1.5+ (ultra)
  age: number;
  isMale: boolean;
}

export interface RegimenParameters {
  doseMg: number;
  route: 'Oral' | 'IV_Bolus';
  intervalHours: number;
  numDoses: number;
  modelArchitecture: '1-Compartment' | '2-Compartment';
}

export interface SimulationPoint {
  timeHours: number;
  concentrationMedian: number;
  concentrationP10: number;
  concentrationP90: number;
  isObservedPoint?: boolean;
}

export interface SimulationResult {
  timeline: SimulationPoint[];
  cMax: number;
  tMax: number;
  auc024: number;
  halfLifeHours: number;
  clearanceLPerHr: number;
  volumeDistributionL: number;
  samplesCount: number;
}

export interface ObservedTdmPoint {
  id: string;
  timeHours: number;
  concentrationMgL: number;
  sampleAgeHours: number;
  notes?: string;
}

/**
 * Calculates baseline patient clearance adjusted allometrically by weight, renal eGFR, and CYP2D6.
 * CL = CL_base * (Weight/70)^0.75 * (eGFR/90)^0.85 * CYP_factor
 */
export function calculatePatientParameters(patient: PatientCovariates) {
  const baseCL = 3.2; // L/h baseline for reference drug
  const baseVd = 45.0; // L baseline volume of distribution
  const ka = 1.1; // Absorption rate constant (1/h)

  const weightFactor = Math.pow(patient.weightKg / 70.0, 0.75);
  const renalFactor = Math.pow(Math.max(10, patient.eGFR) / 90.0, 0.85);
  const cypFactor = 0.4 + 0.6 * Math.max(0.1, patient.cyp2d6Score);

  const clearance = baseCL * weightFactor * renalFactor * cypFactor;
  const volume = baseVd * (patient.weightKg / 70.0);
  const ke = clearance / volume;
  const halfLife = Math.LN2 / ke;

  return { clearance, volume, ka, ke, halfLife };
}

/**
 * Analytical 1-Compartment PK concentration calculation for oral or IV bolus administration.
 */
export function calculateConcentrationAtTime(
  t: number,
  doseMg: number,
  route: 'Oral' | 'IV_Bolus',
  CL: number,
  Vd: number,
  ka: number,
  F: number = 0.85
): number {
  if (t < 0) return 0;
  const ke = CL / Vd;

  if (route === 'IV_Bolus') {
    return (doseMg / Vd) * Math.exp(-ke * t);
  }

  // Oral 1-compartment with absorption
  if (Math.abs(ka - ke) < 0.001) {
    return ((doseMg * F * ka) / Vd) * t * Math.exp(-ke * t);
  }
  return ((doseMg * F * ka) / (Vd * (ka - ke))) * (Math.exp(-ke * t) - Math.exp(-ka * t));
}

/**
 * Monte Carlo simulation propagating parameter uncertainties to obtain median, P10, and P90 trajectories.
 */
export function runSimulation(
  patient: PatientCovariates,
  regimen: RegimenParameters,
  observedPoints: ObservedTdmPoint[] = [],
  fidelity: 'QUICK' | 'STANDARD' | 'RESEARCH' = 'STANDARD'
): SimulationResult {
  const { clearance: meanCL, volume: meanVd, ka: meanKa, halfLife } = calculatePatientParameters(patient);
  
  const sampleCounts = { QUICK: 30, STANDARD: 80, RESEARCH: 150 };
  const numSamples = sampleCounts[fidelity];

  // Adjust mean parameters if observed TDM points exist (Bayesian influence)
  let adjustedCL = meanCL;
  if (observedPoints.length > 0) {
    const avgObsRatio = observedPoints.reduce((acc, obs) => {
      const pred = calculateConcentrationAtTime(obs.timeHours, regimen.doseMg, regimen.route, meanCL, meanVd, meanKa);
      return acc + (pred > 0 ? obs.concentrationMgL / pred : 1);
    }, 0) / observedPoints.length;
    // Nudge clearance inverse to concentration
    adjustedCL = meanCL / Math.max(0.4, Math.min(2.5, avgObsRatio));
  }

  // Generate Monte Carlo parameter sets
  const clStd = adjustedCL * (observedPoints.length > 0 ? 0.12 : 0.25); // Uncertainty contracts with data!
  const vdStd = meanVd * (observedPoints.length > 0 ? 0.10 : 0.18);

  const trajectories: number[][] = [];
  const timeSteps = 96;
  const maxTime = 24.0;
  const times: number[] = [];

  for (let i = 0; i <= timeSteps; i++) {
    times.push((i / timeSteps) * maxTime);
  }

  for (let s = 0; s < numSamples; s++) {
    // Normal sampling via Box-Muller
    const u1 = Math.max(0.0001, Math.random());
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

    const sCL = Math.max(0.5, adjustedCL + z0 * clStd);
    const sVd = Math.max(10.0, meanVd + z1 * vdStd);
    const sKa = Math.max(0.2, meanKa + (z0 * 0.1));

    const sampleCurve: number[] = [];
    for (const t of times) {
      let conc = calculateConcentrationAtTime(t, regimen.doseMg, regimen.route, sCL, sVd, sKa);
      if (regimen.modelArchitecture === '2-Compartment') {
        // Peripheral distribution effect dampening
        conc *= 0.85 + 0.15 * Math.exp(-0.4 * t);
      }
      sampleCurve.push(conc);
    }
    trajectories.push(sampleCurve);
  }

  // Compute percentiles for each time step
  const timeline: SimulationPoint[] = times.map((t, idx) => {
    const valuesAtT = trajectories.map(traj => traj[idx]).sort((a, b) => a - b);
    const p10Idx = Math.floor(numSamples * 0.1);
    const p50Idx = Math.floor(numSamples * 0.5);
    const p90Idx = Math.floor(numSamples * 0.9);

    return {
      timeHours: Number(t.toFixed(2)),
      concentrationMedian: Number(valuesAtT[p50Idx].toFixed(3)),
      concentrationP10: Number(valuesAtT[p10Idx].toFixed(3)),
      concentrationP90: Number(valuesAtT[p90Idx].toFixed(3)),
    };
  });

  // Calculate summary metrics
  let cMax = 0;
  let tMax = 0;
  let auc024 = 0;

  for (let i = 0; i < timeline.length; i++) {
    const pt = timeline[i];
    if (pt.concentrationMedian > cMax) {
      cMax = pt.concentrationMedian;
      tMax = pt.timeHours;
    }
    if (i > 0) {
      const prev = timeline[i - 1];
      const dt = pt.timeHours - prev.timeHours;
      auc024 += ((pt.concentrationMedian + prev.concentrationMedian) / 2) * dt;
    }
  }

  return {
    timeline,
    cMax: Number(cMax.toFixed(2)),
    tMax: Number(tMax.toFixed(1)),
    auc024: Number(auc024.toFixed(1)),
    halfLifeHours: Number(halfLife.toFixed(1)),
    clearanceLPerHr: Number(adjustedCL.toFixed(2)),
    volumeDistributionL: Number(meanVd.toFixed(1)),
    samplesCount: numSamples,
  };
}
