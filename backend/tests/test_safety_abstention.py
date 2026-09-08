"""Tests for Hard Safety, Abstention, Multi-Objective Pareto, and Confidence Engines in PRIVAVEDA."""
import pytest
from app.data_quality.gate import DataQualityReport
from app.twin.solver import SimulationResult, SimulationMetrics
from app.safety.hard_safety import HardSafetyEngine, RuleAction, ValidationStatus, SafetyRule
from app.safety.abstention import AbstentionEngine, DecisionStatus
from app.safety.confidence import MultiLayerConfidenceEngine
from app.simulation.pareto import ScenarioOutcome, MultiObjectiveComparator
import numpy as np


def test_hard_safety_renal_contraindication():
    engine = HardSafetyEngine()
    # eGFR = 10 mL/min (End Stage Renal Disease)
    case_esrd = {"egfr": 10.0, "genomics": {"cyp2d6_score": 2.0}, "allergies": []}
    blocked, results = engine.evaluate(case_esrd)
    assert blocked is True
    renal_res = next(r for r in results if r.rule_id == "RULE-RENAL-01")
    assert renal_res.action == RuleAction.BLOCK


def test_hard_safety_unknown_on_missing_data():
    engine = HardSafetyEngine()
    # Missing eGFR entirely
    case_missing = {"genomics": {"cyp2d6_score": 2.0}, "allergies": []}
    blocked, results = engine.evaluate(case_missing)
    renal_res = next(r for r in results if r.rule_id == "RULE-RENAL-01")
    # Rule must evaluate to UNKNOWN, never silently PASS!
    assert renal_res.action == RuleAction.UNKNOWN


def test_unverified_rule_cannot_block():
    # Rule with status RESEARCH_ONLY attempting BLOCK must be downgraded to WARN
    unverified_rule = SafetyRule(
        rule_id="RULE-UNVERIFIED-DEMO",
        version="0.1",
        description="Hypothetical research flag",
        inputs_required=["condition"],
        source="Unreviewed Blog Post 2026",
        validation_status=ValidationStatus.RESEARCH_ONLY,
        predicate=lambda case: (RuleAction.BLOCK, "Hypothetical issue")
    )
    engine = HardSafetyEngine([unverified_rule])
    blocked, results = engine.evaluate({"condition": "Hypertension"})
    assert blocked is False
    assert results[0].action == RuleAction.WARN
    assert "UNVERIFIED RULE DOWNGRADED TO WARN" in results[0].reason


def test_abstention_engine_evaluations():
    abstention = AbstentionEngine(max_acceptable_uncertainty=0.70)
    dq_clean = DataQualityReport(overall_status="PASS", completeness=1.0)
    dummy_sim = SimulationResult(
        model_name="TestModel",
        time=np.array([0, 1]),
        states={},
        concentrations={"plasma": np.array([1.0, 0.5])},
        solver_status="SUCCESS",
        n_evaluations=10,
        tolerances={},
        metrics=SimulationMetrics(1.0, 0.0, 1.0, 0.5, 5.0)
    )

    # 1. Normal run -> REVIEWABLE
    eval_ok = abstention.evaluate(dq_clean, dummy_sim, [], uncertainty_score=0.25)
    assert eval_ok.status == DecisionStatus.REVIEWABLE
    assert eval_ok.can_proceed_to_human_review is True

    # 2. High uncertainty -> ABSTAIN
    eval_uncert = abstention.evaluate(dq_clean, dummy_sim, [], uncertainty_score=0.85)
    assert eval_uncert.status == DecisionStatus.ABSTAIN
    assert eval_uncert.can_proceed_to_human_review is False
    assert any("uncertainty" in r.lower() for r in eval_uncert.abstain_reasons)

    # 3. Integrity corrupted -> FAILED_VALIDATION
    eval_corrupt = abstention.evaluate(dq_clean, dummy_sim, [], integrity_valid=False)
    assert eval_corrupt.status == DecisionStatus.FAILED_VALIDATION
    assert eval_corrupt.can_proceed_to_human_review is False


def test_pareto_dominance_ranking():
    # Outcome 1: Dominates Outcome 2 (higher target attainment, lower toxicity, lower uncertainty)
    o1 = ScenarioOutcome(
        scenario_id="S1",
        scenario_name="Optimal",
        target_attainment=0.90,
        toxicity_risk=0.05,
        interaction_risk=0.10,
        uncertainty_score=0.15,
        evidence_quality=0.95,
        c_max=4.0, c_trough=1.5, auc_0_t=25.0
    )
    o2 = ScenarioOutcome(
        scenario_id="S2",
        scenario_name="Inferior",
        target_attainment=0.60,
        toxicity_risk=0.25,
        interaction_risk=0.20,
        uncertainty_score=0.45,
        evidence_quality=0.75,
        c_max=7.5, c_trough=0.8, auc_0_t=20.0
    )
    
    ranked = MultiObjectiveComparator.rank_scenarios([o1, o2])
    assert ranked[0].pareto_status == "PARETO_OPTIMAL"
    assert ranked[1].pareto_status == "DOMINATED"


def test_multilayer_confidence_report():
    conf_report = MultiLayerConfidenceEngine.evaluate(
        data_completeness=0.95,
        data_errors=0,
        rmse=0.25,
        monte_carlo_cv=0.18,
        evidence_score=0.90,
        evaluated_rules_count=5,
        total_rules_count=5,
        solver_converged=True
    )
    assert conf_report.composite_transparent_score > 0.80
    assert conf_report.data_quality.category == "HIGH"
    assert conf_report.numerical_stability.score == 1.0
    report_dict = conf_report.to_dict()
    assert "dimensions" in report_dict
    assert len(report_dict["dimensions"]) == 7
