"""PRIVAVEDA Sensitivity Analysis Engine.

Answers: "WHAT DRIVES THIS SIMULATION?"
Computes normalized One-At-A-Time (OAT) finite-difference sensitivity indices:
S(theta_i) = (dY / d_theta_i) * (theta_i / Y)
Showing percentage change in clinical exposure (AUC, C_max) per 1% change in parameter.
"""
from dataclasses import dataclass
from typing import Any
import copy
from app.twin.models.base import SimulationModel, Intervention
from app.twin.parameter_vector import PatientParameterVector
from app.twin.solver import ODESolverEngine


@dataclass
class ParameterSensitivity:
    parameter: str
    sensitivity_score: float  # Normalized elasticity (% change in output per % change in param)
    direction: str            # "POSITIVE", "NEGATIVE", "NEUTRAL"
    rank: int
    interpretation: str
    target_metric: str        # e.g. "auc_0_t", "c_max"


@dataclass
class SensitivityReport:
    model_name: str
    target_metric: str
    baseline_value: float
    rankings: list[ParameterSensitivity]
    method: str = "LOCAL_OAT_CENTRAL_DIFFERENCE"

    def to_dict(self) -> dict[str, Any]:
        return {
            "model_name": self.model_name,
            "target_metric": self.target_metric,
            "baseline_value": round(self.baseline_value, 4),
            "method": self.method,
            "rankings": [
                {
                    "rank": r.rank,
                    "parameter": r.parameter,
                    "sensitivity_score": round(r.sensitivity_score, 4),
                    "direction": r.direction,
                    "interpretation": r.interpretation
                }
                for r in self.rankings
            ]
        }


class SensitivityAnalyzer:
    """Computes parameter elasticity on simulated pharmacokinetics."""

    def __init__(self, solver: ODESolverEngine | None = None):
        self.solver = solver or ODESolverEngine()

    def analyze(
        self,
        model: SimulationModel,
        base_parameters: PatientParameterVector,
        intervention: Intervention,
        target_metric: str = "auc_0_t",
        perturbation_pct: float = 0.05
    ) -> SensitivityReport:
        # Run baseline
        sim_base = self.solver.simulate(model, base_parameters, intervention)
        if sim_base.solver_status != "SUCCESS":
            raise RuntimeError("Baseline simulation failed during sensitivity analysis")

        y0 = getattr(sim_base.metrics, target_metric, None)
        if y0 is None or y0 == 0.0:
            raise ValueError(f"Invalid target metric '{target_metric}' or zero baseline value")

        parameters_to_test = [
            ("cl_systemic_l_h", "Systemic clearance (metabolism + excretion)"),
            ("v_total_l", "Volume of distribution (tissue penetration)"),
            ("ka_per_h", "Absorption rate constant"),
            ("bioavailability_f", "Fractional oral bioavailability"),
            ("weight_kg", "Patient body weight"),
            ("cyp2d6_activity_score", "CYP2D6 enzyme metabolic capacity")
        ]

        scores = []
        delta = perturbation_pct

        for param_name, description in parameters_to_test:
            val0 = getattr(base_parameters, param_name, None)
            if val0 is None or val0 <= 0:
                continue

            # +delta simulation
            p_plus = copy.copy(base_parameters)
            setattr(p_plus, param_name, val0 * (1.0 + delta))
            if param_name == "cl_systemic_l_h":
                p_plus.cl_hepatic_l_h = val0 * (1.0 + delta) * 0.55
                p_plus.cl_renal_l_h = val0 * (1.0 + delta) * 0.45
            sim_plus = self.solver.simulate(model, p_plus, intervention)

            # -delta simulation
            p_minus = copy.copy(base_parameters)
            setattr(p_minus, param_name, val0 * (1.0 - delta))
            if param_name == "cl_systemic_l_h":
                p_minus.cl_hepatic_l_h = val0 * (1.0 - delta) * 0.55
                p_minus.cl_renal_l_h = val0 * (1.0 - delta) * 0.45
            sim_minus = self.solver.simulate(model, p_minus, intervention)

            if sim_plus.solver_status == "SUCCESS" and sim_minus.solver_status == "SUCCESS":
                y_plus = getattr(sim_plus.metrics, target_metric)
                y_minus = getattr(sim_minus.metrics, target_metric)
                
                # Central difference: S = ((y_plus - y_minus) / (2 * delta * val0)) * (val0 / y0)
                # = (y_plus - y_minus) / (2 * delta * y0)
                s_norm = (y_plus - y_minus) / (2.0 * delta * y0)
                scores.append((param_name, float(s_norm), description))

        # Sort by absolute sensitivity magnitude
        scores.sort(key=lambda item: abs(item[1]), reverse=True)

        rankings = []
        for rank, (p_name, s_val, desc) in enumerate(scores, start=1):
            direction = "POSITIVE" if s_val > 0.05 else "NEGATIVE" if s_val < -0.05 else "NEUTRAL"
            interp = (
                f"A 10% increase in {p_name} ({desc}) causes a "
                f"{abs(s_val)*10:.1f}% {'increase' if s_val > 0 else 'decrease'} in {target_metric}."
            )
            rankings.append(
                ParameterSensitivity(
                    parameter=p_name,
                    sensitivity_score=s_val,
                    direction=direction,
                    rank=rank,
                    interpretation=interp,
                    target_metric=target_metric
                )
            )

        return SensitivityReport(
            model_name=model.name,
            target_metric=target_metric,
            baseline_value=y0,
            rankings=rankings
        )
