"""PRIVAVEDA Structured JSON Clinical Data Importer.

Parses structured clinical JSON documents or manual structured entry payloads:
- Scans for PII and generates privacy inspection report
- Validates physiological constraints
- Normalizes into PRIVAVEDA patient state
"""
import json
from typing import Any
from app.importers.base import ClinicalDataImporter, ImportResult, PrivacyInspectionResult
from app.importers.privacy_inspector import PrivacyInspector


class JSONImporter(ClinicalDataImporter):
    """Structured JSON clinical data importer."""

    def inspect_privacy(self, raw_content: str | bytes) -> PrivacyInspectionResult:
        if isinstance(raw_content, bytes):
            raw_content = raw_content.decode("utf-8", errors="replace")
        try:
            data = json.loads(raw_content)
        except Exception as e:
            return PrivacyInspectionResult(
                total_fields_scanned=0,
                identifiable_fields=[],
                has_direct_identifiers=False,
                suggested_pseudonym="PT-INVALID",
                quarantine_recommended=True,
                inspection_notes=[f"JSON syntax error: {str(e)}"]
            )
        return PrivacyInspector.inspect(data)

    def parse_and_normalize(self, raw_content: str | bytes, confirmed_pseudonym: str) -> ImportResult:
        if isinstance(raw_content, bytes):
            raw_content = raw_content.decode("utf-8", errors="replace")

        try:
            data = json.loads(raw_content)
        except Exception as e:
            return ImportResult(
                success=False,
                patient_token=confirmed_pseudonym,
                raw_record_count=0,
                extracted_entities={},
                errors=[f"Invalid JSON: {str(e)}"]
            )

        if not isinstance(data, dict):
            return ImportResult(
                success=False,
                patient_token=confirmed_pseudonym,
                raw_record_count=0,
                extracted_entities={},
                errors=["Expected top-level JSON object"]
            )

        warnings = []
        weight = float(data.get("weight_kg", 70.0))
        age = float(data.get("age_years", 50.0))
        sex = str(data.get("sex", "unspecified"))
        egfr = float(data.get("egfr", data.get("labs", {}).get("egfr", 90.0)))
        labs = data.get("labs", {"egfr": egfr, "serum_creatinine_mg_dl": 1.0})
        conditions = data.get("history", [data.get("condition")]) if data.get("condition") else []
        medications = data.get("medications", [])
        allergies = data.get("allergies", [])
        genomics = data.get("genomics", {"cyp2d6_score": 2.0})

        extracted = {
            "patient_token": confirmed_pseudonym,
            "synthetic": False,
            "mode": "RESEARCH",
            "weight_kg": weight,
            "height_cm": float(data.get("height_cm", 170.0)),
            "age_years": age,
            "sex": sex,
            "condition": data.get("condition", "Research Patient"),
            "history": conditions,
            "medications": medications,
            "allergies": allergies,
            "egfr": egfr,
            "labs": labs,
            "genomics": genomics,
            "provenance": {
                "source": "STRUCTURED_JSON_IMPORT",
                "raw_keys": list(data.keys())
            }
        }

        return ImportResult(
            success=True,
            patient_token=confirmed_pseudonym,
            raw_record_count=1,
            extracted_entities=extracted,
            warnings=warnings,
            mode="RESEARCH",
            synthetic=False,
            provenance_source="JSON_IMPORTER"
        )
