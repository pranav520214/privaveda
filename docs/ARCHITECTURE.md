# Fast Arm architecture

The browser uses a same-origin Next.js proxy to FastAPI. FastAPI owns all clinical-demo data decisions, authorization and persistence. The UI never independently computes eligibility. Direct API callers receive the same role checks and validations as browser callers.

## Domain and storage

SQLAlchemy tables model User, ClinicianProfile, AuthSession, PatientCase, ClinicalObservation, GenomicObservation, LabObservation, MedicationRecord, Therapy, TherapyEvidence, ContraindicationRule, InteractionRule, GenomicRule, AnalysisRun, CandidateResult, SafetyFlag, EvidenceReference, UncertaintyResult, ClinicianReview, ClinicianDecision and AuditEvent. Records carry UUIDs, timestamps, provenance and validation status. Observations and library children are synchronized transactionally with validated canonical JSON records. No clinical dose field exists.

Alembic revision 0001 freezes the initial schema explicitly. Future changes require new migrations. SQLite and PostgreSQL use the same ORM layer. SQLite foreign-key enforcement is enabled. PostgreSQL is the deployment target.

An analysis transaction persists the complete case input, library snapshot, configuration, SHA-256 hashes, engine version, ruleset version, provider/model identifiers, UTC timestamp and result. Every candidate's evaluations, flags, evidence and uncertainty are also materialized as domain rows. Review records append to the analysis and never rewrite the analysis result. The original structured result is reproducible by calling `analyze` with the saved input, library, config and original UTC date under the recorded engine release. Explanation ordering is not guaranteed to be reproducible across third-party model versions; the actual explanation is stored.

## Execution

1. Validate typed case data; no unstructured note parser.
2. Select therapies with matching fictional indication, then revalidate library schemas.
3. Evaluate hard safety and exact allergy rules before evidence scoring.
4. Block hard failures. Abstain for missing required/rule fields, conflicts, invalid or stale evidence, context mismatch and low quality.
5. Read approved synthetic score fields; calculate the transparent heuristic. High uncertainty abstains.
6. Compute pairwise dominance on all five objectives for eligible candidates only.
7. Produce structured rationale. Optional explanation receives a deep copy and may only output existing rationale sentences.
8. Persist the run and audit events atomically, then await clinician review.

Each excluded therapy includes triggered rule, structured input, source, UTC time and run UUID. Application audit summaries keep raw case values out; the authorized safety inspector contains the necessary synthetic evidence. Review approval is rejected if the case/library changed or evidence is no longer eligible. Rejection, requests for information and inconclusive review remain available for abstained analyses.

## Frontend

Responsive neutral/green clinician workspace with permanent disclaimers. A three-column desktop analysis layout separates case summary, comparison and safety/evidence. On narrow screens the content stacks. Chart points are keyboard-operable and card selection mirrors chart selection. Snapshot URLs (`?analysis=UUID`) restore results after reload. All API output is escaped by React; reports use HTML escaping. Administrators edit the full typed JSON record so no rule edit is hidden.

## Boundaries and extension points

`UncertaintyEstimator` and `ClinicalExplanationProvider` are replaceable service interfaces. Structured observations can later map to separate importer interfaces without changing the deterministic engine. There is no connection to a Slow Arm or experimental-therapy route. Any future research arm needs separate data/storage/authorization and cannot silently enter this library.
