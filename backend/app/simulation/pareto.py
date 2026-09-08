"""PRIVAVEDA Multi-Objective Evaluation & Pareto Dominance.

Architectural Rule:
"Do not collapse everything into a mysterious single score by default.
Represent dimensions separately: Target Attainment, Toxicity Risk, Interaction, Uncertainty, Evidence."
"""
from dataclasses import dataclass
from typing import Any


@dataclass
class ScenarioOutcome:
    scenario_id: str
    scenario_name: str
    # Five core objective dimensions:
    target_attainment: float  # [0, 1] Maximize (probability / fraction in therapeutic range)
    toxicity_risk: float      # [0, 1] Minimize (probability / margin of toxicity)
    interaction_risk: float   # [0, 1] Minimize (drug-drug / gene-drug score)
    uncertainty_score: float  # [0, 1] Minimize (Monte Carlo coefficient of variation / spread)
    evidence_quality: float   # [0, 1] Maximize (provenance literature rating)
    
    # Raw mechanistic simulation outputs
    c_max: float
    c_trough: float
    auc_0_t: float
    
    # Pareto status
    pareto_status: str = "ELIGIBLE"  # "PARETO_OPTIMAL", "DOMINATED", "EXCLUDED", "ABSTAINED"
    rank_reason: str = ""
    composite_demo_score: float | None = None


def pareto_objective_vector(outcome: ScenarioOutcome) -> tuple[float, float, float, float, float]:
    """Canonical objective tuple where ALL values are to be MINIMIZED.
    
    ( -target_attainment, toxicity_risk, interaction_risk, uncertainty_score, -evidence_quality )
    """
    return (
        -outcome.target_attainment,
        outcome.toxicity_risk,
        outcome.interaction_risk,
        outcome.uncertainty_score,
        -outcome.evidence_quality
    )


class MultiObjectiveComparator:
    """Computes Pareto dominance across multi-dimensional pharmacokinetic scenarios."""

    @staticmethod
    def rank_scenarios(
        outcomes: list[ScenarioOutcome],
        custom_weights: dict[str, float] | None = None
    ) -> list[ScenarioOutcome]:
        # Filter only eligible outcomes for Pareto dominance
        eligible = [o for o in outcomes if o.pareto_status in {"ELIGIBLE", "PARETO_OPTIMAL", "DOMINATED"}]

        for cand in eligible:
            a = pareto_objective_vector(cand)
            # cand is dominated if another scenario is at least as good in all objectives and strictly better in >= 1
            dominated = any(
                all(x <= y for x, y in zip(pareto_objective_vector(other), a)) and
                any(x < y for x, y in zip(pareto_objective_vector(other), a))
                for other in eligible if other is not cand
            )
            cand.pareto_status = "DOMINATED" if dominated else "PARETO_OPTIMAL"
            if dominated:
                cand.rank_reason = "Another scenario achieves equal or superior target attainment with lower risk or uncertainty."
            else:
                cand.rank_reason = "Pareto-optimal: No other candidate improves an objective without worsening another."

        # Optional transparent weighted composite score (for secondary display only)
        weights = custom_weights or {
            "target_attainment": 0.35,
            "toxicity_risk": 0.25,
            "interaction_risk": 0.15,
            "uncertainty_score": 0.15,
            "evidence_quality": 0.10
        }
        for o in outcomes:
            score = (
                weights["target_attainment"] * o.target_attainment
                + weights["toxicity_risk"] * (1.0 - o.toxicity_risk)
                + weights["interaction_risk"] * (1.0 - o.interaction_risk)
                + weights["uncertainty_score"] * (1.0 - o.uncertainty_score)
                + weights["evidence_quality"] * o.evidence_quality
            )
            o.composite_demo_score = round(score, 4)

        return outcomes
