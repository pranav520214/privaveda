export type User = {
  id: string;
  username: string;
  role: "CLINICIAN" | "ADMIN" | "RESEARCHER";
};
export type CaseData = {
  label: string;
  synthetic: true;
  age_band: string;
  sex: string;
  condition: string;
  history: string[];
  medications: string[];
  allergies: string[];
  labs: Record<string, number>;
  genomics: Record<string, string>;
  organ_function: Record<string, string>;
  notes: string;
  revision?: number;
};
export type Case = {
  id: string;
  label: string;
  data: CaseData;
  revision: number;
  latest_analysis_id: string | null;
  latest_status: string;
  created_at: string;
};
export type Flag = {
  rule_id: string;
  action: string;
  reason: string;
  source: string;
  input: unknown;
  timestamp: string;
  analysis_id: string;
};
export type Evidence = {
  reference: string;
  title: string;
  source: string;
  status: string;
};
export type Candidate = {
  therapy_id: string;
  name: string;
  state: string;
  reasons: string[];
  flags: Flag[];
  missing_data: string[];
  evidence: Evidence[];
  source: string;
  last_reviewed: string;
  rank_reason: string;
  scores: {
    efficacy: number;
    toxicity: number;
    interaction: number;
    evidence_quality: number;
    label: string;
  } | null;
  uncertainty: {
    score: number;
    category: string;
    label: string;
    formula: string;
    calibrated: false;
  };
};
export type Review = {
  id: string;
  clinician: string;
  decision: string;
  candidate_id: string | null;
  comment: string;
  created_at: string;
};
export type Analysis = {
  id: string;
  case_id: string;
  created_at: string;
  input_snapshot: CaseData;
  input_hash: string;
  configuration_hash: string;
  analysis_engine_version: string;
  ruleset_version: string;
  therapy_library_version: string;
  explanation_provider: string;
  explanation_model: string;
  review_status: string;
  reviews: Review[];
  result: {
    status: string;
    message: string;
    candidates: Candidate[];
    missing_data: string[];
    context_supported: boolean;
    stages: string[];
    latency_ms: number;
    explanation: { text: string; mode: string; fallback: boolean };
  };
};
export type Therapy = {
  id: string;
  name: string;
  revision: number;
  validation_status: string;
  data: {
    name: string;
    indication: string;
    evidence_quality: number;
    validation_status: string;
    efficacy_demo_score: number;
    toxicity_demo_score: number;
    last_reviewed: string;
    [key: string]: unknown;
  };
};
export type Audit = {
  id: string;
  event_type: string;
  created_at: string;
  analysis_id: string | null;
  event_hash: string;
  data: Record<string, unknown>;
};
export type Metrics = {
  total_demo_cases: number;
  analysis_count: number;
  analysis_success_rate: number;
  abstention_count: number;
  safety_blocks: number;
  average_latency_ms: number;
  reviewed_count: number;
  awaiting_review: number;
  engine_version: string;
  ruleset_version: string;
  library_version: string;
  explanation_mode: string;
  clinical_validation: string;
  success_definition: string;
};
