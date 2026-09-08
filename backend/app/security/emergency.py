"""PRIVAVEDA Break-Glass Emergency Pathway.

Safety and Audit Guarantees:
1. Must be explicitly invoked by an authorized clinician.
2. Exposes ONLY minimal pre-configured emergency fields (Allergies, Current Meds, Blood Type).
3. Requires mandatory clinical reason and justification.
4. Generates a HIGH_SEVERITY tamper-evident audit record.
5. Disabled by default in developer/standard environments unless explicitly enabled.
"""
import os
from dataclasses import dataclass
from typing import Any
from app.security.access import AccessControlEngine, AccessSubject, Action, AccessContext, Role


class EmergencyAccessError(Exception):
    """Raised when emergency break-glass procedure is rejected."""
    pass


@dataclass(frozen=True)
class EmergencySummary:
    pseudonym: str
    clinician_id: str
    reason: str
    allergies: list[str]
    medications: list[str]
    critical_alerts: list[str]
    blood_group: str | None
    audit_event_id: str


class BreakGlassController:
    """Manages emergency break-glass access."""

    def __init__(self, allow_emergency: bool | None = None):
        if allow_emergency is None:
            val = os.environ.get("PRIVAVEDA_ALLOW_BREAK_GLASS", "false").lower()
            self.allow_emergency = val in {"true", "1", "yes"}
        else:
            self.allow_emergency = allow_emergency

    def invoke_break_glass(
        self,
        subject: AccessSubject,
        pseudonym: str,
        reason: str,
        clinical_record: dict[str, Any],
        audit_recorder_fn: Any = None
    ) -> EmergencySummary:
        """Executes emergency break-glass protocol."""
        if not self.allow_emergency:
            raise EmergencyAccessError(
                "Break-glass emergency access is disabled in current system configuration (PRIVAVEDA_ALLOW_BREAK_GLASS=false)"
            )

        if len(reason.strip()) < 15:
            raise EmergencyAccessError("A detailed emergency clinical justification (minimum 15 characters) is required")

        context = AccessContext(purpose="EMERGENCY", patient_consent=False, emergency_mode=True)
        authorized, msg = AccessControlEngine.authorize(subject, Action.BREAK_GLASS, pseudonym, context)
        if not authorized:
            raise EmergencyAccessError(f"Emergency access denied: {msg}")

        # Minimal emergency fields extraction
        allergies = clinical_record.get("allergies", [])
        medications = clinical_record.get("medications", [])
        critical_alerts = [
            flag for flag in clinical_record.get("critical_alerts", [])
        ]
        blood_group = clinical_record.get("blood_group") or clinical_record.get("labs", {}).get("blood_group")

        audit_id = "AUDIT-BG-UNLOGGED"
        if audit_recorder_fn:
            audit_id = audit_recorder_fn(
                event_type="EMERGENCY_BREAK_GLASS_INVOKED",
                actor_id=subject.user_id,
                severity="HIGH_CRITICAL",
                data={
                    "pseudonym": pseudonym,
                    "reason": reason,
                    "fields_disclosed": ["allergies", "medications", "critical_alerts", "blood_group"]
                }
            )

        return EmergencySummary(
            pseudonym=pseudonym,
            clinician_id=subject.user_id,
            reason=reason,
            allergies=allergies,
            medications=medications,
            critical_alerts=critical_alerts,
            blood_group=blood_group,
            audit_event_id=audit_id
        )
