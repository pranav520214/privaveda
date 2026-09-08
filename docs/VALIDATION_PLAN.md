# Future validation plan — not yet performed

No retrospective or prospective clinical evaluation has occurred. All current metrics describe synthetic software demonstrations.

## Prerequisites
Define a narrow clinical context and intended-use statement with qualified clinicians. Obtain lawful, approved, appropriately de-identified datasets and institutional oversight. Independently curate therapy evidence, contraindications, interactions and genetic associations with explicit provenance and review dates. Establish inclusion criteria, adjudication procedures and a locked evaluation protocol before measuring performance.

## Retrospective evaluation
Create patient-separated development, calibration and held-out evaluation cohorts with temporal and site separation where feasible. Prevent patient/evidence leakage. Record missingness, supported contexts and dataset limitations. Compare against a predefined reference standard established by independent clinicians, resolving disagreement through blinded adjudication.

## Proposed measures
- Clinician concordance: agreement on eligibility and exclusions, with confidence intervals and subgroup analysis; ranking concordance is distinct from treatment benefit.
- Contraindication recall: measure known hard contraindications missed, with a strict error review for every false negative.
- Abstention quality: appropriateness of abstention, unsafe non-abstention, coverage-versus-risk and utility of missing-data requests.
- Evidence provenance: reference correctness, freshness, relevant context and consistency between rules and cited source.
- Review usability: comprehension of exclusions and uncertainty, time to inspection, override/rejection rationale and automation-bias assessment.
- Failure modes: invalid observations, stale rules, conflicting sources, uncommon combinations, unsupported contexts and outages.

## Uncertainty replacement
Train/calibrate a conformal or other justified estimator only when an appropriate representative dataset and endpoint exist. Report empirical coverage, subgroup behavior, shift sensitivity and abstention calibration on untouched held-out data. Do not rename the current heuristic as conformal prediction.

## Release gates
Predefine thresholds with clinical and safety leads; document failures and remediate them before a locked rerun. Arrange independent security, privacy and regulatory review appropriate to the intended use. Any future patient-care use is a distinct product release, not a relabelled synthetic prototype.
