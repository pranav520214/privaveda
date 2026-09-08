"""PRIVAVEDA One-Compartment Mechanistic PK Model & Analytical Reference.

Includes:
1. Differential equations for IV bolus and oral 1st-order absorption.
2. Closed-form analytical mathematical solutions for solver validation.
"""
from typing import Any
import numpy as np
from app.twin.models.base import SimulationModel, Intervention


def analytical_iv_bolus(t: np.ndarray, dose_mg: float, v_l: float, cl_l_h: float) -> np.ndarray:
    """Exact closed-form analytical solution for single IV bolus:
    C(t) = (Dose / V) * exp(-ke * t)
    """
    if v_l <= 0:
        raise ValueError("Volume V must be strictly positive")
    ke = cl_l_h / v_l
    return (dose_mg / v_l) * np.exp(-ke * t)


def analytical_oral(
    t: np.ndarray,
    dose_mg: float,
    v_l: float,
    cl_l_h: float,
    ka_per_h: float,
    bioavailability_f: float = 1.0
) -> np.ndarray:
    """Exact closed-form analytical solution for single oral dose with 1st-order absorption:
    C(t) = (Dose * F * ka / (V * (ka - ke))) * (exp(-ke * t) - exp(-ka * t))
    """
    if v_l <= 0 or ka_per_h <= 0:
        raise ValueError("V and ka must be strictly positive")
    ke = cl_l_h / v_l
    if abs(ka_per_h - ke) < 1e-7:
        # Flip-flop degenerate case limit: ka -> ke: t * exp(-ke * t)
        return (dose_mg * bioavailability_f * ke / v_l) * t * np.exp(-ke * t)
    
    prefactor = (dose_mg * bioavailability_f * ka_per_h) / (v_l * (ka_per_h - ke))
    return prefactor * (np.exp(-ke * t) - np.exp(-ka_per_h * t))


class OneCompartmentPKModel(SimulationModel):
    """One-compartment PK model with gut absorption and systemic clearance."""

    @property
    def name(self) -> str:
        return "OneCompartment_PK_v1.0"

    @property
    def state_names(self) -> list[str]:
        return ["A_gut", "A_central"]

    def validate_parameters(self, parameters: Any) -> list[str]:
        errors = []
        if getattr(parameters, "v_total_l", 0) <= 0:
            errors.append("Distribution volume v_total_l must be strictly positive")
        if getattr(parameters, "cl_systemic_l_h", 0) < 0:
            errors.append("Clearance cl_systemic_l_h cannot be negative")
        if getattr(parameters, "ka_per_h", 0) <= 0:
            errors.append("Absorption rate ka_per_h must be strictly positive")
        return errors

    def initial_state(self, parameters: Any, intervention: Intervention) -> np.ndarray:
        if intervention.route == "oral":
            return np.array([intervention.dose_mg, 0.0], dtype=np.float64)
        elif intervention.route == "iv_bolus":
            return np.array([0.0, intervention.dose_mg], dtype=np.float64)
        else:
            return np.array([0.0, 0.0], dtype=np.float64)

    def derivative(self, t: float, y: np.ndarray, parameters: Any, intervention: Intervention) -> np.ndarray:
        a_gut = max(0.0, float(y[0]))
        a_central = max(0.0, float(y[1]))

        v = float(parameters.v_total_l)
        cl = float(parameters.cl_systemic_l_h)
        ka = float(parameters.ka_per_h)
        f = float(parameters.bioavailability_f)

        ke = cl / v

        # Gut depot depletion
        da_gut_dt = -ka * a_gut
        
        # Central compartment accumulation and elimination
        da_central_dt = ka * a_gut * f - ke * a_central

        return np.array([da_gut_dt, da_central_dt], dtype=np.float64)

    def state_to_concentrations(self, y: np.ndarray, parameters: Any) -> dict[str, np.ndarray]:
        # y is shape (2, n_points) or (2,)
        v = float(parameters.v_total_l)
        if y.ndim == 1:
            c_central = y[1] / v
        else:
            c_central = y[1, :] / v
        return {
            "plasma": np.maximum(0.0, c_central)
        }
