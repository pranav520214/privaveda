# Prototype safety model

**Research / Clinical Decision Support Prototype. Not validated for patient care.**

## Human control

The engine produces a candidate comparison, never a treatment order. No analysis is considered reviewed until an explicit authorized clinician decision is recorded. A request for information remains awaiting review. Approvals say “Approve for further clinical review.” Excluded or abstained candidates cannot be approved. Rejections and inconclusive decisions are retained alongside all earlier reviews.

## Restricted library

Only structured, schema-valid, administrator-approved **demo** library records can enter ranking. All supplied therapies, rule sources, evidence, genetic markers and scores are fictional. `local-demo://` references are fixture identifiers, not literature citations. DEMO_APPROVED does not assert medical validity. The clinician role cannot modify the library, and the researcher role cannot sign off. Retiring entries preserves their historical snapshots.

## Exclusions and abstention

Hard contraindication, exact synthetic allergy and interaction exclusions override every score. Missing required data or a missing observation needed by any rule cannot be filled by guesswork. Conflicting actions for an identical predicate, explicit conflict flags, unsupported rule schemas, invalid values, future/stale review dates and missing/conflicting/low-quality evidence prevent eligibility. If no candidate is eligible, return exactly:

> Insufficient validated evidence for recommendation.

A high score never rescues a blocked candidate. The UI and report show EXCLUDED and ABSTAINED separately from PARETO OPTIMAL and DOMINATED. The chart may show excluded points for audit visibility, but those points never participate in Pareto ranking.

## Provenance and explanation

Results store original input, library and configuration snapshots, hashes, analysis/ruleset versions, dates, evidence references and explanation provider/model. The optional local HF adapter is extractive: its output must contain only existing rationale sentences. It receives no case notes, cannot mutate the canonical result, and falls back on unavailable dependencies, uncached weights or invalid output. No generative engine invents evidence, contraindications, doses or associations.

## Audit

Case create/edit, library revision/retirement, analysis start, input/library/config hashes, every evaluated and triggered rule, exclusions, rankings, provider/fallback, run completion and clinician review/decision are persisted. Review comments live in their authorized domain records, not routine audit summaries. Immutable ORM event listeners prohibit updates/deletes of analyses, result children, reviews, decisions and audit records. Event hashes detect changes if compared to a trusted earlier copy, but are not external notarization; database administrators remain trusted.

## Limitations

These rules are software demonstrations, not medically validated safety checks. Empty medication/history/allergy lists mean “none recorded” in synthetic input, not independently verified absence. Exact matching has no medical terminology normalization. There is no diagnosis, notes interpretation, missing-data inference, clinical simulation, dosing, real genomic mapping or calibrated outcome confidence. This system must not be used for patient care. Prospective use requires a separate clinical, regulatory, security and validation program.
