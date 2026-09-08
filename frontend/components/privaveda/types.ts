/**
 * PRIVAVEDA Phase 2 Types & Domain Interfaces
 */

export type ApplicationMode = "DEMO" | "RESEARCH";

export type Role = "CLINICIAN" | "RESEARCHER" | "ADMIN";

export type ComputeMode = "QUICK" | "STANDARD" | "RESEARCH";

export type ActiveView =
  | "OVERVIEW"
  | "PATIENT_DATA"
  | "TIMELINE"
  | "KNOWLEDGE_GRAPH"
  | "DIGITAL_TWIN"
  | "SIMULATION"
  | "SCENARIOS"
  | "UNCERTAINTY"
  | "VALIDATION"
  | "AUDIT"
  | "SECURITY"
  | "SYSTEM"
  | "GUIDED_DEMO";

export interface PatientProfile {
  case_id: string;
  label: string;
  synthetic: boolean;
  mode: ApplicationMode;
  weight_kg: number;
  age_years: number;
  sex: string;
  condition: string;
  egfr: number;
  genomics: {
    cyp2d6_score?: number;
    CYP2D6?: string;
  };
}

export interface SimulationMetrics {
  c_max_mg_l: number;
  t_max_hours: number;
  auc_0_24: number;
  c_trough_mg_l: number;
  half_life_hours: number | null;
}

export interface SimulationResponse {
  profile_id: string;
  patient_token: string;
  synthetic: boolean;
  mode: ApplicationMode;
  model_type: string;
  metrics: SimulationMetrics;
  safety_evaluation: {
    blocked: boolean;
    reasons: string[];
    warnings: string[];
  };
  time_series_sample: Array<{
    t_hours: number;
    concentration_mg_l: number;
  }>;
  monte_carlo_uncertainty?: {
    samples: number;
    median_c_max: number;
    percentile_5_c_max: number;
    percentile_95_c_max: number;
    tail_toxicity_risk: number;
  };
}

export interface CalibrateResponse {
  profile_id: string;
  patient_token: string;
  synthetic: boolean;
  observations_count: number;
  prior_parameters: {
    cl_systemic_l_h: number;
    v_total_l: number;
  };
  calibrated_parameters: {
    cl_systemic_l_h: number;
    v_total_l: number;
  };
  error_metrics: {
    prior_rmse_mg_l: number;
    posterior_rmse_mg_l: number;
    rmse_improvement_mg_l: number;
  };
  simulation_metrics_v2: {
    c_max_mg_l: number;
    auc_0_24: number;
  };
  updated_time_series?: Array<{
    t_hours: number;
    concentration_mg_l: number;
  }>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  description: string;
  source: string;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  confidence: string;
  provenance: string;
}

export interface KnowledgeGraphData {
  case_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  integrity_verified: boolean;
}

export interface PrivacyInspectionResult {
  total_fields_scanned: number;
  identifiable_fields: Array<{
    field_path: string;
    field_name: string;
    preview: string;
    sensitivity: string;
    category: string;
    recommendation: string;
  }>;
  has_direct_identifiers: boolean;
  suggested_pseudonym: string;
  quarantine_recommended: boolean;
  inspection_notes: string[];
}
