"""PRIVAVEDA Abstention Engine.

Core Safety Axiom:
"'WE DON'T KNOW' is a first-class output."
Evaluates 10 hard criteria. When uncertainty or data flaws preclude responsible simulation,
the system cleanly abstains with explicit mathematical and clinical rationales.
Never fabricates or extrapolates plausible-looking clinical numbers.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any
from app.data_quality.gate import DataQualityReport
from app.twin.solver import SimulationResult
from app.safety.hard_safety import RuleEvaluationResult, RuleAction


class DecisionStatus(str, Enum):
    REVIEWABLE = "REVIEWABLE"
    ABSTAIN = "ABSTAIN"
    FAILED_VALIDATION = "FAILED_VALIDATION"


@dataclass
class AbstentionEvaluation:
    status: DecisionStatus
    abstain_reasons: list[str] = field(default_factory=list)
    blocking_reasons: list[str] = field(default_factory=list)
    confidence_summary: dict[str, float] = field(default_factory=dict)
    can_proceed_to_human_review: bool = False


class AbstentionEngine:
    """Evaluates whether a simulation and scenario set is safe for clinician review or must abstain."""

    def __init__(
        self,
        max_acceptable_uncertainty: float = 0.70,
        min_evidence_quality: float = 0.65,
        max_acceptable_rmse: float = 2.5
    ):
        self.max_uncertainty = max_acceptable_uncertainty
        self.min_evidence = min_evidence_quality
        self.max_rmse = max_acceptable_rmse

    def evaluate(
        self,
        dq_report: DataQualityReport,
        simulation: SimulationResult | None,
        safety_evaluations: list[RuleEvaluationResult],
        evidence_quality: float = 1.0,
        model_fit_rmse: float | None = None,
        provenance_valid: bool = True,
        integrity_valid: bool = True,
        uncertainty_score: float = 0.20
    ) -> AbstentionEvaluation:
        reasons = []
        blocking = []

        # 1. Cryptographic integrity and signature failure
        if not integrity_valid:
            blocking.append("Cryptographic integrity verification failed; record altered or corrupted")
            return AbstentionEvaluation(
                status=DecisionStatus.FAILED_VALIDATION,
                blocking_reasons=blocking,
                abstain_reasons=["Data corruption or unauthorized modification detected"],
                can_proceed_to_human_review=False
            )

        # 2. Corrupted provenance
        if not provenance_valid:
            blocking.append("Provenance chain is incomplete or content hash mismatch")
            return AbstentionEvaluation(
                status=DecisionStatus.FAILED_VALIDATION,
                blocking_reasons=blocking,
                abstain_reasons=["Untrusted provenance"],
                can_proceed_to_human_review=False
            )

        # 3. Data Quality Gate blocking reasons
        if dq_report.is_blocked:
            blocking.extend(dq_report.blocking_reasons)
            return AbstentionEvaluation(
                status=DecisionStatus.FAILED_VALIDATION,
                blocking_reasons=blocking,
                abstain_reasons=dq_report.errors,
                can_proceed_to_human_review=False
            )

        # 4. Deterministic Hard Safety Rules: BLOCK
        for rule_res in safety_evaluations:
            if rule_res.action == RuleAction.BLOCK:
                blocking.append(f"Hard safety contraindication: {rule_res.description} ({rule_res.reason})")

        # 5. Deterministic Safety Rules: UNKNOWN
        for rule_res in safety_evaluations:
            if rule_res.action == RuleAction.UNKNOWN:
                reasons.append(f"Safety rule '{rule_res.rule_id}' could not be evaluated due to missing inputs")

        # 6. Numerical Solver Failure
        if simulation is None or simulation.solver_status != "SUCCESS":
            reasons.append("ODE numerical solver failed to integrate equations to convergence")

        # 7. Insufficient Evidence
        if evidence_quality < self.min_evidence:
            reasons.append(f"Supporting scientific evidence quality ({evidence_quality:.2f}) is below minimum threshold ({self.min_evidence:.2f})")

        # 8. Excessive Parameter Uncertainty
        if uncertainty_score > self.max_uncertainty:
            reasons.append(f"Monte Carlo parameter uncertainty ({uncertainty_score:.2f}) exceeds acceptable tolerance ({self.max_uncertainty:.2f})")

        # 9. Poor Model Fit (if calibrated against observations)
        if model_fit_rmse is not None and model_fit_rmse > self.max_rmse:
            reasons.append(f"Mechanistic model fit RMSE ({model_fit_rmse:.2f}) exceeds acceptable calibration limit ({self.max_rmse:.2f})")

        # 10. Out of distribution / severe warnings
        if dq_report.missing_required_fields:
            reasons.append(f"Missing clinical variables: {', '.join(dq_report.missing_required_fields)}")

        # Decision synthesis
        if blocking:
            status = DecisionStatus.FAILED_VALIDATION
            can_review = False
        elif reasons:
            status = DecisionStatus.ABSTAIN
            can_review = False
        else:
            status = DecisionStatus.REVIEWABLE
            can_review = True

        return AbstentionEvaluation(
            status=status,
            abstain_reasons=reasons,
            blocking_reasons=blocking,
            confidence_summary={
                "evidence_quality": round(evidence_quality, 3),
                "uncertainty_score": round(uncertainty_score, 3),
                "data_completeness": dq_report.completeness
            },
            can_proceed_to_human_review=can_review
        )
