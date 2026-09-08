"""PRIVAVEDA Interactive API Router for Digital Twin Simulation, Calibration & Verification.

Exposes research endpoints for:
- Synthetic patient archetypes
- Digital twin ODE simulation
- Monte Carlo uncertainty
- Bayesian TDM calibration
- Automated golden demonstration execution
- Hardware diagnostics & offline readiness
"""
from typing import Any, Optional
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.synthetic.generator import generate_synthetic_cohort
from app.twin.parameter_vector import PatientParameterVector
from app.twin.models.one_compartment import OneCompartmentPKModel
from app.twin.models.two_compartment import TwoCompartmentPKModel
from app.twin.models.pbpk import PhysiologicalPBPKModel
from app.twin.models.base import Intervention
from app.twin.solver import ODESolverEngine
from app.twin.monte_carlo import MonteCarloEngine
from app.twin.inference import ObservedPoint
from app.twin.calibration import BayesianCalibrationLoop
from app.safety.hard_safety import HardSafetyEngine
from app.core.hardware import detect_system_capabilities
from app.core.offline import check_offline_readiness
from app.demo import run_golden_demonstration

router = APIRouter(prefix="/api/v1/privaveda", tags=["PRIVAVEDA Precision Medicine Digital Twin"])


class SimulateRequest(BaseModel):
    profile_id: str = Field(default="SYN-NORM-01", description="Synthetic profile ID")
    model_type: str = Field(default="one_compartment", description="'one_compartment', 'two_compartment', or 'pbpk'")
    dose_mg: float = Field(default=100.0, gt=0, le=5000, description="Dose in mg")
    route: str = Field(default="oral", description="'oral' or 'iv'")
    interval_hours: float = Field(default=12.0, gt=0, le=72)
    duration_hours: float = Field(default=24.0, gt=0, le=168)
    run_monte_carlo: bool = Field(default=True)
    mc_samples: int = Field(default=50, ge=10, le=500)


class CalibrateRequest(BaseModel):
    profile_id: str = Field(default="SYN-NORM-01")
    observed_points: list[list[float]] = Field(
        default=[[2.0, 6.8], [8.0, 2.4], [12.0, 1.2]],
        description="List of [time_hours, concentration_mg_l] TDM measurements"
    )
    dose_mg: float = Field(default=100.0)
    route: str = Field(default="oral")


@router.get("/health")
def privaveda_health() -> dict[str, Any]:
    """Diagnostic check of local hardware capabilities and offline isolation."""
    hw = detect_system_capabilities().to_dict()
    offline = check_offline_readiness()
    return {
        "status": "healthy",
        "system": "PRIVAVEDA (Local-First Precision Medicine)",
        "hardware": hw,
        "offline_guard": offline,
    }


@router.get("/profiles")
def list_profiles() -> list[dict[str, Any]]:
    """List all 7 deterministic synthetic patient profiles."""
    cohort = generate_synthetic_cohort()
    return [
        {
            "case_id": p.get("case_id"),
            "label": p.get("label"),
            "synthetic": p.get("synthetic", True),
            "weight_kg": p.get("weight_kg"),
            "age_years": p.get("age_years"),
            "sex": p.get("sex"),
            "condition": p.get("condition"),
            "egfr": p.get("egfr"),
            "genomics": p.get("genomics"),
        }
        for p in cohort.values()
    ]


@router.get("/profiles/{profile_id}")
def get_profile(profile_id: str) -> dict[str, Any]:
    """Get full details and baseline parameter vector for a synthetic profile."""
    cohort = generate_synthetic_cohort()
    if profile_id not in cohort:
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")
    
    case = cohort[profile_id]
    theta = PatientParameterVector.from_case(f"PT-{profile_id}", case)
    safety_engine = HardSafetyEngine()
    is_blocked, results = safety_engine.evaluate(case)
    return {
        "case": case,
        "parameter_vector": theta.to_dict(),
        "baseline_safety": {
            "is_blocked": is_blocked,
            "reasons": [r.reason for r in results if r.action == "BLOCK"],
            "warnings": [r.reason for r in results if r.action == "WARN"],
        }
    }


