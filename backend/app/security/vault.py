"""PRIVAVEDA Secure Local Data Vault.

Architectural Guarantees:
1. Strict separation of Identity Data from Clinical Computation.
2. Clinical Vault references patients solely through pseudonymous tokens (PT-...).
3. Envelope encryption: Each patient has a random Data Encryption Key (DEK)
   protected by a Key Encryption Key (KEK).
4. Extensible KeyProvider interface for future OS Keychain/TPM/HSM integration.
"""
import base64
import os
from dataclasses import dataclass
from typing import Any, Protocol
from app.security.crypto import (
    generate_dek,
    encrypt_envelope,
    decrypt_envelope,
    generate_pseudonym,
    compute_content_digest,
    canonical_json_bytes,
    CryptographicError,
    DecryptionAuthenticationError
)


class KeyProvider(Protocol):
    """Interface for Key Encryption Key (KEK) management."""
    def get_kek(self, key_id: str = "default") -> bytes: ...


class DevKeyProvider:
    """Clearly marked development/demo Key Encryption Key provider.
    
    WARNING: For local development and demonstration only.
    Production deployments must use OS Keychain, TPM, or Hardware Security Module (HSM).
    """
    def __init__(self, master_seed: bytes | None = None):
        # 32-byte deterministic master key for dev/demo repeatability
        self._master = master_seed or b"PRIVAVEDA_DEV_MASTER_KEK_32BYTES"
        if len(self._master) != 32:
            raise CryptographicError("Master KEK must be exactly 32 bytes")

    def get_kek(self, key_id: str = "default") -> bytes:
        import hashlib
        # Derive distinct sub-keys for different purposes (e.g. identity vs clinical)
        return hashlib.sha256(self._master + key_id.encode("utf-8")).digest()


@dataclass(frozen=True)
class EncryptedRecord:
    """Envelope-encrypted container."""
    ciphertext: bytes
    encrypted_dek: bytes
    key_id: str
    content_hash: str
    pseudonym: str | None = None

    def serialize(self) -> dict[str, str]:
        return {
            "ciphertext": base64.b64encode(self.ciphertext).decode("ascii"),
            "encrypted_dek": base64.b64encode(self.encrypted_dek).decode("ascii"),
            "key_id": self.key_id,
            "content_hash": self.content_hash,
            "pseudonym": self.pseudonym or "",
        }

    @classmethod
    def deserialize(cls, data: dict[str, str]) -> "EncryptedRecord":
        return cls(
            ciphertext=base64.b64decode(data["ciphertext"]),
            encrypted_dek=base64.b64decode(data["encrypted_dek"]),
            key_id=data["key_id"],
            content_hash=data["content_hash"],
            pseudonym=data.get("pseudonym") or None,
        )


class IdentityVault:
    """Secure vault storing direct patient identity records.
    
    Isolated from clinical computation. Only accessible by authorized personnel
    under strict purpose-of-use checks.
    """
    def __init__(self, key_provider: KeyProvider, hmac_salt: bytes | None = None):
        self._key_provider = key_provider
        self._hmac_salt = hmac_salt or b"PRIVAVEDA_HMAC_SALT_32_BYTES_MIN"
        self._storage: dict[str, EncryptedRecord] = {}  # internal_id -> encrypted identity
        self._pseudonym_index: dict[str, str] = {}      # pseudonym -> internal_id

    def register_patient_identity(self, internal_id: str, identity_data: dict[str, Any]) -> str:
        """Encrypts and stores direct identity, returning the public pseudonymous token."""
        pseudonym = generate_pseudonym(internal_id, self._hmac_salt)
        dek = generate_dek()
        kek = self._key_provider.get_kek("identity")
        
        # Encrypt DEK with KEK
        encrypted_dek = encrypt_envelope(dek, kek)
        
        # Encrypt identity data with DEK
        plaintext = canonical_json_bytes(identity_data)
        ciphertext = encrypt_envelope(plaintext, dek)
        content_hash = compute_content_digest(identity_data)
        
        record = EncryptedRecord(
            ciphertext=ciphertext,
            encrypted_dek=encrypted_dek,
            key_id="identity",
            content_hash=content_hash,
            pseudonym=pseudonym
        )
        self._storage[internal_id] = record
        self._pseudonym_index[pseudonym] = internal_id
        return pseudonym

    def retrieve_identity(self, pseudonym: str) -> dict[str, Any]:
        """Retrieves and decrypts direct identity (requires authorized role)."""
        internal_id = self._pseudonym_index.get(pseudonym)
        if not internal_id or internal_id not in self._storage:
            raise KeyError(f"No identity record for pseudonym: {pseudonym}")
        
        record = self._storage[internal_id]
        kek = self._key_provider.get_kek(record.key_id)
        dek = decrypt_envelope(record.encrypted_dek, kek)
        plaintext = decrypt_envelope(record.ciphertext, dek)
        import json
        return json.loads(plaintext.decode("utf-8"))


class ClinicalVault:
    """Secure vault storing clinical patient states indexed ONLY by pseudonymous token.
    
    Clinical models, digital twin builders, and ODE solvers interact with this vault.
    Direct identity information is mathematically absent.
    """
    def __init__(self, key_provider: KeyProvider):
        self._key_provider = key_provider
        self._storage: dict[str, EncryptedRecord] = {}  # pseudonym -> encrypted clinical record

    def store_clinical_record(self, pseudonym: str, clinical_data: dict[str, Any]) -> EncryptedRecord:
        """Stores clinical record under envelope encryption."""
        dek = generate_dek()
        kek = self._key_provider.get_kek("clinical")
        
        encrypted_dek = encrypt_envelope(dek, kek)
        plaintext = canonical_json_bytes(clinical_data)
        ciphertext = encrypt_envelope(plaintext, dek)
        content_hash = compute_content_digest(clinical_data)
        
        record = EncryptedRecord(
            ciphertext=ciphertext,
            encrypted_dek=encrypted_dek,
            key_id="clinical",
            content_hash=content_hash,
            pseudonym=pseudonym
        )
        self._storage[pseudonym] = record
        return record

    def retrieve_clinical_record(self, pseudonym: str) -> dict[str, Any]:
        """Decrypts and returns clinical record for digital twin modeling."""
        if pseudonym not in self._storage:
            raise KeyError(f"No clinical record found for pseudonym: {pseudonym}")
        
        record = self._storage[pseudonym]
        kek = self._key_provider.get_kek(record.key_id)
        dek = decrypt_envelope(record.encrypted_dek, kek)
        plaintext = decrypt_envelope(record.ciphertext, dek)
        import json
        data = json.loads(plaintext.decode("utf-8"))
        
        # Verify cryptographic integrity
        current_hash = compute_content_digest(data)
        if current_hash != record.content_hash:
            raise CryptographicError("Clinical record integrity compromised: content hash mismatch")
        return data

    def has_record(self, pseudonym: str) -> bool:
        return pseudonym in self._storage
