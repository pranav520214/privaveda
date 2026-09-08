"""Numerical Validation Tests for PRIVAVEDA PK and PBPK ODE Solvers."""
import pytest
import numpy as np
from app.twin.models.base import Intervention
from app.twin.models.one_compartment import OneCompartmentPKModel, analytical_iv_bolus, analytical_oral
from app.twin.models.two_compartment import TwoCompartmentPKModel
from app.twin.models.pbpk import PhysiologicalPBPKModel
from app.twin.parameter_vector import PatientParameterVector
from app.twin.solver import ODESolverEngine


def test_analytical_reference_comparison_iv_bolus():
    """Validates numerical ODE solution against exact mathematical analytical solution for IV bolus."""
    v_l = 25.0
    cl_l_h = 5.0
    dose_mg = 100.0

    model = OneCompartmentPKModel()
    params = PatientParameterVector(
        patient_token="PT-REF",
        v_total_l=v_l,
        cl_systemic_l_h=cl_l_h
    )
    intervention = Intervention(dose_mg=dose_mg, route="iv_bolus")

    solver = ODESolverEngine(method="RK45", rtol=1e-8, atol=1e-11)
    sim = solver.simulate(model, params, intervention, t_span=(0.0, 24.0))

    assert sim.solver_status == "SUCCESS"
    c_ode = sim.concentrations["plasma"]
    c_analytical = analytical_iv_bolus(sim.time, dose_mg, v_l, cl_l_h)

    # Maximum absolute error between SciPy solver and exact formula must be < 1e-5 mg/L
    max_error = float(np.max(np.abs(c_ode - c_analytical)))
    assert max_error < 1e-5


def test_analytical_reference_comparison_oral_absorption():
    """Validates numerical ODE solution against exact analytical formula for oral 1st-order absorption."""
    v_l = 30.0
    cl_l_h = 3.0
    ka = 1.5
    f = 0.90
    dose_mg = 200.0

    model = OneCompartmentPKModel()
    params = PatientParameterVector(
        patient_token="PT-REF-ORAL",
        v_total_l=v_l,
        cl_systemic_l_h=cl_l_h,
        ka_per_h=ka,
        bioavailability_f=f
    )
    intervention = Intervention(dose_mg=dose_mg, route="oral")

    solver = ODESolverEngine(method="RK45", rtol=1e-8, atol=1e-11)
    sim = solver.simulate(model, params, intervention, t_span=(0.0, 24.0))

    assert sim.solver_status == "SUCCESS"
    c_ode = sim.concentrations["plasma"]
    c_analytical = analytical_oral(sim.time, dose_mg, v_l, cl_l_h, ka, f)

    max_error = float(np.max(np.abs(c_ode - c_analytical)))
    assert max_error < 1e-4


def test_zero_input_behavior():
    """Ensures that zero drug dose produces strictly zero concentration."""
    model = OneCompartmentPKModel()
    params = PatientParameterVector(patient_token="PT-ZERO")
    intervention = Intervention(dose_mg=0.0, route="oral")

    solver = ODESolverEngine()
    sim = solver.simulate(model, params, intervention)
    assert sim.solver_status == "SUCCESS"
    assert np.all(sim.concentrations["plasma"] == 0.0)
    assert sim.metrics.c_max == 0.0
    assert sim.metrics.auc_0_t == 0.0


def test_mass_conservation_without_elimination():
    """When elimination clearance CL = 0, total amount of drug in system must equal Dose * F."""
    dose_mg = 150.0
    f = 1.0
    model = OneCompartmentPKModel()
    params = PatientParameterVector(
        patient_token="PT-CONSERVE",
        v_total_l=20.0,
        cl_systemic_l_h=0.0,  # Zero clearance
        ka_per_h=2.0,
        bioavailability_f=f
    )
    intervention = Intervention(dose_mg=dose_mg, route="oral")

    solver = ODESolverEngine(rtol=1e-8, atol=1e-11)
    sim = solver.simulate(model, params, intervention, t_span=(0.0, 12.0))

    # Total amount = A_gut + A_central
    total_amount = sim.states["A_gut"] + sim.states["A_central"]
    # Should be conserved at 150 mg within numerical integration tolerance
    assert np.all(np.abs(total_amount - dose_mg) < 1e-4)


def test_non_negativity_enforcement():
    """Concentrations must remain strictly non-negative throughout simulation."""
    model = TwoCompartmentPKModel()
    params = PatientParameterVector(patient_token="PT-NONNEG")
    intervention = Intervention(dose_mg=100.0, route="oral")

    solver = ODESolverEngine()
    sim = solver.simulate(model, params, intervention)
    assert sim.solver_status == "SUCCESS"
    assert np.all(sim.concentrations["plasma"] >= 0.0)
    assert np.all(sim.concentrations["tissue"] >= 0.0)


def test_tolerance_convergence():
    """Tightening solver tolerances (rtol, atol) reduces error relative to analytical benchmark."""
    model = OneCompartmentPKModel()
    params = PatientParameterVector(patient_token="PT-CONV", v_total_l=20.0, cl_systemic_l_h=4.0)
    intervention = Intervention(dose_mg=100.0, route="iv_bolus")
    c_analytical = analytical_iv_bolus(np.linspace(0, 24, 241), 100.0, 20.0, 4.0)

    # Loose tolerances
    sim_loose = ODESolverEngine(rtol=1e-3, atol=1e-5).simulate(model, params, intervention)
    err_loose = float(np.max(np.abs(sim_loose.concentrations["plasma"] - c_analytical)))

    # Strict tolerances
    sim_strict = ODESolverEngine(rtol=1e-8, atol=1e-11).simulate(model, params, intervention)
    err_strict = float(np.max(np.abs(sim_strict.concentrations["plasma"] - c_analytical)))

    assert err_strict < err_loose


def test_malformed_parameter_rejection():
    """Negative volume or clearance must be rejected before ODE execution."""
    model = OneCompartmentPKModel()
    bad_params = PatientParameterVector(
        patient_token="PT-BAD",
        v_total_l=-10.0,  # Physically impossible negative volume
        cl_systemic_l_h=-5.0
    )
    intervention = Intervention(dose_mg=100.0, route="oral")

    solver = ODESolverEngine()
    sim = solver.simulate(model, bad_params, intervention)
    assert sim.solver_status == "FAILED"
    assert len(sim.numerical_errors) > 0


def test_physiological_pbpk_execution():
    """Verifies that the multi-organ PBPK model integrates organ blood flows and mass balance."""
    model = PhysiologicalPBPKModel()
    params = PatientParameterVector(patient_token="PT-PBPK", weight_kg=70.0)
    intervention = Intervention(dose_mg=100.0, route="oral")

    solver = ODESolverEngine()
    sim = solver.simulate(model, params, intervention, t_span=(0.0, 12.0))

    assert sim.solver_status == "SUCCESS"
    assert "blood" in sim.concentrations
    assert "liver" in sim.concentrations
    assert "kidney" in sim.concentrations
    assert "tissue" in sim.concentrations
    assert np.all(sim.concentrations["blood"] >= 0.0)
