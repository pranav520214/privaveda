"""PRIVAVEDA Clinical Data Importer Base Abstractions.

Defines:
- ClinicalDataImporter base class
- IdentifiableField detection models
- PrivacyInspectionResult
- ImportResult with data quality tags and pseudonymized patient tokens
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


class IdentifierSensitivity(str, Enum):
    DIRECT_IDENTIFIER = "DIRECT_IDENTIFIER"  # Name, SSN, MRN, phone, email
    QUASI_IDENTIFIER = "QUASI_IDENTIFIER"    # Age, ZIP, exact birth date, address
    CLINICAL_DATA = "CLINICAL_DATA"          # Lab values, diagnoses, medications


@dataclass
class IdentifiableField:
    field_path: str
    field_name: str
    detected_value_preview: str  # Masked preview (e.g. "J*** D**")
    sensitivity: IdentifierSensitivity
    category: str  # "NAME", "PHONE", "EMAIL", "MRN", "ADDRESS", "DATE_OF_BIRTH"
    recommendation: str


@dataclass
class PrivacyInspectionResult:
    total_fields_scanned: int
    identifiable_fields: list[IdentifiableField]
    has_direct_identifiers: bool
    suggested_pseudonym: str  # e.g. "PT-A1B2C3D4"
    quarantine_recommended: bool
    inspection_notes: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_fields_scanned": self.total_fields_scanned,
            "identifiable_fields": [
                {
                    "field_path": f.field_path,
                    "field_name": f.field_name,
                    "preview": f.detected_value_preview,
                    "sensitivity": f.sensitivity.value,
                    "category": f.category,
                    "recommendation": f.recommendation,
                }
                for f in self.identifiable_fields
            ],
            "has_direct_identifiers": self.has_direct_identifiers,
            "suggested_pseudonym": self.suggested_pseudonym,
            "quarantine_recommended": self.quarantine_recommended,
            "inspection_notes": self.inspection_notes,
        }


@dataclass
class ImportResult:
    success: bool
    patient_token: str
    raw_record_count: int
    extracted_entities: dict[str, Any]  # "demographics", "labs", "medications", "conditions", "genomics"
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    mode: str = "RESEARCH"
    synthetic: bool = False
    provenance_source: str = "UNKNOWN_IMPORTER"

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "patient_token": self.patient_token,
            "raw_record_count": self.raw_record_count,
            "extracted_entities": self.extracted_entities,
            "warnings": self.warnings,
            "errors": self.errors,
            "mode": self.mode,
            "synthetic": self.synthetic,
            "provenance_source": self.provenance_source,
        }


class ClinicalDataImporter(ABC):
    """Abstract base class for modular clinical data ingestion."""

    @abstractmethod
    def inspect_privacy(self, raw_content: str | bytes) -> PrivacyInspectionResult:
        """Inspects raw payload for PII and returns privacy risk inventory without persisting."""
        pass

    @abstractmethod
    def parse_and_normalize(self, raw_content: str | bytes, confirmed_pseudonym: str) -> ImportResult:
        """Parses, validates, pseudonymizes, and normalizes into PRIVAVEDA patient state."""
        pass
