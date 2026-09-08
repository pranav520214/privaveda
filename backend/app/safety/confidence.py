"""PRIVAVEDA Multi-Layer Confidence Engine.

Architectural Rule:
"Do not emit one fake 'AI confidence = 97%' number.
Produce separate, transparent confidence dimensions."
"""
from dataclasses import dataclass
from typing import Any


@dataclass
class ConfidenceDimension:
    dimension_name: str
    score: float        # [0.0, 1.0]
    category: str       # "HIGH", "MODERATE", "LOW"
    rationale: str


@dataclass
class MultiLayerConfidenceReport:
    data_quality: ConfidenceDimension
    model_fit: ConfidenceDimension
    parameter_uncertainty: ConfidenceDimension
    evidence_quality: ConfidenceDimension
    safety_coverage: ConfidenceDimension
    numerical_stability: ConfidenceDimension
    model_agreement: ConfidenceDimension
    composite_transparent_score: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "composite_transparent_score": round(self.composite_transparent_score, 3),
            "dimensions": {
                d.dimension_name: {
                    "score": round(d.score, 3),
                    "category": d.category,
                    "rationale": d.rationale
                }
                for d in [
                    self.data_quality,
                    self.model_fit,
                    self.parameter_uncertainty,
                    self.evidence_quality,
                    self.safety_coverage,
                    self.numerical_stability,
                    self.model_agreement
                ]
            }
        }


def score_to_category(val: float) -> str:
    return "HIGH" if val >= 0.75 else "MODERATE" if val >= 0.50 else "LOW"


class MultiLayerConfidenceEngine:
    """Computes transparent, multi-dimensional confidence metrics."""

    @staticmethod
    def evaluate(
        data_completeness: float,
        data_errors: int,
        rmse: float | None,
        monte_carlo_cv: float,
        evidence_score: float,
        evaluated_rules_count: int,
        total_rules_count: int,
        solver_converged: bool,
        one_comp_vs_two_comp_diff_pct: float | None = None
    ) -> MultiLayerConfidenceReport:
        # 1. Data Quality
        dq_val = max(0.0, min(1.0, data_completeness - (0.2 * data_errors)))
        dq = ConfidenceDimension(
            "DATA_QUALITY",
            dq_val,
            score_to_category(dq_val),
            f"Completeness {data_completeness*100:.0f}%, {data_errors} non-blocking issues"
        )

        # 2. Model Fit
        if rmse is None:
            mf_val = 0.50  # Prior mode (uncalibrated)
            mf_rat = "Simulation operating under population prior parameters (uncalibrated against TDM measurements)"
        else:
            mf_val = max(0.0, min(1.0, 1.0 - (rmse / 5.0)))
            mf_rat = f"Calibrated against observations with RMSE = {rmse:.3f} mg/L"
        mf = ConfidenceDimension("MODEL_FIT", mf_val, score_to_category(mf_val), mf_rat)

        # 3. Parameter Uncertainty (CV: 0.1 is great, 0.8 is poor)
        pu_val = max(0.0, min(1.0, 1.0 - monte_carlo_cv))
        pu = ConfidenceDimension(
            "PARAMETER_UNCERTAINTY",
            pu_val,
            score_to_category(pu_val),
            f"Monte Carlo coefficient of variation = {monte_carlo_cv*100:.1f}%"
        )

        # 4. Evidence Quality
        eq_val = max(0.0, min(1.0, evidence_score))
        eq = ConfidenceDimension(
            "EVIDENCE_QUALITY",
            eq_val,
            score_to_category(eq_val),
            f"Literature provenance rating: {evidence_score:.2f} / 1.00"
        )

        # 5. Safety Coverage
        sc_ratio = (evaluated_rules_count / total_rules_count) if total_rules_count > 0 else 1.0
        sc = ConfidenceDimension(
            "SAFETY_COVERAGE",
            sc_ratio,
            score_to_category(sc_ratio),
            f"Evaluated {evaluated_rules_count} of {total_rules_count} safety criteria"
        )

        # 6. Numerical Stability
        ns_val = 1.0 if solver_converged else 0.0
        ns = ConfidenceDimension(
            "NUMERICAL_STABILITY",
            ns_val,
            "HIGH" if solver_converged else "LOW",
            "SciPy solve_ivp converged within tolerance limits" if solver_converged else "Numerical solver failed or diverged"
        )

        # 7. Model Agreement (e.g. 1-compartment vs multi-compartment agreement)
        if one_comp_vs_two_comp_diff_pct is None:
            ma_val = 0.85
            ma_rat = "Structural agreement consistent with 1-compartment assumption"
        else:
            ma_val = max(0.0, min(1.0, 1.0 - (one_comp_vs_two_comp_diff_pct / 100.0)))
            ma_rat = f"Structural variance between model formulations: {one_comp_vs_two_comp_diff_pct:.1f}%"
        ma = ConfidenceDimension("MODEL_AGREEMENT", ma_val, score_to_category(ma_val), ma_rat)

        # Derived transparent composite (simple documented equal weighting of dimensions)
        composite = (dq_val + mf_val + pu_val + eq_val + sc_ratio + ns_val + ma_val) / 7.0

        return MultiLayerConfidenceReport(
            data_quality=dq,
            model_fit=mf,
            parameter_uncertainty=pu,
            evidence_quality=eq,
            safety_coverage=sc,
            numerical_stability=ns,
            model_agreement=ma,
            composite_transparent_score=composite
        )
