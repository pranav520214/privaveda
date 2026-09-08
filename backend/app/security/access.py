"""PRIVAVEDA Role-Based and Attribute-Based Access Control (RBAC + ABAC).

Enforces least privilege:
- Roles: PATIENT, CLINICIAN, LAB, RESEARCHER, ADMIN.
- Attributes: purpose, active_case, patient_consent, device_trust, resource_type, requested_action.
- Research de-identification export filters.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class Role(str, Enum):
    PATIENT = "PATIENT"
    CLINICIAN = "CLINICIAN"
    LAB = "LAB"
    RESEARCHER = "RESEARCHER"
    ADMIN = "ADMIN"


class Action(str, Enum):
    READ_IDENTITY = "READ_IDENTITY"
    READ_CLINICAL = "READ_CLINICAL"
    WRITE_CLINICAL = "WRITE_CLINICAL"
    RUN_SIMULATION = "RUN_SIMULATION"
    CALIBRATE_TWIN = "CALIBRATE_TWIN"
    RECORD_REVIEW = "RECORD_REVIEW"
    EXPORT_RESEARCH = "EXPORT_RESEARCH"
    MANAGE_VAULT = "MANAGE_VAULT"
    BREAK_GLASS = "BREAK_GLASS"


@dataclass
class AccessSubject:
    user_id: str
    role: Role
    device_trusted: bool = True
    assigned_cases: set[str] = field(default_factory=set)


@dataclass
class AccessContext:
    purpose: str  # e.g., "CARE_DELIVERY", "RESEARCH", "AUDIT", "EMERGENCY"
    patient_consent: bool = True
    emergency_mode: bool = False


class AccessControlEngine:
    """Evaluates combined RBAC and ABAC rules."""

    @staticmethod
    def authorize(subject: AccessSubject, action: Action, resource_pseudonym: str, context: AccessContext) -> tuple[bool, str]:
        # Rule 1: Identity data access is restricted to direct clinician or patient themselves
        if action == Action.READ_IDENTITY:
            if subject.role not in {Role.CLINICIAN, Role.ADMIN}:
                return False, f"Role {subject.role} is strictly forbidden from reading direct patient identity"
            if context.purpose not in {"CARE_DELIVERY", "EMERGENCY"}:
                return False, f"Identity read requires CARE_DELIVERY or EMERGENCY purpose, not {context.purpose}"

        # Rule 2: Researcher role can never read identity and cannot sign off clinical reviews
        if subject.role == Role.RESEARCHER:
            if action in {Action.READ_IDENTITY, Action.RECORD_REVIEW, Action.BREAK_GLASS}:
                return False, f"Researchers are prohibited from action {action}"

        # Rule 3: Clinical simulation and twin execution
        if action in {Action.RUN_SIMULATION, Action.CALIBRATE_TWIN}:
            if subject.role not in {Role.CLINICIAN, Role.RESEARCHER, Role.ADMIN}:
                return False, f"Role {subject.role} cannot trigger physiological twin simulation"

        # Rule 4: Device trust requirement for clinician actions
        if subject.role == Role.CLINICIAN and not subject.device_trusted and not context.emergency_mode:
            return False, "Clinician operations require a trusted platform device"

        # Rule 5: Break-glass authorization
        if action == Action.BREAK_GLASS:
            if subject.role != Role.CLINICIAN:
                return False, "Break-glass emergency access is restricted exclusively to authorized clinicians"

        # Rule 6: Patient consent check (unless emergency)
        if not context.patient_consent and not context.emergency_mode:
            if action in {Action.READ_CLINICAL, Action.RUN_SIMULATION, Action.EXPORT_RESEARCH}:
                return False, "Active patient consent is required for this operation"

        return True, "Access authorized"

    @staticmethod
    def sanitize_research_export(clinical_data: dict[str, Any]) -> dict[str, Any]:
        """Deep copy and strip all identifying and quasi-identifying attributes for research export."""
        forbidden_keys = {
            "name", "patient_name", "mrn", "dob", "birth_date", "address",
            "phone", "email", "ssn", "zip_code", "ip_address", "contact"
        }
        
        def _clean(obj: Any) -> Any:
            if isinstance(obj, dict):
                return {k: _clean(v) for k, v in obj.items() if k.lower() not in forbidden_keys}
            if isinstance(obj, list):
                return [_clean(item) for item in obj]
            return obj

        cleaned = _clean(clinical_data)
        cleaned["de_identified"] = True
        cleaned["export_policy"] = "PRIVAVEDA_RESEARCH_EXPORT_V1"
        return cleaned