@router.post("/simulate")
def simulate_twin(req: SimulateRequest) -> dict[str, Any]:
    """Run an ODE-based bio-mathematical digital twin simulation with optional Monte Carlo uncertainty."""
    cohort = generate_synthetic_cohort()
    if req.profile_id not in cohort:
        raise HTTPException(status_code=404, detail=f"Profile '{req.profile_id}' not found")

    case = cohort[req.profile_id]
    theta = PatientParameterVector.from_case(f"PT-{req.profile_id}", case)
    safety_engine = HardSafetyEngine()
    is_blocked, results = safety_engine.evaluate(case)

    # Instantiate selected mechanistic model
    if req.model_type == "two_compartment":
        model = TwoCompartmentPKModel()
    elif req.model_type == "pbpk":
        model = PhysiologicalPBPKModel()
    else:
        model = OneCompartmentPKModel()

    intervention = Intervention(dose_mg=req.dose_mg, route=req.route)
    solver = ODESolverEngine(method="RK45", rtol=1e-6, atol=1e-9)
    sim = solver.simulate(model, theta, intervention, t_span=(0.0, req.duration_hours))

    # Downsample time-series for API payload
    step = max(1, len(sim.time) // 50)
    plasma_conc = sim.concentrations.get("plasma", np.zeros_like(sim.time))
    time_series = [
        {"t_hours": round(float(t), 2), "concentration_mg_l": round(float(c), 4)}
        for t, c in zip(sim.time[::step], plasma_conc[::step])
    ]

    response_data: dict[str, Any] = {
        "profile_id": req.profile_id,
        "synthetic": case.get("synthetic", True),
        "model_type": req.model_type,
        "metrics": {
            "c_max_mg_l": round(float(sim.metrics.c_max), 4),
            "t_max_hours": round(float(sim.metrics.t_max), 2),
            "auc_0_24": round(float(sim.metrics.auc_0_t), 4),
            "c_trough_mg_l": round(float(sim.metrics.c_trough), 4),
            "half_life_hours": round(float(sim.metrics.t_half_estimated_h), 2) if sim.metrics.t_half_estimated_h else None,
        },
        "safety_evaluation": {
            "blocked": is_blocked,
            "reasons": [r.reason for r in results if r.action == "BLOCK"],
            "warnings": [r.reason for r in results if r.action == "WARN"],
        },
        "time_series_sample": time_series,
    }

    if req.run_monte_carlo:
        mc = MonteCarloEngine()
        mc_res = mc.run(model, theta, intervention, sample_count=req.mc_samples, seed=42)
        response_data["monte_carlo_uncertainty"] = {
            "samples": req.mc_samples,
            "median_c_max": round(float(np.max(mc_res.median)), 4),
            "percentile_5_c_max": round(float(np.max(mc_res.percentile_05)), 4),
            "percentile_95_c_max": round(float(np.max(mc_res.percentile_95)), 4),
            "tail_toxicity_risk": round(float(mc_res.tail_toxicity_risk), 4),
        }

    return response_data


@router.post("/calibrate")
def calibrate_twin(req: CalibrateRequest) -> dict[str, Any]:
    """Run closed-loop Bayesian MAP calibration against observed TDM points."""
    cohort = generate_synthetic_cohort()
    if req.profile_id not in cohort:
        raise HTTPException(status_code=404, detail=f"Profile '{req.profile_id}' not found")

    case = cohort[req.profile_id]
    theta = PatientParameterVector.from_case(f"PT-{req.profile_id}", case)
    model = OneCompartmentPKModel()
    intervention = Intervention(dose_mg=req.dose_mg, route=req.route)

    obs = [ObservedPoint(time_h=float(pt[0]), measured_conc_mg_l=float(pt[1]), std_err=0.15) for pt in req.observed_points]
    loop = BayesianCalibrationLoop()
    result = loop.execute_loop(model, theta, intervention, obs, t_span=(0.0, 24.0))

    return {
        "profile_id": req.profile_id,
        "synthetic": case.get("synthetic", True),
        "observations_count": len(req.observed_points),
        "prior_parameters": {
            "cl_systemic_l_h": round(float(result.v1_parameters.get("cl_systemic_l_h", 0.0)), 3),
            "v_total_l": round(float(result.v1_parameters.get("v_total_l", 0.0)), 3),
        },
        "calibrated_parameters": {
            "cl_systemic_l_h": round(float(result.v2_parameters.get("cl_systemic_l_h", 0.0)), 3),
            "v_total_l": round(float(result.v2_parameters.get("v_total_l", 0.0)), 3),
        },
        "error_metrics": {
            "prior_rmse_mg_l": round(float(result.v1_rmse), 4),
            "posterior_rmse_mg_l": round(float(result.v2_rmse), 4),
            "rmse_improvement_mg_l": round(float(result.rmse_delta), 4),
        },
        "simulation_metrics_v2": {
            "c_max_mg_l": round(float(result.v2_simulation.metrics.c_max), 4),
            "auc_0_24": round(float(result.v2_simulation.metrics.auc_0_t), 4),
        }
    }


@router.get("/golden-demo")
def run_demo_endpoint() -> dict[str, Any]:
    """Execute the full 21-step golden demonstration and return structured results."""
    import io
    import sys

    captured = io.StringIO()
    old_stdout = sys.stdout
    try:
        sys.stdout = captured
        result = run_golden_demonstration(verbose=True)
    finally:
        sys.stdout = old_stdout

    return {
        "status": "success",
        "steps_executed": len(result.get("steps", [])),
        "summary": result.get("summary", {}),
        "terminal_log": captured.getvalue(),
    }
