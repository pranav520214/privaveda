"""PRIVAVEDA Parameter Estimation Engine.

Infers patient-specific pharmacokinetic parameters from clinical observations:
- Separates population prior distributions from individual patient observations.
- Optimization-based Maximum A Posteriori (MAP) / Non-Linear Least Squares.
- Parameter space mapped to log scale to guarantee strictly positive physical quantities.
- Computes Fisher Information Matrix (FIM) and parameter identifiability condition numbers.
- Reports parameter point estimates with 95% confidence intervals and fit metrics (RMSE, MAE).
- Architectural rule: Never reports estimated parameters as directly measured!
"""
from dataclasses import dataclass, field
from typing import Any
import numpy as np
from scipy.optimize import minimize
from app.twin.models.base import SimulationModel, Intervention
from app.twin.parameter_vector import PatientParameterVector
from app.twin.solver import ODESolverEngine


@dataclass
class ObservedPoint:
    time_h: float
    measured_conc_mg_l: float
    std_err: float = 0.2  # Measurement error standard deviation


@dataclass
class ParameterEstimate:
    parameter_name: str
    prior_mean: float
    prior_std: float
    estimated_value: float
    ci_95_low: float
    ci_95_high: float
    identifiability: str  # "IDENTIFIABLE", "WEAKLY_IDENTIFIABLE", "UNIDENTIFIABLE"
    is_estimated: bool = True  # Always explicitly True; never claimed as directly measured


@dataclass
class EstimationReport:
    estimates: dict[str, ParameterEstimate]
    fit_rmse: float
    fit_mae: float
    r_squared: float
    convergence_status: str
    condition_number_fim: float
    warnings: list[str] = field(default_factory=list)
    observations_used: int = 0


