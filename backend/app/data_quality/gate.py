"""PRIVAVEDA Data Quality Gate.

Architectural Rule:
"No simulation should begin until data validation runs."
Validates physiological plausibility, unit integrity, temporal ordering, and completeness.
Flags explicit ESTIMATED imputations with uncertainty.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from app.data_quality.units import validate_unit_dimension, UnitError

# Physiological plausible reference ranges for adult patients (literature sanity boundaries)
PHYSIOLOGICAL_BOUNDS = {
    "weight_kg": (20.0, 300.0),
    "height_cm": (100.0, 250.0),
    "bmi": (10.0, 75.0),
    "egfr": (1.0, 200.0),                  # mL/min/1.73m^2
    "serum_creatinine_mg_dl": (0.1, 25.0),  # mg/dL
    "alt_u_l": (1.0, 2000.0),              # U/L
    "ast_u_l": (1.0, 2000.0),              # U/L
    "total_bilirubin_mg_dl": (0.1, 40.0),  # mg/dL
    "albumin_g_dl": (1.0, 6.0),            # g/dL
    "hematocrit_pct": (10.0, 70.0),        # %
    "heart_rate_bpm": (30.0, 240.0),       # bpm
    "blood_pressure_systolic": (50.0, 260.0),
    "blood_pressure_diastolic": (30.0, 160.0),
    "cyp2d6_activity_score": (0.0, 3.5),
}

# Required fields for basic PK/PBPK simulation
CORE_REQUIRED_FIELDS = ["weight_kg", "egfr", "condition"]


@dataclass
class DataQualityReport:
    overall_status: str  # "PASS", "WARN", "BLOCK"
    completeness: float  # 0.0 to 1.0
    missing_required_fields: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    stale_fields: list[str] = field(default_factory=list)
    unit_issues: list[str] = field(default_factory=list)
    provenance_issues: list[str] = field(default_factory=list)
    blocking_reasons: list[str] = field(default_factory=list)
    imputed_fields: dict[str, dict[str, Any]] = field(default_factory=dict)

    @property
    def is_blocked(self) -> bool:
        return self.overall_status == "BLOCK" or len(self.blocking_reasons) > 0


class DataQualityGate:
    """Evaluates case data prior to digital twin construction or simulation."""

    def __init__(self, allow_imputation: bool = False, max_stale_days: int = 365):
        self.allow_imputation = allow_imputation
        self.max_stale_days = max_stale_days

    def evaluate(self, case: dict[str, Any]) -> DataQualityReport:
        errors = []
        warnings = []
        missing = []
        stale = []
        unit_issues = []
        provenance_issues = []
        blocking = []
        imputed = {}

        # 1. Schema check
        if not isinstance(case, dict):
            return DataQualityReport(
                overall_status="BLOCK",
                completeness=0.0,
                errors=["Case input must be a valid dictionary"],
                blocking_reasons=["Malformed case payload"]
            )

        # 2. Provenance check
        provenance = case.get("provenance")
        if not provenance:
            provenance_issues.append("Case provenance metadata is absent")
            warnings.append("Missing provenance metadata; record cannot be verified against clinical origin")
        elif isinstance(provenance, dict) and not provenance.get("source"):
            provenance_issues.append("Unknown or unverified data source")
            warnings.append("Source provenance is unidentified")

        # 3. Required fields check
        for field_name in CORE_REQUIRED_FIELDS:
            val = case.get(field_name) or case.get("labs", {}).get(field_name) or case.get("organ_function", {}).get(field_name)
            if val is None or val == "" or val == "unknown":
                missing.append(field_name)

        # 4. Imputation handling (Explicit and labeled ESTIMATED with uncertainty)
        if missing and self.allow_imputation:
            for m in list(missing):
                if m == "egfr":
                    # Explicit estimation default for adult: 90 mL/min with 40% uncertainty
                    imputed["egfr"] = {
                        "value": 90.0,
                        "unit": "mL / min",
                        "status": "ESTIMATED",
                        "uncertainty_cv": 0.40,
                        "method": "POPULATION_REFERENCE_MEDIAN"
                    }
                    missing.remove("egfr")
                    warnings.append("eGFR was absent and explicitly imputed as ESTIMATED (90.0 mL/min, 40% CV uncertainty)")
                elif m == "weight_kg":
                    imputed["weight_kg"] = {
                        "value": 70.0,
                        "unit": "kg",
                        "status": "ESTIMATED",
                        "uncertainty_cv": 0.25,
                        "method": "STANDARD_REFERENCE_MAN"
                    }
                    missing.remove("weight_kg")
                    warnings.append("Weight was absent and explicitly imputed as ESTIMATED (70.0 kg, 25% CV uncertainty)")

        if missing:
            blocking.append(f"Missing mandatory physiological parameters: {', '.join(missing)}")
            errors.append(f"Required inputs missing: {missing}")

        # 5. Unit checks in measurements
        measurements = case.get("measurements", {})
        for name, m_obj in measurements.items():
            if isinstance(m_obj, dict) and "unit" in m_obj:
                u_str = m_obj["unit"]
                category = m_obj.get("dimension_category")
                if category and not validate_unit_dimension(u_str, category):
                    msg = f"Measurement '{name}' has incompatible unit '{u_str}' for dimension '{category}'"
                    unit_issues.append(msg)
                    errors.append(msg)
                    blocking.append(msg)

        # 6. Physiological plausibility & Impossible numbers
        all_numerical = {}
        for k in ["weight_kg", "height_cm", "bmi"]:
            if k in case and isinstance(case[k], (int, float)):
                all_numerical[k] = float(case[k])
        for k, v in case.get("labs", {}).items():
            if isinstance(v, (int, float)):
                all_numerical[k] = float(v)
        for k, v in case.get("genomics", {}).items():
            if isinstance(v, (int, float)):
                all_numerical[k] = float(v)

        for param, (low, high) in PHYSIOLOGICAL_BOUNDS.items():
            if param in all_numerical:
                val = all_numerical[param]
                if val < low or val > high:
                    msg = f"Physiologically implausible value for {param}: {val} (valid literature boundary: [{low}, {high}])"
                    errors.append(msg)
                    blocking.append(msg)

        # 7. Contradictory entry checks
        sex = case.get("sex", "").lower()
        history = [h.lower() for h in case.get("history", [])]
        if sex == "male" and any("pregnan" in h for h in history):
            msg = "Contradictory clinical data: male biological sex recorded with pregnancy"
            errors.append(msg)
            blocking.append(msg)

        # 8. Stale data check
        now = datetime.now(timezone.utc)
        for obs in case.get("observations_with_dates", []):
            if "date" in obs:
                try:
                    obs_date = datetime.fromisoformat(obs["date"].replace("Z", "+00:00"))
                    age_days = (now - obs_date).days
                    if age_days < 0:
                        msg = f"Observation '{obs.get('name')}' has invalid future timestamp: {obs['date']}"
                        errors.append(msg)
                        blocking.append(msg)
                    elif age_days > self.max_stale_days:
                        stale.append(f"{obs.get('name')} ({age_days} days old)")
                        warnings.append(f"Stale observation: {obs.get('name')} exceeds {self.max_stale_days} days")
                except Exception:
                    warnings.append(f"Unparseable date in observation: {obs.get('date')}")

        # Compute completeness ratio over expected fields
        expected_eval = CORE_REQUIRED_FIELDS + ["allergies", "medications", "labs", "genomics"]
        present_count = sum(1 for f in expected_eval if f in case and case[f] not in (None, "", [], {}))
        completeness = round(present_count / len(expected_eval), 3)

        # Determine overall status
        if blocking or errors:
            status = "BLOCK"
        elif warnings or stale or imputed:
            status = "WARN"
        else:
            status = "PASS"

        return DataQualityReport(
            overall_status=status,
            completeness=completeness,
            missing_required_fields=missing,
            warnings=warnings,
            errors=errors,
            stale_fields=stale,
            unit_issues=unit_issues,
            provenance_issues=provenance_issues,
            blocking_reasons=blocking,
            imputed_fields=imputed
        )
