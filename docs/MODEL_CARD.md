# Fast Arm prototype model card

## Intended use
Demonstrate a deterministic, auditable comparison and review workflow using entirely synthetic cases and fictional approved demo records. Intended users are prototype evaluators with clinician, researcher or administrator demo roles. Patient care and prescribing are out of scope.

## Core model
No trained predictive model operates in the default deployment. Core version `fast-arm-1.0.0` evaluates structured rules, reads DEMO_SCORE fields and computes Pareto dominance. There is no training dataset, outcome-label validation, clinical accuracy claim, treatment-effect estimator or dose model.

## Uncertainty
Prototype uncertainty heuristic: `min(1, max(library uncertainty, 1 - evidence quality) + 0.1 * warnings + 0.2 * missing fields)`. Categories are descriptive bins only. This is not conformal prediction, Bayesian inference, calibration or a probability of patient benefit. The adapter interface allows a future validated estimator to replace it.

## Explanation providers
`MockExplanationProvider` renders structured rationale deterministically. `HuggingFaceExplanationProvider` accepts a locally cached causal model, requests sentence-index selection and reconstructs text solely from supplied rationale. All rationale sentences are retained and validated. Unsupported output falls back. Real model weights, hardware behavior and generation latency are not validated in this release; optional Transformers/PyTorch are not base dependencies. The HF adapter runs in offline/local-cache mode and no hosted inference endpoint is called.

## Evaluation
Software regression tests cover hard-gate precedence, evidence abstention, missing data, Pareto dominance, provider isolation/fallback, review restrictions and audit persistence. These are software tests, not clinical validation. See QA.md for executed results and VALIDATION_PLAN.md for future clinical work.

## Known failure modes
Administrator mistakes in fictional fixtures, stale fixtures, exact-string mismatches, missing structured values, unsupported contexts, unavailable optional model dependencies, database failures and user misunderstanding of demo scores. Safe handling includes validation errors, exclusion/abstention, template fallback, explicit errors and prominent disclaimers. Resource exhaustion from an opt-in local model needs deployment-specific process/memory limits before any experimental use.
