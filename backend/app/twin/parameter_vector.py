"""PRIVAVEDA Bio-Mathematical Digital Twin Parameter Vector.

Represents biological state through explicit mathematical parameters (theta_patient):
- Physiological volumes, clearances, flows, partition coefficients
- Covariates (weight, age, sex, eGFR, organ function)
- Genomic modifiers (e.g. CYP2D6, CYP3A4 activity scores)
- Parameter uncertainty distributions (log-normal sigma)
"""
from dataclasses import dataclass, field
from typing import Any
import numpy as np


@dataclass
class PatientParameterVector:
    """Theta_patient vector for mechanistic PK and PBPK simulation."""
    # Identification
    patient_token: str
    
    # Body Covariates
    weight_kg: float = 70.0
    height_cm: float = 175.0
    age_years: float = 50.0
    sex: str = "unspecified"
    
    # Physiological Volumes (L)
    v_central_l: float = 14.0       # Plasma + rapid equilibrating extracellular fluid
    v_peripheral_l: float = 28.0    # Deep tissue distribution volume
    v_total_l: float = 42.0         # Total volume of distribution (Vd)
    
    # Clearances (L/h)
    cl_systemic_l_h: float = 4.5    # Total systemic clearance
    cl_renal_l_h: float = 2.0       # Renal filtration clearance
    cl_hepatic_l_h: float = 2.5     # Hepatic metabolic clearance
    q_intercompartmental_l_h: float = 8.0  # Distribution clearance between central/peripheral
    
    # Blood Flows (L/h)
    cardiac_output_l_h: float = 360.0  # ~6 L/min = 360 L/h
    q_liver_l_h: float = 90.0          # ~25% of cardiac output
    q_kidney_l_h: float = 72.0         # ~20% of cardiac output
    q_other_l_h: float = 198.0         # Remainder
    
    # Tissue Partition Coefficients (Kp)
    kp_liver: float = 1.8
    kp_kidney: float = 1.5
    kp_other: float = 1.0
    
    # Absorption parameters (Oral)
    ka_per_h: float = 1.2           # Absorption rate constant (1/h)
    bioavailability_f: float = 0.85 # Bioavailability fraction
    
    # Genomic & Functional modifiers
    cyp2d6_activity_score: float = 2.0  # 0.0 = Poor, 1.0 = Intermediate, 2.0 = Normal, >2.0 = Ultrarapid
    egfr_ml_min: float = 90.0
    
    # Parameter Uncertainty (Standard Deviation on log scale for Monte Carlo)
    sigma_log_cl: float = 0.25      # 25% CV on clearance
    sigma_log_v: float = 0.20       # 20% CV on volume
    sigma_log_ka: float = 0.30      # 30% CV on absorption
    
    # Metadata & Provenance
    is_synthetic: bool = True
    provenance_source: str = "SYNTHETIC_TWIN_BUILDER_V1"
    parameter_version: str = "theta-v1.0"
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "patient_token": self.patient_token,
            "weight_kg": self.weight_kg,
            "v_central_l": self.v_central_l,
            "v_peripheral_l": self.v_peripheral_l,
            "v_total_l": self.v_total_l,
            "cl_systemic_l_h": self.cl_systemic_l_h,
            "cl_renal_l_h": self.cl_renal_l_h,
            "cl_hepatic_l_h": self.cl_hepatic_l_h,
            "q_intercompartmental_l_h": self.q_intercompartmental_l_h,
            "ka_per_h": self.ka_per_h,
            "bioavailability_f": self.bioavailability_f,
            "cyp2d6_activity_score": self.cyp2d6_activity_score,
            "egfr_ml_min": self.egfr_ml_min,
            "sigma_log_cl": self.sigma_log_cl,
            "sigma_log_v": self.sigma_log_v,
            "is_synthetic": self.is_synthetic,
            "parameter_version": self.parameter_version
        }

    @classmethod
    def from_case(cls, patient_token: str, case: dict[str, Any]) -> "PatientParameterVector":
        """Builds theta_patient from a validated case dictionary with allometric scaling."""
        weight = float(case.get("weight_kg", 70.0))
        age = float(case.get("age_years", 50.0))
        sex = str(case.get("sex", "unspecified"))
        
        # Allometric scaling baseline (70kg standard adult):
        # Volumes scale with (Weight / 70)^1.0
        # Clearances scale with (Weight / 70)^0.75
        scale_v = weight / 70.0
        scale_cl = (weight / 70.0) ** 0.75
        
        # Base physiological estimates
        v_c = 14.0 * scale_v
        v_p = 28.0 * scale_v
        v_tot = v_c + v_p
        
        # Renal modifier: eGFR ratio relative to normal 100 mL/min
        egfr = float(case.get("egfr") or case.get("labs", {}).get("egfr", 90.0))
        renal_factor = max(0.05, min(2.0, egfr / 100.0))
        cl_r = 2.0 * scale_cl * renal_factor
        
        # Genomic modifier: CYP2D6 activity score
        cyp_score = 2.0
        genomics = case.get("genomics", {})
        if "cyp2d6_score" in genomics:
            cyp_score = float(genomics["cyp2d6_score"])
        elif "CYP2D6" in genomics:
            val = str(genomics["CYP2D6"]).lower()
            if "poor" in val or "pm" in val:
                cyp_score = 0.0
            elif "intermediate" in val or "im" in val:
                cyp_score = 1.0
            elif "ultrarapid" in val or "um" in val:
                cyp_score = 3.0
        
        hepatic_factor = max(0.1, cyp_score / 2.0)
        cl_h = 2.5 * scale_cl * hepatic_factor
        
        cl_tot = cl_r + cl_h
        
        return cls(
            patient_token=patient_token,
            weight_kg=weight,
            age_years=age,
            sex=sex,
            v_central_l=round(v_c, 3),
            v_peripheral_l=round(v_p, 3),
            v_total_l=round(v_tot, 3),
            cl_systemic_l_h=round(cl_tot, 3),
            cl_renal_l_h=round(cl_r, 3),
            cl_hepatic_l_h=round(cl_h, 3),
            q_intercompartmental_l_h=round(8.0 * scale_cl, 3),
            egfr_ml_min=egfr,
            cyp2d6_activity_score=cyp_score,
            is_synthetic=bool(case.get("synthetic", True)),
            provenance_source=case.get("provenance", {}).get("source", "CASE_ALLOMETRIC_INFERENCE") if isinstance(case.get("provenance"), dict) else "CASE_ALLOMETRIC_INFERENCE"
        )
