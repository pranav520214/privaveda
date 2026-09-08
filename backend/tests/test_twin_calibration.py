"""Tests for Parameter Estimation and Bayesian Calibration Loop in PRIVAVEDA."""
import pytest
import numpy as np
from app.twin.models.base import Intervention
from app.twin.models.one_compartment import OneCompartmentPKModel
from app.twin.parameter_vector import PatientParameterVector
from app.twin.inference import ParameterEstimator, ObservedPoint
from app.twin.calibration import BayesianCalibrationLoop
from app.twin.solver import ODESolverEngine


def test_parameter_estimator_recovery():
    """Validates that MAP estimator recovers known true parameters from synthetic TDM points."""
    model = OneCompartmentPKModel()
    true_cl = 2.5
    true_v = 20.0
    true_params = PatientParameterVector(patient_token="PT-TRUE", cl_systemic_l_h=true_cl, v_total_l=true_v)
    intervention = Intervention(dose_mg=100.0, route="oral")

    # Generate synthetic observations with small noise
    solver = ODESolverEngine()
    sim_true = solver.simulate(model, true_params, intervention, t_eval=np.array([2.0, 6.0, 12.0]))
    obs_points = [
        ObservedPoint(time_h=2.0, measured_conc_mg_l=float(sim_true.concentrations["plasma"][0]), std_err=0.1),
        ObservedPoint(time_h=6.0, measured_conc_mg_l=float(sim_true.concentrations["plasma"][1]), std_err=0.1),
        ObservedPoint(time_h=12.0, measured_conc_mg_l=float(sim_true.concentrations["plasma"][2]), std_err=0.1),
    ]

    # Prior has biased guess (CL=5.0, V=35.0)
    prior_params = PatientParameterVector(patient_token="PT-PRIOR", cl_systemic_l_h=5.0, v_total_l=35.0)
    estimator = ParameterEstimator(solver)

    calib_params, report = estimator.estimate(model, prior_params, intervention, obs_points)

    assert report.convergence_status == "CONVERGED"
    assert report.fit_rmse < 0.2  # Excellent fit
    # Estimated values should be close to true parameters
    assert pytest.approx(calib_params.cl_systemic_l_h, rel=0.25) == true_cl
    assert pytest.approx(calib_params.v_total_l, rel=0.25) == true_v


def test_bayesian_calibration_loop_improves_error():
    """Predict-learn-update loop shows lower residual error in V2 than V1."""
    model = OneCompartmentPKModel()
    prior_params = PatientParameterVector(patient_token="PT-LOOP", cl_systemic_l_h=6.0, v_total_l=50.0)
    intervention = Intervention(dose_mg=100.0, route="oral")

    # Actual measurements from patient clearing at 2.0 L/h
    obs = [
        ObservedPoint(time_h=3.0, measured_conc_mg_l=3.2, std_err=0.15),
        ObservedPoint(time_h=8.0, measured_conc_mg_l=1.8, std_err=0.15),
        ObservedPoint(time_h=14.0, measured_conc_mg_l=0.9, std_err=0.10)
    ]

    calib_loop = BayesianCalibrationLoop()
    res = calib_loop.execute_loop(model, prior_params, intervention, obs)

    assert res.error_improved is True
    assert res.v2_rmse < res.v1_rmse
    assert res.rmse_delta > 0
    assert len(res.v1_predictions) == 3
    assert len(res.v2_predictions) == 3
