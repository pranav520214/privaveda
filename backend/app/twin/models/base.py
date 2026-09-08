"""PRIVAVEDA Mechanistic Simulation Model Interface.

Separation of Concerns:
- Model Definition (ODEs, initial state, parameter bounds)
- Numerical Solver (SciPy solve_ivp)
- Parameter Data (theta_patient)
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
import numpy as np


@dataclass
class Intervention:
    """Drug dosing intervention."""
    dose_mg: float
    route: str = "oral"  # "oral", "iv_bolus", "iv_infusion"
    infusion_duration_h: float = 0.0
    repeat_interval_h: float = 0.0
    num_doses: int = 1


@dataclass
class ModelEvaluation:
    time: np.ndarray
    state_names: list[str]
    states: dict[str, np.ndarray]
    concentrations: dict[str, np.ndarray]  # mg/L


class SimulationModel(ABC):
    """Abstract Base Class for Pharmacokinetic & Systems Pharmacology ODE models."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Model identifier and version."""
        pass

    @property
    @abstractmethod
    def state_names(self) -> list[str]:
        """Names of the state variables in the system."""
        pass

    @abstractmethod
    def initial_state(self, parameters: Any, intervention: Intervention) -> np.ndarray:
        """Computes initial condition vector y0 at t=0."""
        pass

    @abstractmethod
    def derivative(self, t: float, y: np.ndarray, parameters: Any, intervention: Intervention) -> np.ndarray:
        """Computes dy/dt given time, state vector y, parameters, and intervention."""
        pass

    @abstractmethod
    def validate_parameters(self, parameters: Any) -> list[str]:
        """Validates that parameters are physically and mathematically permissible.
        
        Returns a list of error strings (empty if valid).
        """
        pass

    @abstractmethod
    def state_to_concentrations(self, y: np.ndarray, parameters: Any) -> dict[str, np.ndarray]:
        """Converts amounts (mg) into concentrations (mg/L)."""
        pass
