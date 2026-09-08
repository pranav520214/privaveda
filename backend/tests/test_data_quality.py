"""Tests for Pint Unit Handling and Data Quality Gate in PRIVAVEDA."""
import pytest
from datetime import datetime, timezone, timedelta
from app.data_quality.units import (
    parse_quantity,
    validate_unit_dimension,
    convert_to_canonical,
    compare_quantities,
    UnitError
)
from app.data_quality.gate import DataQualityGate, DataQualityReport


def test_unit_dimensional_validation():
    # Concentration
    assert validate_unit_dimension("mg / L", "concentration") is True
    assert validate_unit_dimension("ug / mL", "concentration") is True
    assert validate_unit_dimension("ng / dL", "concentration") is True
    assert validate_unit_dimension("kg", "concentration") is False  # Mass, not concentration

    # Clearance
    assert validate_unit_dimension("L / h", "clearance") is True
    assert validate_unit_dimension("mL / min", "clearance") is True
    assert validate_unit_dimension("mg", "clearance") is False


def test_unit_conversion_to_canonical():
    # 1000 ug/mL == 1000 mg/L
    c_conv = convert_to_canonical(1000.0, "ug / mL", "concentration")
    assert pytest.approx(c_conv, 1e-4) == 1000.0

    # 60 mL/min == 3.6 L/h
    cl_conv = convert_to_canonical(60.0, "mL / min", "clearance")
    assert pytest.approx(cl_conv, 1e-4) == 3.6


def test_safe_quantity_comparison():
    # 5 mg/L vs 5000 ug/L (identical)
    assert compare_quantities(5.0, "mg / L", 5000.0, "ug / L") == 0

    # 10 mg/L vs 5 mg/L
    assert compare_quantities(10.0, "mg / L", 5.0, "mg / L") == 1

    # Incompatible dimensions must raise UnitError
    with pytest.raises(UnitError):
        compare_quantities(10.0, "mg / L", 5.0, "kg")


def test_data_quality_gate_normal():
    gate = DataQualityGate()
    valid_case = {
        "weight_kg": 70.0,
        "egfr": 90.0,
        "condition": "Hypertension",
        "provenance": {"source": "CLINICAL_TRIAL_01"}
    }
    report = gate.evaluate(valid_case)
    assert report.overall_status == "PASS"
    assert report.is_blocked is False
    assert report.completeness > 0.3


def test_data_quality_gate_missing_required():
    gate = DataQualityGate(allow_imputation=False)
    # Missing eGFR
    case = {"weight_kg": 70.0, "condition": "Hypertension"}
    report = gate.evaluate(case)
    assert report.overall_status == "BLOCK"
    assert report.is_blocked is True
    assert "egfr" in report.missing_required_fields


def test_data_quality_gate_explicit_imputation():
    gate = DataQualityGate(allow_imputation=True)
    case = {"weight_kg": 70.0, "condition": "Hypertension"}
    report = gate.evaluate(case)
    # Imputation converts missing into explicit ESTIMATED warning
    assert report.overall_status == "WARN"
    assert "egfr" in report.imputed_fields
    assert report.imputed_fields["egfr"]["status"] == "ESTIMATED"
    assert report.imputed_fields["egfr"]["uncertainty_cv"] == 0.40


def test_data_quality_gate_impossible_values():
    gate = DataQualityGate()
    case = {
        "weight_kg": 650.0,  # Physically implausible weight
        "egfr": -10.0,       # Impossible negative eGFR
        "condition": "Hypertension"
    }
    report = gate.evaluate(case)
    assert report.overall_status == "BLOCK"
    assert report.is_blocked is True
    assert any("implausible" in e.lower() for e in report.errors)


def test_data_quality_gate_contradictory_entries():
    gate = DataQualityGate()
    case = {
        "weight_kg": 70.0,
        "egfr": 90.0,
        "sex": "male",
        "history": ["Second trimester pregnancy"],
        "condition": "Obstetric care"
    }
    report = gate.evaluate(case)
    assert report.overall_status == "BLOCK"
    assert any("contradictory" in b.lower() for b in report.blocking_reasons)


def test_data_quality_gate_future_timestamp():
    gate = DataQualityGate()
    future_date = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    case = {
        "weight_kg": 70.0,
        "egfr": 90.0,
        "condition": "Hypertension",
        "observations_with_dates": [{"name": "Serum Creatinine", "date": future_date}]
    }
    report = gate.evaluate(case)
    assert report.overall_status == "BLOCK"
    assert any("future" in b.lower() for b in report.blocking_reasons)
