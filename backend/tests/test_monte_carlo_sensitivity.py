"""Tests for Monte Carlo Uncertainty Propagation and Sensitivity Analysis in PRIVAVEDA."""
import pytest
import numpy as np
from app.twin.models.base import Intervention
from app.twin.models.one_compartment import OneCompartmentPKModel
from app.twin.parameter_vector import PatientParameterVector
from app.twin.monte_carlo import MonteCarloEngine
from app.twin.sensitivity import SensitivityAnalyzer


def test_monte_carlo_deterministic_reproducibility():
    """Identical seeds must produce bitwise identical percentile trajectories."""
    model = OneCompartmentPKModel()
    params = PatientParameterVector(patient_token="PT-MC-1")
    intervention = Intervention(dose_mg=100.0, route="oral")

    engine = MonteCarloEngine()
    run1 = engine.run(model, params, intervention, sample_count=50, seed=1234)
    run2 = engine.run(model, params, intervention, sample_count=50, seed=1234)

    assert np.array_equal(run1.median, run2.median)
    assert np.array_equal(run1.percentile_05, run2.percentile_05)
    assert np.array_equal(run1.percentile_95, run2.percentile_95)
    assert run1.tail_toxicity_risk == run2.tail_toxicity_risk


def test_monte_carlo_percentile_monotonicity():
    """For any timepoint t, p05 <= p25 <= p50 <= p75 <= p95."""
    model = OneCompartmentPKModel()
    params = PatientParameterVector(patient_token="PT-MC-2")
    intervention = Intervention(dose_mg=100.0, route="oral")

    engine = MonteCarloEngine()
    summary = engine.run(model, params, intervention, sample_count=80, seed=99)

    assert np.all(summary.percentile_05 <= summary.percentile_25 + 1e-9)
    assert np.all(summary.percentile_25 <= summary.median + 1e-9)
    assert np.all(summary.median <= summary.percentile_75 + 1e-9)
    assert np.all(summary.percentile_75 <= summary.percentile_95 + 1e-9)


def test_sensitivity_analyzer_clearance_elasticity():
    """For a 1-compartment model, theoretical sensitivity of AUC to Clearance is -1.0 (inverse proportionality)."""
    model = OneCompartmentPKModel()
    params = PatientParameterVector(patient_token="PT-SENS", cl_systemic_l_h=4.0, v_total_l=20.0)
    intervention = Intervention(dose_mg=100.0, route="iv_bolus")

    analyzer = SensitivityAnalyzer()
    report = analyzer.analyze(model, params, intervention, target_metric="auc_0_t", perturbation_pct=0.02)

    # Locate clearance ranking
    cl_rank = next((r for r in report.rankings if r.parameter == "cl_systemic_l_h"), None)
    assert cl_rank is not None
    assert cl_rank.direction == "NEGATIVE"
    # Elasticity d(log AUC)/d(log CL) should be approximately -1.0
    assert pytest.approx(cl_rank.sensitivity_score, abs=0.1) == -1.0
