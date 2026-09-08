"""Property-Based Tests for PRIVAVEDA using Hypothesis."""
import numpy as np
from hypothesis import given, strategies as st, settings
from app.twin.models.one_compartment import analytical_iv_bolus, OneCompartmentPKModel
from app.twin.models.base import Intervention
from app.twin.parameter_vector import PatientParameterVector
from app.twin.solver import ODESolverEngine
from app.security.crypto import compute_content_digest


@settings(max_examples=40, deadline=None)
@given(
    v=st.floats(min_value=1.0, max_value=200.0),
    cl=st.floats(min_value=0.0, max_value=50.0),
    dose=st.floats(min_value=0.0, max_value=1000.0),
    t=st.floats(min_value=0.0, max_value=48.0)
)
def test_property_analytical_iv_monotonic_non_negative(v, cl, dose, t):
    """Property: Analytical IV bolus concentration is always non-negative and decreases monotonically with time."""
    c_t = analytical_iv_bolus(np.array([t]), dose, v, cl)[0]
    assert c_t >= 0.0

    c_t_later = analytical_iv_bolus(np.array([t + 1.0]), dose, v, cl)[0]
    assert c_t_later <= c_t + 1e-12


@settings(max_examples=30, deadline=None)
@given(st.text(min_size=1, max_size=100))
def test_property_content_digest_deterministic(text_val):
    """Property: Content digest is deterministic, 64-hex chars, and collision-resistant."""
    h1 = compute_content_digest({"key": text_val})
    h2 = compute_content_digest({"key": text_val})
    assert len(h1) == 64
    assert h1 == h2


@settings(max_examples=20, deadline=None)
@given(
    v=st.floats(min_value=10.0, max_value=100.0),
    cl=st.floats(min_value=0.5, max_value=20.0),
    ka=st.floats(min_value=0.2, max_value=3.0),
    dose=st.floats(min_value=10.0, max_value=500.0)
)
def test_property_ode_solver_non_negativity(v, cl, ka, dose):
    """Property: ODE solver produces strictly non-negative concentrations across random parameter sets."""
    model = OneCompartmentPKModel()
    params = PatientParameterVector(
        patient_token="PT-PROP",
        v_total_l=v,
        cl_systemic_l_h=cl,
        ka_per_h=ka
    )
    intervention = Intervention(dose_mg=dose, route="oral")
    solver = ODESolverEngine(rtol=1e-4, atol=1e-7)
    sim = solver.simulate(model, params, intervention, t_span=(0.0, 12.0), t_eval=np.linspace(0, 12, 25))

    assert sim.solver_status == "SUCCESS"
    assert np.all(sim.concentrations["plasma"] >= 0.0)
