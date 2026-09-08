"""PRIVAVEDA Multi-Organ Physiologically-Based Pharmacokinetic (PBPK) Model.

Physiological organ architecture:
- Blood Pool (Arterial/Venous)
- Liver (Perfusion-limited, metabolic enzymatic clearance)
- Kidney (Perfusion-limited, renal filtration excretion)
- Rest of Body (Muscle, adipose, connective tissue)
- Gut depot for oral absorption

Governing differential equations enforce organ mass balance and flow conservation:
sum(Q_organ) == Q_cardiac_output
"""
from typing import Any
import numpy as np
from app.twin.models.base import SimulationModel, Intervention


class PhysiologicalPBPKModel(SimulationModel):
    """Mechanistic 4-compartment physiological PBPK model."""

    @property
    def name(self) -> str:
        return "Physiological_PBPK_v1.0"

    @property
    def state_names(self) -> list[str]:
        return ["A_gut", "A_blood", "A_liver", "A_kidney", "A_rest"]

    def validate_parameters(self, parameters: Any) -> list[str]:
        errors = []
        q_co = getattr(parameters, "cardiac_output_l_h", 360.0)
        q_l = getattr(parameters, "q_liver_l_h", 90.0)
        q_k = getattr(parameters, "q_kidney_l_h", 72.0)
        q_r = getattr(parameters, "q_other_l_h", 198.0)
        
        if abs((q_l + q_k + q_r) - q_co) > 1e-3:
            errors.append(f"Organ blood flows ({q_l} + {q_k} + {q_r} = {q_l+q_k+q_r}) do not sum to Cardiac Output ({q_co})")
        
        for p in ["kp_liver", "kp_kidney", "kp_other"]:
            if getattr(parameters, p, 1.0) <= 0:
                errors.append(f"Partition coefficient '{p}' must be strictly positive")
        return errors

    def initial_state(self, parameters: Any, intervention: Intervention) -> np.ndarray:
        if intervention.route == "oral":
            return np.array([intervention.dose_mg, 0.0, 0.0, 0.0, 0.0], dtype=np.float64)
        elif intervention.route == "iv_bolus":
            return np.array([0.0, intervention.dose_mg, 0.0, 0.0, 0.0], dtype=np.float64)
        else:
            return np.array([0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float64)

    def derivative(self, t: float, y: np.ndarray, parameters: Any, intervention: Intervention) -> np.ndarray:
        a_gut = max(0.0, float(y[0]))
        a_blood = max(0.0, float(y[1]))
        a_liver = max(0.0, float(y[2]))
        a_kidney = max(0.0, float(y[3]))
        a_rest = max(0.0, float(y[4]))

        # Anatomical physiological volumes (scaled to patient weight)
        scale_w = float(parameters.weight_kg) / 70.0
        v_blood = 5.0 * scale_w
        v_liver = 1.8 * scale_w
        v_kidney = 0.3 * scale_w
        v_rest = max(5.0, (float(parameters.v_total_l) - v_blood - v_liver - v_kidney))

        # Concentrations
        c_blood = a_blood / v_blood
        c_liver = a_liver / v_liver
        c_kidney = a_kidney / v_kidney
        c_rest = a_rest / v_rest

        # Flows & Partitions
        q_co = float(parameters.cardiac_output_l_h)
        q_l = float(parameters.q_liver_l_h)
        q_k = float(parameters.q_kidney_l_h)
        q_r = float(parameters.q_other_l_h)

        kp_l = float(parameters.kp_liver)
        kp_k = float(parameters.kp_kidney)
        kp_r = float(parameters.kp_other)

        # Clearances
        cl_h = float(parameters.cl_hepatic_l_h)
        cl_r = float(parameters.cl_renal_l_h)
        ka = float(parameters.ka_per_h)
        f = float(parameters.bioavailability_f)

        # Venous blood exiting organs
        c_venous_liver = c_liver / kp_l
        c_venous_kidney = c_kidney / kp_k
        c_venous_rest = c_rest / kp_r

        # Gut depot
        da_gut_dt = -ka * a_gut

        # Liver mass balance (receives oral drug absorption from portal vein)
        da_liver_dt = (ka * a_gut * f) + q_l * (c_blood - c_venous_liver) - cl_h * c_venous_liver

        # Kidney mass balance
        da_kidney_dt = q_k * (c_blood - c_venous_kidney)

        # Rest of body mass balance
        da_rest_dt = q_r * (c_blood - c_venous_rest)

        # Blood pool mass balance (receives venous return from all organs, renal clearance via filtration)
        total_venous_return = q_l * c_venous_liver + q_k * c_venous_kidney + q_r * c_venous_rest
        da_blood_dt = total_venous_return - q_co * c_blood - cl_r * c_blood

        return np.array([da_gut_dt, da_blood_dt, da_liver_dt, da_kidney_dt, da_rest_dt], dtype=np.float64)

    def state_to_concentrations(self, y: np.ndarray, parameters: Any) -> dict[str, np.ndarray]:
        scale_w = float(parameters.weight_kg) / 70.0
        v_blood = 5.0 * scale_w
        v_liver = 1.8 * scale_w
        v_kidney = 0.3 * scale_w
        v_rest = max(5.0, (float(parameters.v_total_l) - v_blood - v_liver - v_kidney))

        if y.ndim == 1:
            return {
                "blood": np.maximum(0.0, y[1] / v_blood),
                "liver": np.maximum(0.0, y[2] / v_liver),
                "kidney": np.maximum(0.0, y[3] / v_kidney),
                "tissue": np.maximum(0.0, y[4] / v_rest)
            }
        return {
            "blood": np.maximum(0.0, y[1, :] / v_blood),
            "liver": np.maximum(0.0, y[2, :] / v_liver),
            "kidney": np.maximum(0.0, y[3, :] / v_kidney),
            "tissue": np.maximum(0.0, y[4, :] / v_rest)
        }