class ParameterEstimator:
    """Estimates individual patient CL and V given sparse concentration measurements."""

    def __init__(self, solver: ODESolverEngine | None = None):
        self.solver = solver or ODESolverEngine(rtol=1e-5, atol=1e-8)

    def estimate(
        self,
        model: SimulationModel,
        prior_parameters: PatientParameterVector,
        intervention: Intervention,
        observations: list[ObservedPoint]
    ) -> tuple[PatientParameterVector, EstimationReport]:
        warnings = []
        if len(observations) == 0:
            raise ValueError("Parameter estimation requires at least one clinical observation")

        t_obs = np.array([pt.time_h for pt in observations])
        y_obs = np.array([pt.measured_conc_mg_l for pt in observations])
        sigma_obs = np.array([pt.std_err for pt in observations])

        # We estimate log(CL) and log(V)
        prior_cl = prior_parameters.cl_systemic_l_h
        prior_v = prior_parameters.v_total_l
        sigma_prior_cl = prior_parameters.sigma_log_cl
        sigma_prior_v = prior_parameters.sigma_log_v

        x0 = np.array([np.log(prior_cl), np.log(prior_v)])

        # Objective: Negative Log Posterior (Bayesian MAP)
        def objective(x):
            cl_cand = np.exp(x[0])
            v_cand = np.exp(x[1])
            
            # Temporary parameters copy
            cand_params = PatientParameterVector(
                patient_token=prior_parameters.patient_token,
                weight_kg=prior_parameters.weight_kg,
                v_total_l=v_cand,
                v_central_l=v_cand * (prior_parameters.v_central_l / prior_parameters.v_total_l),
                v_peripheral_l=v_cand * (prior_parameters.v_peripheral_l / prior_parameters.v_total_l),
                cl_systemic_l_h=cl_cand,
                ka_per_h=prior_parameters.ka_per_h,
                bioavailability_f=prior_parameters.bioavailability_f
            )
            
            sim = self.solver.simulate(
                model=model,
                parameters=cand_params,
                intervention=intervention,
                t_span=(0.0, float(np.max(t_obs)) + 2.0),
                t_eval=t_obs
            )
            if sim.solver_status != "SUCCESS":
                return 1e9

            pred_conc = sim.concentrations["plasma"]
            # Weighted least squares residual
            nll_data = 0.5 * np.sum(((y_obs - pred_conc) / sigma_obs) ** 2)
            
            # Gaussian prior on log scale: 0.5 * ((log_theta - log_prior) / sigma)^2
            nll_prior_cl = 0.5 * ((x[0] - np.log(prior_cl)) / sigma_prior_cl) ** 2
            nll_prior_v = 0.5 * ((x[1] - np.log(prior_v)) / sigma_prior_v) ** 2

            return nll_data + nll_prior_cl + nll_prior_v

        res = minimize(objective, x0, method="L-BFGS-B", bounds=[(np.log(0.1), np.log(50.0)), (np.log(2.0), np.log(200.0))])
        
        est_cl = float(np.exp(res.x[0]))
        est_v = float(np.exp(res.x[1]))

        # Calculate Fisher Information Matrix (Hessian approximation via finite differences)
        eps = 1e-4
        hess = np.zeros((2, 2))
        f0 = objective(res.x)
        for i in range(2):
            for j in range(2):
                x_ij = res.x.copy()
                x_ij[i] += eps
                x_ij[j] += eps
                f_ij = objective(x_ij)
                
                x_i = res.x.copy()
                x_i[i] += eps
                f_i = objective(x_i)
                
                x_j = res.x.copy()
                x_j[j] += eps
                f_j = objective(x_j)
                
                hess[i, j] = (f_ij - f_i - f_j + f0) / (eps * eps)

        try:
            cov = np.linalg.pinv(hess)
            se_log_cl = float(np.sqrt(max(1e-4, cov[0, 0])))
            se_log_v = float(np.sqrt(max(1e-4, cov[1, 1])))
            cond_num = float(np.linalg.cond(hess))
        except Exception:
            se_log_cl, se_log_v, cond_num = sigma_prior_cl, sigma_prior_v, 1e6
            warnings.append("Hessian inversion failed; using prior variance fallback")

        identifiability = "IDENTIFIABLE" if cond_num < 1000 else "WEAKLY_IDENTIFIABLE" if cond_num < 10000 else "UNIDENTIFIABLE"
        if identifiability != "IDENTIFIABLE":
            warnings.append(f"High parameter collinearity or sparse observations (FIM Condition Number: {cond_num:.1f})")

        # 95% Confidence Intervals on original scale
        ci_cl = (float(np.exp(res.x[0] - 1.96 * se_log_cl)), float(np.exp(res.x[0] + 1.96 * se_log_cl)))
        ci_v = (float(np.exp(res.x[1] - 1.96 * se_log_v)), float(np.exp(res.x[1] + 1.96 * se_log_v)))

        # Evaluate final predictions at observation points
        calibrated_params = PatientParameterVector(
            patient_token=prior_parameters.patient_token,
            weight_kg=prior_parameters.weight_kg,
            height_cm=prior_parameters.height_cm,
            age_years=prior_parameters.age_years,
            sex=prior_parameters.sex,
            v_total_l=round(est_v, 3),
            v_central_l=round(est_v * (prior_parameters.v_central_l / prior_parameters.v_total_l), 3),
            v_peripheral_l=round(est_v * (prior_parameters.v_peripheral_l / prior_parameters.v_total_l), 3),
            cl_systemic_l_h=round(est_cl, 3),
            cl_renal_l_h=round(est_cl * 0.45, 3),
            cl_hepatic_l_h=round(est_cl * 0.55, 3),
            q_intercompartmental_l_h=prior_parameters.q_intercompartmental_l_h,
            ka_per_h=prior_parameters.ka_per_h,
            bioavailability_f=prior_parameters.bioavailability_f,
            sigma_log_cl=round(se_log_cl, 4),
            sigma_log_v=round(se_log_v, 4),
            is_synthetic=prior_parameters.is_synthetic,
            provenance_source="BAYESIAN_MAP_INFERENCE_LOOP",
            parameter_version=f"{prior_parameters.parameter_version}+calibrated"
        )

        final_sim = self.solver.simulate(
            model=model,
            parameters=calibrated_params,
            intervention=intervention,
            t_span=(0.0, float(np.max(t_obs)) + 2.0),
            t_eval=t_obs
        )
        final_preds = final_sim.concentrations["plasma"]

        rmse = float(np.sqrt(np.mean((y_obs - final_preds) ** 2)))
        mae = float(np.mean(np.abs(y_obs - final_preds)))
        ss_tot = float(np.sum((y_obs - np.mean(y_obs)) ** 2))
        ss_res = float(np.sum((y_obs - final_preds) ** 2))
        r2 = float(1.0 - (ss_res / ss_tot)) if ss_tot > 1e-6 else 1.0

        estimates = {
            "cl_systemic_l_h": ParameterEstimate(
                parameter_name="cl_systemic_l_h",
                prior_mean=prior_cl,
                prior_std=prior_cl * sigma_prior_cl,
                estimated_value=round(est_cl, 3),
                ci_95_low=round(ci_cl[0], 3),
                ci_95_high=round(ci_cl[1], 3),
                identifiability=identifiability
            ),
            "v_total_l": ParameterEstimate(
                parameter_name="v_total_l",
                prior_mean=prior_v,
                prior_std=prior_v * sigma_prior_v,
                estimated_value=round(est_v, 3),
                ci_95_low=round(ci_v[0], 3),
                ci_95_high=round(ci_v[1], 3),
                identifiability=identifiability
            )
        }

        report = EstimationReport(
            estimates=estimates,
            fit_rmse=round(rmse, 4),
            fit_mae=round(mae, 4),
            r_squared=round(r2, 4),
            convergence_status="CONVERGED" if res.success else "DID_NOT_CONVERGE",
            condition_number_fim=round(cond_num, 1),
            warnings=warnings,
            observations_used=len(observations)
        )

        return calibrated_params, report
