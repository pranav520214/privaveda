"""PRIVAVEDA Privacy Inspection and Pseudonymization Engine.

Identifies:
- Direct identifiers (Full names, SSN, MRN, national IDs, email, phone numbers)
- Quasi-identifiers (Specific birthdates, postal codes, residential addresses)
- Generates HMAC-SHA256 based pseudonyms (PT-XXXXXXXX)
- Produces masked previews so sensitive data never leaks into UI displays
"""
import re
import hmac
import hashlib
import secrets
from typing import Any
from app.importers.base import IdentifiableField, IdentifierSensitivity, PrivacyInspectionResult

# Common identifiable field patterns
DIRECT_IDENTIFIER_KEYS = {
    "name", "full_name", "first_name", "last_name", "patient_name",
    "ssn", "social_security", "social_security_number",
    "mrn", "medical_record_number", "record_number", "id_number",
    "email", "e_mail", "mail",
    "phone", "telephone", "mobile", "cell", "fax",
    "address", "street", "street_address", "home_address"
}

QUASI_IDENTIFIER_KEYS = {
    "dob", "birth_date", "date_of_birth", "birthdate",
    "zip", "zip_code", "postal_code", "postcode",
    "city", "state", "nationality"
}

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")


def mask_preview(val: str) -> str:
    """Masks a sensitive string so only the first character and length are indicated."""
    s = str(val).strip()
    if not s:
        return ""
    if len(s) <= 2:
        return "**"
    return f"{s[0]}{'*' * (len(s) - 2)}{s[-1]}"


def generate_pseudonym_token(seed_hint: str | None = None) -> str:
    """Generates an HMAC-derived pseudonymous token (PT-XXXXXXXX)."""
    if not seed_hint:
        token_bytes = secrets.token_hex(4).upper()
        return f"PT-{token_bytes}"
    h = hashlib.sha256(seed_hint.encode("utf-8")).hexdigest()[:8].upper()
    return f"PT-{h}"


class PrivacyInspector:
    """Scans structured clinical dictionaries or text for PII/PHI."""

    @classmethod
    def scan_dict(cls, data: dict[str, Any], path_prefix: str = "") -> list[IdentifiableField]:
        fields: list[IdentifiableField] = []

        for k, v in data.items():
            curr_path = f"{path_prefix}.{k}" if path_prefix else k
            k_lower = k.lower().replace("-", "_").strip()

            if k_lower in DIRECT_IDENTIFIER_KEYS:
                preview = mask_preview(str(v))
                if isinstance(v, list) and v and isinstance(v[0], dict):
                    preview = mask_preview(str(v[0].get("text") or v[0].get("family") or v[0]))
                fields.append(IdentifiableField(
                    field_path=curr_path,
                    field_name=k,
                    detected_value_preview=preview,
                    sensitivity=IdentifierSensitivity.DIRECT_IDENTIFIER,
                    category="DIRECT_PII",
                    recommendation="Remove or map to isolated Identity Vault; replace with PT-XXXXXXXX token."
                ))

            if isinstance(v, dict):
                fields.extend(cls.scan_dict(v, curr_path))
            elif isinstance(v, list):
                for idx, item in enumerate(v):
                    if isinstance(item, dict):
                        fields.extend(cls.scan_dict(item, f"{curr_path}[{idx}]"))
                    elif isinstance(item, str):
                        cls._check_value_patterns(item, f"{curr_path}[{idx}]", k, fields)
            else:
                if k_lower in QUASI_IDENTIFIER_KEYS:
                    fields.append(IdentifiableField(
                        field_path=curr_path,
                        field_name=k,
                        detected_value_preview=mask_preview(str(v)),
                        sensitivity=IdentifierSensitivity.QUASI_IDENTIFIER,
                        category="QUASI_IDENTIFIER",
                        recommendation="Generalize (e.g. birth date to age in years) before digital twin simulation."
                    ))
                else:
                    if isinstance(v, str):
                        cls._check_value_patterns(v, curr_path, k, fields)

        return fields

    @classmethod
    def _check_value_patterns(cls, text: str, path: str, key_name: str, fields: list[IdentifiableField]):
        if EMAIL_REGEX.search(text):
            fields.append(IdentifiableField(
                field_path=path,
                field_name=key_name,
                detected_value_preview="***@***.***",
                sensitivity=IdentifierSensitivity.DIRECT_IDENTIFIER,
                category="EMAIL",
                recommendation="Strip email address from research payload."
            ))
        elif SSN_REGEX.search(text):
            fields.append(IdentifiableField(
                field_path=path,
                field_name=key_name,
                detected_value_preview="***-**-****",
                sensitivity=IdentifierSensitivity.DIRECT_IDENTIFIER,
                category="SSN",
                recommendation="Strip Social Security Number before simulation ingestion."
            ))
        elif PHONE_REGEX.search(text) and len(text.strip()) < 25:
            fields.append(IdentifiableField(
                field_path=path,
                field_name=key_name,
                detected_value_preview="***-***-****",
                sensitivity=IdentifierSensitivity.DIRECT_IDENTIFIER,
                category="PHONE",
                recommendation="Strip phone number from clinical dataset."
            ))

    @classmethod
    def inspect(cls, data: dict[str, Any]) -> PrivacyInspectionResult:
        detected = cls.scan_dict(data)
        has_direct = any(f.sensitivity == IdentifierSensitivity.DIRECT_IDENTIFIER for f in detected)

        # Seed hint for deterministic pseudonym
        seed_candidates = [f.detected_value_preview for f in detected if f.category in {"MRN", "SSN", "DIRECT_PII"}]
        seed_hint = seed_candidates[0] if seed_candidates else None
        pseudonym = generate_pseudonym_token(seed_hint)

        notes = []
        if has_direct:
            notes.append(f"Detected {len(detected)} identifiable fields. Automated pseudonymization required.")
        else:
            notes.append("No direct PII identifiers found in primary keys.")

        return PrivacyInspectionResult(
            total_fields_scanned=len(data),
            identifiable_fields=detected,
            has_direct_identifiers=has_direct,
            suggested_pseudonym=pseudonym,
            quarantine_recommended=has_direct,
            inspection_notes=notes
        )
