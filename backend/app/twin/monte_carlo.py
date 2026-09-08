"""PRIVAVEDA Monte Carlo Uncertainty Engine.

Propagates patient physiological and pharmacokinetic parameter distributions:
- Controlled random seeds for 100% deterministic reproducibility.
- FAST_DEMO (N=50/100) and HIGH_FIDELITY (N=1000) modes.
- Aggregates percentiles (5th, 25th, 50th/median, 75th, 95th).
- Quantifies tail toxicity probability and sub-therapeutic exposure risk.
"""
from dataclasses import dataclass, field
from typing import Any
import numpy as np
from app.twin.models.base import SimulationModel, Intervention
from app.twin.parameter_vector import PatientParameterVector
from app.twin.solver import ODESolverEngine


@dataclass
class MonteCarloSummary:
    mode: str  # "FAST_DEMO" or "HIGH_FIDELITY"
    sample_count: int
    seed: int
    time: np.ndarray
    percentile_05: np.ndarray
    percentile_25: np.ndarray
    median: np.ndarray
    percentile_75: np.ndarray
    percentile_95: np.ndarray
    tail_toxicity_risk: float       # P(C_max >= C_toxic)
    subtherapeutic_risk: float       # P(C_trough < C_min)
    target_attainment_prob: float   # P(C_trough >= C_min and C_max <= C_target_max)
    solver_failure_rate: float
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "mode": self.mode,
            "sample_count": self.sample_count,
            "seed": self.seed,
            "time": self.time.tolist(),
            "percentile_05": [round(float(x), 4) for x in self.percentile_05],
            "percentile_25": [round(float(x), 4) for x in self.percentile_25],
            "median": [round(float(x), 4) for x in self.median],
            "percentile_75": [round(float(x), 4) for x in self.percentile_75],
            "percentile_95": [round(float(x), 4) for x in self.percentile_95],
            "tail_toxicity_risk": round(self.tail_toxicity_risk, 4),
            "subtherapeutic_risk": round(self.subtherapeutic_risk, 4),
            "target_attainment_prob": round(self.target_attainment_prob, 4),
            "solver_failure_rate": round(self.solver_failure_rate, 4),
            "warnings": self.warnings
        }


class MonteCarloEngine:
    """Runs population/patient parameter uncertainty propagation."""

    def __init__(self, solver: ODESolverEngine | None = None):
        self.solver = solver or ODESolverEngine(rtol=1e-5, atol=1e-8)

    def run(
        self,
        model: SimulationModel,
        base_parameters: PatientParameterVector,
        intervention: Intervention,
        sample_count: int = 100,
        seed: int = 42,
        mode: str = "FAST_DEMO",
        t_span: tuple[float, float] = (0.0, 24.0),
        time_points: int = 121,
        target_window: tuple[float, float, float] = (1.0, 10.0, 15.0)
    ) -> MonteCarloSummary:
        rng = np.random.default_rng(seed)
        t_eval = np.linspace(t_span[0], t_span[1], time_points)
        c_min_target, c_max_target, c_toxic = target_window

        # Sample parameters log-normally around patient's estimated values
        cl_samples = rng.lognormal(
            mean=np.log(base_parameters.cl_systemic_l_h),
            sigma=base_parameters.sigma_log_cl,
            size=sample_count
        )
        v_samples = rng.lognormal(
            mean=np.log(base_parameters.v_total_l),
            sigma=base_parameters.sigma_log_v,
            size=sample_count
        )
        ka_samples = rng.lognormal(
            mean=np.log(base_parameters.ka_per_h),
            sigma=base_parameters.sigma_log_ka,
            size=sample_count
        )

        trajectories = []
        c_max_list = []
        c_trough_list = []
        failed_count = 0

        for i in range(sample_count):
            v_tot = float(v_samples[i])
            cl_tot = float(cl_samples[i])
            ka = float(ka_samples[i])

            p_sample = PatientParameterVector(
                patient_token=base_parameters.patient_token,
                weight_kg=base_parameters.weight_kg,
                height_cm=base_parameters.height_cm,
                v_total_l=v_tot,
                v_central_l=v_tot * (base_parameters.v_central_l / base_parameters.v_total_l),
                v_peripheral_l=v_tot * (base_parameters.v_peripheral_l / base_parameters.v_total_l),
                cl_systemic_l_h=cl_tot,
                cl_renal_l_h=cl_tot * (base_parameters.cl_renal_l_h / base_parameters.cl_systemic_l_h),
                cl_hepatic_l_h=cl_tot * (base_parameters.cl_hepatic_l_h / base_parameters.cl_systemic_l_h),
                q_intercompartmental_l_h=base_parameters.q_intercompartmental_l_h,
                ka_per_h=ka,
                bioavailability_f=base_parameters.bioavailability_f
            )

            sim = self.solver.simulate(
                model=model,
                parameters=p_sample,
                intervention=intervention,
                t_span=t_span,
                t_eval=t_eval,
                target_window=target_window
            )

            if sim.solver_status == "SUCCESS":
                conc = sim.concentrations.get("plasma") if "plasma" in sim.concentrations else sim.concentrations.get("blood")
                trajectories.append(conc)
                c_max_list.append(sim.metrics.c_max)
                c_trough_list.append(sim.metrics.c_trough)
            else:
                failed_count += 1

        if not trajectories:
            raise RuntimeError("All Monte Carlo simulation runs failed due to numerical solver errors")

        traj_array = np.array(trajectories)  # shape: (n_successful, n_timepoints)

        p05 = np.percentile(traj_array, 5, axis=0)
        p25 = np.percentile(traj_array, 25, axis=0)
        p50 = np.percentile(traj_array, 50, axis=0)
        p75 = np.percentile(traj_array, 75, axis=0)
        p95 = np.percentile(traj_array, 95, axis=0)

        n_succ = len(c_max_list)
        toxic_count = sum(1 for c in c_max_list if c >= c_toxic)
        sub_count = sum(1 for c in c_trough_list if c < c_min_target)
        target_count = sum(1 for c_max, c_tr in zip(c_max_list, c_trough_list) if c_tr >= c_min_target and c_max <= c_max_target)

        toxic_prob = toxic_count / n_succ
        sub_prob = sub_count / n_succ
        target_prob = target_count / n_succ
        failure_rate = failed_count / sample_count

        warnings = []
        if failure_rate > 0.05:
            warnings.append(f"Solver failure rate elevated: {failure_rate*100:.1f}% of parameter samples failed numerical integration")
        if toxic_prob > 0.15:
            warnings.append(f"Elevated tail toxicity risk: {toxic_prob*100:.1f}% probability of exceeding toxic threshold ({c_toxic} mg/L)")

        return MonteCarloSummary(
            mode=mode,
            sample_count=sample_count,
            seed=seed,
            time=t_eval,
            percentile_05=p05,
            percentile_25=p25,
            median=p50,
            percentile_75=p75,
            percentile_95=p95,
            tail_toxicity_risk=toxic_prob,
            subtherapeutic_risk=sub_prob,
            target_attainment_prob=target_prob,
            solver_failure_rate=failure_rate,
            warnings=warnings
        )
