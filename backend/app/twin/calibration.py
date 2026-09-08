"""PRIVAVEDA Bayesian Closed-Loop Twin Calibration.

Predict-Learn-Update Workflow:
1. INITIAL TWIN (V1): Mechanistic simulation under prior parameters.
2. SYNTHETIC / CLINICAL OBSERVATION: New lab measurement received (e.g. therapeutic drug monitoring point).
3. COMPARE & RESIDUAL: Calculate difference between V1 prediction and observation.
4. UPDATE POSTERIOR: MAP / Bayesian update inferring updated theta_patient.
5. RE-SIMULATE (V2): Mechanistic simulation under updated parameters.
6. TRANSPARENT COMPARISON: Expose error_before vs error_after (never artificially forcing improvement).
"""
from dataclasses import dataclass
from typing import Any
import numpy as np
from app.twin.models.base import SimulationModel, Intervention
from app.twin.parameter_vector import PatientParameterVector
from app.twin.inference import ParameterEstimator, ObservedPoint, EstimationReport
from app.twin.solver import ODESolverEngine, SimulationResult


@dataclass
class CalibrationLoopResult:
    patient_token: str
    model_name: str
    observations: list[dict[str, float]]
    
    # Pre-calibration (V1)
    v1_parameters: dict[str, Any]
    v1_predictions: list[float]
    v1_rmse: float
    v1_mae: float
    v1_simulation: SimulationResult
    
    # Post-calibration (V2)
    v2_parameters: dict[str, Any]
    v2_predictions: list[float]
    v2_rmse: float
    v2_mae: float
    v2_simulation: SimulationResult
    
    # Update evaluation
    estimation_report: EstimationReport
    error_improved: bool
    rmse_delta: float  # v1_rmse - v2_rmse (positive means error reduced)
    uncertainty_reduced: bool


class BayesianCalibrationLoop:
    """Orchestrates closed-loop recalibration of digital twins."""

    def __init__(self, solver: ODESolverEngine | None = None):
        self.solver = solver or ODESolverEngine()
        self.estimator = ParameterEstimator(self.solver)

    def execute_loop(
        self,
        model: SimulationModel,
        prior_parameters: PatientParameterVector,
        intervention: Intervention,
        observations: list[ObservedPoint],
        t_span: tuple[float, float] = (0.0, 24.0)
    ) -> CalibrationLoopResult:
        if not observations:
            raise ValueError("Calibration requires at least one clinical or synthetic observation")

        t_obs = np.array([pt.time_h for pt in observations])
        y_obs = np.array([pt.measured_conc_mg_l for pt in observations])

        # Step 1: Run Twin V1 with Prior Parameters
        sim_v1 = self.solver.simulate(
            model=model,
            parameters=prior_parameters,
            intervention=intervention,
            t_span=t_span
        )

        # Interpolate V1 predictions at exact observation timepoints
        v1_preds = np.interp(t_obs, sim_v1.time, sim_v1.concentrations["plasma"])
        v1_rmse = float(np.sqrt(np.mean((y_obs - v1_preds) ** 2)))
        v1_mae = float(np.mean(np.abs(y_obs - v1_preds)))

        # Step 2: Infer Posterior Parameters (Bayesian MAP)
        calibrated_params, est_report = self.estimator.estimate(
            model=model,
            prior_parameters=prior_parameters,
            intervention=intervention,
            observations=observations
        )

        # Step 3: Re-simulate Twin V2 with Calibrated Parameters
        sim_v2 = self.solver.simulate(
            model=model,
            parameters=calibrated_params,
            intervention=intervention,
            t_span=t_span
        )

        v2_preds = np.interp(t_obs, sim_v2.time, sim_v2.concentrations["plasma"])
        v2_rmse = float(np.sqrt(np.mean((y_obs - v2_preds) ** 2)))
        v2_mae = float(np.mean(np.abs(y_obs - v2_preds)))

        rmse_delta = round(v1_rmse - v2_rmse, 4)
        error_improved = bool(v2_rmse < v1_rmse)
        uncertainty_reduced = bool(calibrated_params.sigma_log_cl <= prior_parameters.sigma_log_cl)

        return CalibrationLoopResult(
            patient_token=prior_parameters.patient_token,
            model_name=model.name,
            observations=[{"time_h": pt.time_h, "measured_conc_mg_l": pt.measured_conc_mg_l} for pt in observations],
            v1_parameters=prior_parameters.to_dict(),
            v1_predictions=[round(float(p), 4) for p in v1_preds],
            v1_rmse=round(v1_rmse, 4),
            v1_mae=round(v1_mae, 4),
            v1_simulation=sim_v1,
            v2_parameters=calibrated_params.to_dict(),
            v2_predictions=[round(float(p), 4) for p in v2_preds],
            v2_rmse=round(v2_rmse, 4),
            v2_mae=round(v2_mae, 4),
            v2_simulation=sim_v2,
            estimation_report=est_report,
            error_improved=error_improved,
            rmse_delta=rmse_delta,
            uncertainty_reduced=uncertainty_reduced
        )
