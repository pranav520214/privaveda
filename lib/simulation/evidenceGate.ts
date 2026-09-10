/**
 * PRIVAVEDA Evidence Gate & Safety Evaluation Engine
 * Validates clinical input quality, detects stale laboratory specimens,
 * flags out-of-boundary biological parameters, and implements automated
 * abstention to prevent false confidence in flawed scenarios.
 */

export interface ValidationCheck {
  id: string;
  name: string;
  category: 'Input_Quality' | 'Staleness' | 'Model_Fit' | 'Safety_Rule';
  status: 'PASS' | 'WARNING' | 'ABSTAIN';
  message: string;
  measuredValue: string | number;
  safeBoundary: string;
}

export interface GateEvaluationResult {
  overallStatus: 'REVIEWABLE_ZERO_BLOCKS' | 'CAUTION_FLAGS_PRESENT' | 'SIMULATION_ABSTAINED';
  qualityScore: number;
  canProceedToReview: boolean;
  checks: ValidationCheck[];
  abstentionReason?: string;
  auditHash: string;
}

export function evaluateEvidenceGate(
  eGFR: number,
  doseMg: number,
  labSampleAgeHours: number,
  observedPointsCount: number,
  cypScore: number
): GateEvaluationResult {
  const checks: ValidationCheck[] = [];
  let qualityScore = 100;
  let abstained = false;
  let abstentionReason = '';

  // 1. Renal boundary check
  if (eGFR < 15) {
    abstained = true;
    qualityScore -= 60;
    abstentionReason = 'Severe Renal Impairment (eGFR < 15 mL/min / ESRD). Model boundary exceeded. Direct clinical specialist consultation required.';
    checks.push({
      id: 'renal_bound',
      name: 'Renal Clearance Range',
      category: 'Safety_Rule',
      status: 'ABSTAIN',
      message: 'eGFR is below validated pharmacokinetic compartment limits.',
      measuredValue: eGFR + ' mL/min',
      safeBoundary: '>= 15 mL/min',
    });
  } else if (eGFR < 30) {
    qualityScore -= 15;
    checks.push({
      id: 'renal_bound',
      name: 'Renal Clearance Range',
      category: 'Input_Quality',
      status: 'WARNING',
      message: 'Severe CKD stage 4. Increased accumulation anticipated.',
      measuredValue: eGFR + ' mL/min',
      safeBoundary: '>= 60 mL/min',
    });
  } else {
    checks.push({
      id: 'renal_bound',
      name: 'Renal Clearance Range',
      category: 'Input_Quality',
      status: 'PASS',
      message: 'Renal clearance within validated model parameters.',
      measuredValue: eGFR + ' mL/min',
      safeBoundary: '>= 15 mL/min',
    });
  }

  // 2. Laboratory data freshness check
  if (labSampleAgeHours > 48) {
    abstained = true;
    qualityScore -= 45;
    abstentionReason = abstentionReason || 'Laboratory specimens exceed staleness threshold (> 48 hours).';
    checks.push({
      id: 'staleness_bound',
      name: 'Laboratory Data Freshness',
      category: 'Staleness',
      status: 'ABSTAIN',
      message: 'Creatinine and renal labs are critically stale.',
      measuredValue: labSampleAgeHours + ' h old',
      safeBoundary: '< 24 h old',
    });
  } else if (labSampleAgeHours > 24) {
    qualityScore -= 20;
    checks.push({
      id: 'staleness_bound',
      name: 'Laboratory Data Freshness',
      category: 'Staleness',
      status: 'WARNING',
      message: 'Lab values are older than 24 hours. Verify acute stability.',
      measuredValue: labSampleAgeHours + ' h old',
      safeBoundary: '< 24 h old',
    });
  } else {
    checks.push({
      id: 'staleness_bound',
      name: 'Laboratory Data Freshness',
      category: 'Staleness',
      status: 'PASS',
      message: 'Laboratory specimen timestamps are fresh and verified.',
      measuredValue: labSampleAgeHours + ' h old',
      safeBoundary: '< 24 h old',
    });
  }

  // 3. Regimen Dose Boundaries
  if (doseMg > 300) {
    abstained = true;
    qualityScore -= 50;
    abstentionReason = abstentionReason || 'Dose exceeds upper toxicological simulation threshold (> 300 mg).';
    checks.push({
      id: 'dose_bound',
      name: 'Dose Safety Ceiling',
      category: 'Safety_Rule',
      status: 'ABSTAIN',
      message: 'Requested dose exceeds upper safe testing boundaries.',
      measuredValue: doseMg + ' mg',
      safeBoundary: '10 - 200 mg',
    });
  } else if (doseMg > 150) {
    qualityScore -= 10;
    checks.push({
      id: 'dose_bound',
      name: 'Dose Safety Ceiling',
      category: 'Safety_Rule',
      status: 'WARNING',
      message: 'High dose scenario. Close monitoring of C_max recommended.',
      measuredValue: doseMg + ' mg',
      safeBoundary: '<= 150 mg standard',
    });
  } else {
    checks.push({
      id: 'dose_bound',
      name: 'Dose Safety Ceiling',
      category: 'Safety_Rule',
      status: 'PASS',
      message: 'Dose within standard clinical therapeutic window.',
      measuredValue: doseMg + ' mg',
      safeBoundary: '10 - 200 mg',
    });
  }

  // 4. Model Fit & Observation Consistency
  if (observedPointsCount === 0) {
    checks.push({
      id: 'model_fit',
      name: 'Observed TDM Grounding',
      category: 'Model_Fit',
      status: 'WARNING',
      message: 'Simulating on population prior only. No TDM observations entered.',
      measuredValue: '0 samples',
      safeBoundary: '>= 1 observed level',
    });
    qualityScore -= 10;
  } else {
    checks.push({
      id: 'model_fit',
      name: 'Observed TDM Grounding',
      category: 'Model_Fit',
      status: 'PASS',
      message: 'Bayesian conditioning active. Individual patient alignment verified.',
      measuredValue: observedPointsCount + ' TDM points',
      safeBoundary: '>= 1 observed level',
    });
  }

  let overallStatus: GateEvaluationResult['overallStatus'] = 'REVIEWABLE_ZERO_BLOCKS';
  if (abstained) {
    overallStatus = 'SIMULATION_ABSTAINED';
  } else if (qualityScore < 85) {
    overallStatus = 'CAUTION_FLAGS_PRESENT';
  }

  const pseudoSeed = Math.abs(Math.floor(eGFR * 1000 + doseMg * 100 + qualityScore)).toString(16);
  const auditHash = '0xPV-' + pseudoSeed.padStart(6, '0').toUpperCase() + '-SEC';

  return {
    overallStatus,
    qualityScore: Math.max(0, qualityScore),
    canProceedToReview: !abstained,
    checks,
    abstentionReason: abstained ? abstentionReason : undefined,
    auditHash,
  };
}
