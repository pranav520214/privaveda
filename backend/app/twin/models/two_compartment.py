"""PRIVAVEDA Two-Compartment Mechanistic PK Model.

Features:
- Central compartment (blood / highly perfused organs)
- Peripheral compartment (deep tissue distribution)
- Intercompartmental clearance Q and systemic clearance CL
"""
from typing import Any
import numpy as np
from app.twin.models.base import SimulationModel, Intervention


class TwoCompartmentPKModel(SimulationModel):
    """Two-compartment PK model capturing distribution phase and tissue equilibrium."""

    @property
    def name(self) -> str:
        return "TwoCompartment_PK_v1.0"

    @property
    def state_names(self) -> list[str]:
        return ["A_gut", "A_central", "A_peripheral"]

    def validate_parameters(self, parameters: Any) -> list[str]:
        errors = []
        if getattr(parameters, "v_central_l", 0) <= 0:
            errors.append("Central volume v_central_l must be strictly positive")
        if getattr(parameters, "v_peripheral_l", 0) <= 0:
            errors.append("Peripheral volume v_peripheral_l must be strictly positive")
        if getattr(parameters, "cl_systemic_l_h", 0) < 0:
            errors.append("Clearance cl_systemic_l_h cannot be negative")
        if getattr(parameters, "q_intercompartmental_l_h", 0) < 0:
            errors.append("Intercompartmental clearance q_intercompartmental_l_h cannot be negative")
        return errors

    def initial_state(self, parameters: Any, intervention: Intervention) -> np.ndarray:
        if intervention.route == "oral":
            return np.array([intervention.dose_mg, 0.0, 0.0], dtype=np.float64)
        elif intervention.route == "iv_bolus":
            return np.array([0.0, intervention.dose_mg, 0.0], dtype=np.float64)
        else:
            return np.array([0.0, 0.0, 0.0], dtype=np.float64)

    def derivative(self, t: float, y: np.ndarray, parameters: Any, intervention: Intervention) -> np.ndarray:
        a_gut = max(0.0, float(y[0]))
        a_c = max(0.0, float(y[1]))
        a_p = max(0.0, float(y[2]))

        vc = float(parameters.v_central_l)
        vp = float(parameters.v_peripheral_l)
        cl = float(parameters.cl_systemic_l_h)
        q = float(parameters.q_intercompartmental_l_h)
        ka = float(parameters.ka_per_h)
        f = float(parameters.bioavailability_f)

        # Rate constants
        k10 = cl / vc
        k12 = q / vc
        k21 = q / vp

        da_gut_dt = -ka * a_gut
        da_c_dt = ka * a_gut * f - k10 * a_c - k12 * a_c + k21 * a_p
        da_p_dt = k12 * a_c - k21 * a_p

        return np.array([da_gut_dt, da_c_dt, da_p_dt], dtype=np.float64)

    def state_to_concentrations(self, y: np.ndarray, parameters: Any) -> dict[str, np.ndarray]:
        vc = float(parameters.v_central_l)
        vp = float(parameters.v_peripheral_l)
        if y.ndim == 1:
            c_c = y[1] / vc
            c_p = y[2] / vp
        else:
            c_c = y[1, :] / vc
            c_p = y[2, :] / vp
        return {
            "plasma": np.maximum(0.0, c_c),
            "tissue": np.maximum(0.0, c_p)
        }
