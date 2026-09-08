"""PRIVAVEDA Deterministic Synthetic Patient Generator.

CRITICAL SAFETY BOUNDARY:
"Synthetic data must be the DEFAULT demonstration mode.
Do not introduce real patient data into tests, fixtures, screenshots, logs, or documentation.
Every synthetic fixture must visibly include: synthetic = true."
"""
from typing import Any


def generate_synthetic_cohort() -> dict[str, dict[str, Any]]:
    """Generates 7 deterministic synthetic profiles designed to test distinct system pathways."""
    return {
        # 1. Normal workflow
        "SYN-NORM-01": {
            "case_id": "SYN-NORM-01",
            "synthetic": True,
            "label": "Synthetic Case 01: Standard Adult Profile",
            "weight_kg": 72.0,
            "height_cm": 178.0,
            "age_years": 48.0,
            "sex": "male",
            "condition": "Hypertension & Dyslipidemia",
            "history": ["Essential hypertension", "Dyslipidemia"],
            "medications": ["Amlodipine 5mg", "Atorvastatin 20mg"],
            "allergies": ["Penicillin"],
            "egfr": 95.0,
            "labs": {
                "egfr": 95.0,
                "serum_creatinine_mg_dl": 0.9,
                "alt_u_l": 24.0,
                "ast_u_l": 22.0,
                "total_bilirubin_mg_dl": 0.7,
                "albumin_g_dl": 4.2
            },
            "genomics": {
                "cyp2d6_score": 2.0,
                "CYP2D6": "Normal Metabolizer (*1/*1)"
            },
            "organ_function": {
                "renal": "normal",
                "hepatic": "normal"
            },
            "provenance": {
                "source": "SYNTHETIC_GENERATOR_DETERMINISTIC_V1",
                "cohort": "BENCHMARK_STANDARD"
            }
        },
        # 2. Missing critical physiological input
        "SYN-MISS-02": {
            "case_id": "SYN-MISS-02",
            "synthetic": True,
            "label": "Synthetic Case 02: Missing Critical eGFR Lab",
            "weight_kg": 68.0,
            "height_cm": 165.0,
            "age_years": 62.0,
            "sex": "female",
            "condition": "Atrial Fibrillation",
            "history": ["Non-valvular atrial fibrillation"],
            "medications": ["Metoprolol 50mg"],
            "allergies": [],
            # egfr is missing
            "labs": {
                "alt_u_l": 18.0
            },
            "genomics": {
                "cyp2d6_score": 2.0
            },
            "provenance": {
                "source": "SYNTHETIC_GENERATOR_DETERMINISTIC_V1",
                "cohort": "BENCHMARK_MISSING_DATA"
            }
        },
        # 3. Severe contraindication (CYP2D6 PM)
        "SYN-CONTRA-03": {
            "case_id": "SYN-CONTRA-03",
            "synthetic": True,
            "label": "Synthetic Case 03: CYP2D6 Poor Metabolizer Toxicity",
            "weight_kg": 65.0,
            "height_cm": 170.0,
            "age_years": 42.0,
            "sex": "female",
            "condition": "Neuropathic Pain",
            "history": ["Diabetic peripheral neuropathy"],
            "medications": ["Gabapentin 300mg"],
            "allergies": [],
            "egfr": 88.0,
            "labs": {
                "egfr": 88.0,
                "serum_creatinine_mg_dl": 0.8
            },
            "genomics": {
                "cyp2d6_score": 0.0,
                "CYP2D6": "Poor Metabolizer (*4/*4)"
            },
            "provenance": {
                "source": "SYNTHETIC_GENERATOR_DETERMINISTIC_V1",
                "cohort": "BENCHMARK_PHARMACOGENOMIC_BLOCK"
            }
        },
        # 4. High parameter uncertainty
        "SYN-UNCERT-04": {
            "case_id": "SYN-UNCERT-04",
            "synthetic": True,
            "label": "Synthetic Case 04: Highly Variable Kinetics & Uncertainty",
            "weight_kg": 54.0,
            "height_cm": 158.0,
            "age_years": 78.0,
            "sex": "female",
            "condition": "Congestive Heart Failure",
            "history": ["Heart failure with reduced ejection fraction"],
            "medications": ["Furosemide 40mg", "Spironolactone 25mg"],
            "allergies": [],
            "egfr": 42.0,
            "labs": {
                "egfr": 42.0,
                "serum_creatinine_mg_dl": 1.6,
                "albumin_g_dl": 2.8  # Hypoalbuminemia causes high free drug variance
            },
            "genomics": {
                "cyp2d6_score": 1.0
            },
            "provenance": {
                "source": "SYNTHETIC_GENERATOR_DETERMINISTIC_V1",
                "cohort": "BENCHMARK_HIGH_UNCERTAINTY"
            }
        },
        # 5. Closed-loop calibration case
        "SYN-CALIB-05": {
            "case_id": "SYN-CALIB-05",
            "synthetic": True,
            "label": "Synthetic Case 05: Therapeutic Drug Monitoring Recalibration",
            "weight_kg": 80.0,
            "height_cm": 182.0,
            "age_years": 54.0,
            "sex": "male",
            "condition": "Severe Bacterial Sepsis",
            "history": ["Sepsis", "Pneumonia"],
            "medications": ["Norepinephrine infusion"],
            "allergies": [],
            "egfr": 65.0,
            "labs": {
                "egfr": 65.0,
                "serum_creatinine_mg_dl": 1.3
            },
            "genomics": {
                "cyp2d6_score": 2.0
            },
            # Synthetic observed serum concentration measurements for Bayesian update
            "synthetic_observations": [
                {"time_h": 2.0, "measured_conc_mg_l": 6.8, "std_err": 0.2},
                {"time_h": 8.0, "measured_conc_mg_l": 2.4, "std_err": 0.2},
                {"time_h": 12.0, "measured_conc_mg_l": 1.2, "std_err": 0.1}
            ],
            "provenance": {
                "source": "SYNTHETIC_GENERATOR_DETERMINISTIC_V1",
                "cohort": "BENCHMARK_CALIBRATION_LOOP"
            }
        },
        # 6. Tampered integrity test profile
        "SYN-INTEG-06": {
            "case_id": "SYN-INTEG-06",
            "synthetic": True,
            "label": "Synthetic Case 06: Integrity Tampering Detection Case",
            "weight_kg": 75.0,
            "height_cm": 175.0,
            "age_years": 35.0,
            "sex": "male",
            "condition": "Migraine Prophylaxis",
            "history": [],
            "medications": [],
            "allergies": [],
            "egfr": 110.0,
            "labs": {"egfr": 110.0},
            "genomics": {"cyp2d6_score": 2.0},
            "provenance": {
                "source": "SYNTHETIC_GENERATOR_DETERMINISTIC_V1",
                "cohort": "BENCHMARK_TAMPER_TEST"
            }
        },
        # 7. Extreme physiological state for solver stability
        "SYN-SOLV-07": {
            "case_id": "SYN-SOLV-07",
            "synthetic": True,
            "label": "Synthetic Case 07: Extreme Boundary Physiology",
            "weight_kg": 185.0,  # Extreme morbid obesity
            "height_cm": 195.0,
            "age_years": 82.0,
            "sex": "male",
            "condition": "Severe Acute Kidney Injury",
            "history": ["End stage renal disease on intermittent hemodialysis"],
            "medications": ["Insulin", "Sevelamer"],
            "allergies": [],
            "egfr": 12.0,       # Severe renal shutdown
            "labs": {
                "egfr": 12.0,
                "serum_creatinine_mg_dl": 6.5,
                "alt_u_l": 450.0
            },
            "genomics": {
                "cyp2d6_score": 0.5
            },
            "provenance": {
                "source": "SYNTHETIC_GENERATOR_DETERMINISTIC_V1",
                "cohort": "BENCHMARK_SOLVER_EXTREMES"
            }
        }
    }
