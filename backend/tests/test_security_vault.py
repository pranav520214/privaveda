"""Unit and Security Tests for PRIVAVEDA Cryptography, Vaults, Access, and Audit Chain."""
import pytest
from app.security.crypto import (
    generate_dek,
    encrypt_envelope,
    decrypt_envelope,
    generate_pseudonym,
    compute_content_digest,
    DecryptionAuthenticationError,
    CryptographicError
)
from app.security.vault import IdentityVault, ClinicalVault, DevKeyProvider
from app.security.audit_chain import AuditChain, AuditChainEvent
from app.security.access import AccessControlEngine, AccessSubject, AccessContext, Role, Action
from app.security.emergency import BreakGlassController, EmergencyAccessError


def test_aes_gcm_roundtrip():
    dek = generate_dek()
    plaintext = b"Patient plasma concentration measurement: 4.8 mg/L"
    ciphertext = encrypt_envelope(plaintext, dek)
    assert ciphertext != plaintext
    decrypted = decrypt_envelope(ciphertext, dek)
    assert decrypted == plaintext


def test_aes_gcm_wrong_key_fails():
    key1 = generate_dek()
    key2 = generate_dek()
    ciphertext = encrypt_envelope(b"Sensitive clinical genomic observation", key1)
    with pytest.raises(DecryptionAuthenticationError):
        decrypt_envelope(ciphertext, key2)


def test_aes_gcm_tampered_ciphertext_fails():
    dek = generate_dek()
    ciphertext = bytearray(encrypt_envelope(b"Simulated dose intervention", dek))
    # Flip one byte in the middle of ciphertext
    ciphertext[18] ^= 0xFF
    with pytest.raises(DecryptionAuthenticationError):
        decrypt_envelope(bytes(ciphertext), dek)


def test_pseudonym_hmac_derivation():
    salt = b"test_salt_at_least_16_bytes_long"
    pt1 = generate_pseudonym("PATIENT-MRN-12345", salt)
    pt2 = generate_pseudonym("PATIENT-MRN-12345", salt)
    pt_diff = generate_pseudonym("PATIENT-MRN-99999", salt)
    
    assert pt1.startswith("PT-")
    assert pt1 == pt2  # Deterministic for same patient + salt
    assert pt1 != pt_diff  # Distinct for different patient


def test_vault_identity_and_clinical_separation():
    key_prov = DevKeyProvider()
    id_vault = IdentityVault(key_prov)
    clinical_vault = ClinicalVault(key_prov)

    identity_data = {"name": "Jane Doe", "dob": "1980-01-01", "ssn": "000-00-0000"}
    clinical_data = {"weight_kg": 65.0, "egfr": 90.0, "condition": "Hypertension"}

    # Register identity and obtain pseudonym
    pseudonym = id_vault.register_patient_identity("PAT-INTERNAL-01", identity_data)
    assert pseudonym.startswith("PT-")

    # Store clinical record strictly under pseudonym
    clinical_vault.store_clinical_record(pseudonym, clinical_data)

    # Decrypt clinical record: contains clinical parameters, zero direct identity
    retrieved_clinical = clinical_vault.retrieve_clinical_record(pseudonym)
    assert retrieved_clinical["weight_kg"] == 65.0
    assert "name" not in retrieved_clinical
    assert "ssn" not in retrieved_clinical

    # Decrypt identity record: contains identity
    retrieved_id = id_vault.retrieve_identity(pseudonym)
    assert retrieved_id["name"] == "Jane Doe"


def test_tamper_evident_audit_chain_verification():
    chain = AuditChain()
    chain.append_event(action="USER_LOGIN", actor_pseudonym="CLIN-01")
    chain.append_event(action="TWIN_CREATED", actor_pseudonym="CLIN-01", resource_pseudonym="PT-001")
    chain.append_event(action="SIMULATION_RUN", actor_pseudonym="CLIN-01", resource_pseudonym="SIM-001")

    # Clean chain verifies
    intact, err = chain.verify_integrity()
    assert intact is True
    assert err is None


def test_tamper_evident_audit_chain_tampering_detected():
    chain = AuditChain()
    chain.append_event(action="USER_LOGIN", actor_pseudonym="CLIN-01")
    ev2 = chain.append_event(action="TWIN_CREATED", actor_pseudonym="CLIN-01", resource_pseudonym="PT-001")
    chain.append_event(action="SIMULATION_RUN", actor_pseudonym="CLIN-01", resource_pseudonym="SIM-001")

    # Deliberately modify an earlier event's action
    chain._events[1].action = "MALICIOUS_UNAUTHORIZED_CHANGE"

    # Integrity verification must fail
    intact, err = chain.verify_integrity()
    assert intact is False
    assert "Tampering detected" in str(err)


def test_rbac_abac_researcher_restrictions():
    researcher = AccessSubject(user_id="res-01", role=Role.RESEARCHER)
    clinician = AccessSubject(user_id="clin-01", role=Role.CLINICIAN)
    context = AccessContext(purpose="RESEARCH", patient_consent=True)

    # Researcher cannot read direct identity
    auth_res, _ = AccessControlEngine.authorize(researcher, Action.READ_IDENTITY, "PT-01", context)
    assert auth_res is False

    # Researcher cannot record clinical reviews
    auth_rev, _ = AccessControlEngine.authorize(researcher, Action.RECORD_REVIEW, "PT-01", context)
    assert auth_rev is False

    # Clinician with care delivery purpose can read identity
    care_context = AccessContext(purpose="CARE_DELIVERY", patient_consent=True)
    auth_clin, _ = AccessControlEngine.authorize(clinician, Action.READ_IDENTITY, "PT-01", care_context)
    assert auth_clin is True


def test_research_export_de_identification():
    raw_record = {
        "name": "John Smith",
        "mrn": "MRN-5544",
        "email": "john@example.com",
        "weight_kg": 75.0,
        "egfr": 105.0,
        "genomics": {"CYP2D6": "*1/*1", "patient_name": "John"}
    }
    sanitized = AccessControlEngine.sanitize_research_export(raw_record)
    assert "name" not in sanitized
    assert "mrn" not in sanitized
    assert "email" not in sanitized
    assert sanitized["weight_kg"] == 75.0
    assert sanitized["egfr"] == 105.0
    assert sanitized["de_identified"] is True


def test_break_glass_emergency():
    controller = BreakGlassController(allow_emergency=True)
    clinician = AccessSubject(user_id="dr-urgent", role=Role.CLINICIAN)
    clinical_rec = {
        "allergies": ["Penicillin anaphylaxis"],
        "medications": ["Amiodarone 200mg"],
        "blood_group": "O-negative",
        "critical_alerts": ["Prolonged QT risk"]
    }

    summary = controller.invoke_break_glass(
        subject=clinician,
        pseudonym="PT-EMERG-99",
        reason="Acute cardiogenic shock and cardiac arrest in resuscitation bay",
        clinical_record=clinical_rec
    )

    assert summary.clinician_id == "dr-urgent"
    assert "Penicillin anaphylaxis" in summary.allergies
    assert summary.blood_group == "O-negative"

    # Must reject if justification is too brief
    with pytest.raises(EmergencyAccessError):
        controller.invoke_break_glass(
            subject=clinician,
            pseudonym="PT-EMERG-99",
            reason="short",
            clinical_record=clinical_rec
        )
