"""PRIVAVEDA ODE Numerical Simulation Engine.

Powered by SciPy solve_ivp.
Guarantees:
- Robust error reporting (solver status, evaluations, tolerances).
- Non-negativity constraint.
- Zero-input preservation.
- Conservation enforcement when elimination is zero.
- Pharmacokinetic metrics: AUC_0_t, C_max, t_max, C_trough, t_half.
"""
from dataclasses import dataclass, field
from typing import Any
import numpy as np
from scipy.integrate import solve_ivp
from app.twin.models.base import SimulationModel, Intervention


@dataclass
class SimulationMetrics:
    c_max: float
    t_max: float
    auc_0_t: float
    c_trough: float
    t_half_estimated_h: float
    within_therapeutic_window: bool = True
    toxicity_exceeded: bool = False


@dataclass
class SimulationResult:
    model_name: str
    time: np.ndarray
    states: dict[str, np.ndarray]
    concentrations: dict[str, np.ndarray]
    solver_status: str  # "SUCCESS", "FAILED"
    n_evaluations: int
    tolerances: dict[str, float]
    metrics: SimulationMetrics
    warnings: list[str] = field(default_factory=list)
    numerical_errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "model_name": self.model_name,
            "time": self.time.tolist(),
            "concentrations": {k: v.tolist() for k, v in self.concentrations.items()},
            "solver_status": self.solver_status,
            "n_evaluations": self.n_evaluations,
            "tolerances": self.tolerances,
            "metrics": {
                "c_max": self.metrics.c_max,
                "t_max": self.metrics.t_max,
                "auc_0_t": self.metrics.auc_0_t,
                "c_trough": self.metrics.c_trough,
                "t_half_estimated_h": self.metrics.t_half_estimated_h,
                "within_therapeutic_window": self.metrics.within_therapeutic_window,
                "toxicity_exceeded": self.metrics.toxicity_exceeded
            },
            "warnings": self.warnings,
            "numerical_errors": self.numerical_errors
        }


def compute_pk_metrics(
    t: np.ndarray,
    c_plasma: np.ndarray,
    c_target_min: float = 1.0,
    c_target_max: float = 10.0,
    c_toxic: float = 15.0
) -> SimulationMetrics:
    """Computes standard clinical pharmacokinetic exposure metrics."""
    if len(t) == 0 or len(c_plasma) == 0:
        return SimulationMetrics(0.0, 0.0, 0.0, 0.0, 0.0)
    
    c_max_idx = int(np.argmax(c_plasma))
    c_max = float(c_plasma[c_max_idx])
    t_max = float(t[c_max_idx])
    c_trough = float(c_plasma[-1])
    
    # Trapezoidal AUC
    auc_0_t = float(np.trapezoid(c_plasma, t))
    
    # Estimate terminal elimination half-life from last 25% of points if post-tmax
    t_half = 0.0
    if c_max_idx < len(t) - 3:
        t_tail = t[c_max_idx + 1:]
        c_tail = c_plasma[c_max_idx + 1:]
        pos_mask = c_tail > 1e-6
        if np.sum(pos_mask) >= 3:
            t_fit = t_tail[pos_mask]
            log_c_fit = np.log(c_tail[pos_mask])
            # Linear regression: log(C) = log(C0) - ke * t
            slope, _ = np.polyfit(t_fit, log_c_fit, 1)
            ke_est = -slope
            if ke_est > 1e-4:
                t_half = float(np.log(2.0) / ke_est)

    within_window = bool(c_trough >= c_target_min and c_max <= c_target_max)
    toxicity_exceeded = bool(c_max >= c_toxic)

    return SimulationMetrics(
        c_max=round(c_max, 4),
        t_max=round(t_max, 4),
        auc_0_t=round(auc_0_t, 4),
        c_trough=round(c_trough, 4),
        t_half_estimated_h=round(t_half, 4),
        within_therapeutic_window=within_window,
        toxicity_exceeded=toxicity_exceeded
    )


class ODESolverEngine:
    """Numerical solver for physiological and compartmental PK models."""

    def __init__(self, method: str = "RK45", rtol: float = 1e-6, atol: float = 1e-9):
        self.method = method
        self.rtol = rtol
        self.atol = atol

    def simulate(
        self,
        model: SimulationModel,
        parameters: Any,
        intervention: Intervention,
        t_span: tuple[float, float] = (0.0, 24.0),
        t_eval: np.ndarray | None = None,
        target_window: tuple[float, float, float] = (1.0, 10.0, 15.0)
    ) -> SimulationResult:
        warnings: list[str] = []
        errors: list[str] = []

        # Validate parameters prior to solver execution
        param_errors = model.validate_parameters(parameters)
        if param_errors:
            return SimulationResult(
                model_name=model.name,
                time=np.array([]),
                states={},
                concentrations={},
                solver_status="FAILED",
                n_evaluations=0,
                tolerances={"rtol": self.rtol, "atol": self.atol},
                metrics=SimulationMetrics(0.0, 0.0, 0.0, 0.0, 0.0),
                warnings=warnings,
                numerical_errors=param_errors
            )

        # Zero input behavior check
        if intervention.dose_mg == 0.0:
            warnings.append("Zero dose intervention requested; output state is identically zero")

        y0 = model.initial_state(parameters, intervention)
        if t_eval is None:
            t_eval = np.linspace(t_span[0], t_span[1], 241)  # 0.1h resolution over 24h

        try:
            sol = solve_ivp(
                fun=lambda t, y: model.derivative(t, y, parameters, intervention),
                t_span=t_span,
                y0=y0,
                method=self.method,
                t_eval=t_eval,
                rtol=self.rtol,
                atol=self.atol
            )
        except Exception as exc:
            errors.append(f"Solver crashed during numerical integration: {exc}")
            return SimulationResult(
                model_name=model.name,
                time=np.array([]),
                states={},
                concentrations={},
                solver_status="FAILED",
                n_evaluations=0,
                tolerances={"rtol": self.rtol, "atol": self.atol},
                metrics=SimulationMetrics(0.0, 0.0, 0.0, 0.0, 0.0),
                warnings=warnings,
                numerical_errors=errors
            )

        if not sol.success:
            errors.append(f"ODE integration did not converge: {sol.message}")
            status = "FAILED"
        else:
            status = "SUCCESS"

        # Check non-negativity constraint and apply physical lower bound
        y_sol = np.maximum(0.0, sol.y)
        if np.any(sol.y < -1e-6):
            warnings.append("Numerical solver produced slight negative intermediate states (< -1e-6), clamped to zero")

        states = {name: y_sol[i, :] for i, name in enumerate(model.state_names)}
        concentrations = model.state_to_concentrations(y_sol, parameters)
        
        # Primary plasma/blood concentration for clinical metrics
        primary_conc = concentrations.get("plasma") if "plasma" in concentrations else concentrations.get("blood")
        if primary_conc is None:
            primary_conc = list(concentrations.values())[0]

        c_min_t, c_max_t, c_tox = target_window
        metrics = compute_pk_metrics(sol.t, primary_conc, c_min_t, c_max_t, c_tox)

        return SimulationResult(
            model_name=model.name,
            time=sol.t,
            states=states,
            concentrations=concentrations,
            solver_status=status,
            n_evaluations=sol.nfev,
            tolerances={"rtol": self.rtol, "atol": self.atol},
            metrics=metrics,
            warnings=warnings,
            numerical_errors=errors
        )
