"""PRIVAVEDA Cryptographic Primitives & Envelope Encryption.

Target Design:
1. AES-256-GCM authenticated encryption (NIST SP 800-38D standard).
2. Per-patient random 256-bit Data Encryption Key (DEK).
3. Envelope encryption: DEK wrapped by Key Encryption Key (KEK).
4. HMAC-SHA256 for non-invertible salted pseudonymous patient tokens.
5. Canonical JSON serialization for tamper-evident cryptographic digests.
"""
import base64
import hashlib
import hmac
import json
import os
from typing import Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id


class CryptographicError(Exception):
    """Base exception for cryptographic operations."""
    pass


class DecryptionAuthenticationError(CryptographicError):
    """Raised when ciphertext integrity check fails (wrong key or altered ciphertext)."""
    pass


def generate_dek() -> bytes:
    """Generates a random 256-bit Data Encryption Key (DEK)."""
    return AESGCM.generate_key(bit_length=256)


def derive_kek_argon2id(passphrase: str, salt: bytes) -> bytes:
    """Derives a 256-bit Key Encryption Key (KEK) from a passphrase using Argon2id."""
    if len(salt) < 16:
        raise CryptographicError("Argon2id salt must be at least 16 bytes")
    kdf = Argon2id(
        salt=salt,
        length=32,
        iterations=3,
        lanes=4,
        memory_cost=65536,  # 64 MiB
    )
    return kdf.derive(passphrase.encode("utf-8"))


def encrypt_envelope(plaintext: bytes | str, key: bytes, associated_data: bytes | None = None) -> bytes:
    """Encrypts plaintext with AES-256-GCM.
    
    Structure: nonce (12 bytes) + ciphertext_with_tag (variable).
    """
    if isinstance(plaintext, str):
        plaintext = plaintext.encode("utf-8")
    if len(key) != 32:
        raise CryptographicError("AES-256 requires a 32-byte (256-bit) key")
    
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    try:
        ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)
    except Exception as exc:
        raise CryptographicError(f"Encryption failed: {exc}") from exc
    return nonce + ciphertext


def decrypt_envelope(payload: bytes, key: bytes, associated_data: bytes | None = None) -> bytes:
    """Decrypts AES-256-GCM payload with authenticated tag verification.
    
    Raises DecryptionAuthenticationError if the ciphertext was tampered with or key is wrong.
    """
    if len(key) != 32:
        raise CryptographicError("AES-256 requires a 32-byte (256-bit) key")
    if len(payload) < 28:  # 12-byte nonce + 16-byte tag minimum
        raise DecryptionAuthenticationError("Payload too short to contain valid nonce and authentication tag")
    
    nonce = payload[:12]
    ciphertext = payload[12:]
    aesgcm = AESGCM(key)
    try:
        plaintext = aesgcm.decrypt(nonce, ciphertext, associated_data)
        return plaintext
    except Exception as exc:
        raise DecryptionAuthenticationError("Decryption/Authentication failed: corrupted ciphertext or invalid key") from exc


def generate_pseudonym(identity_token: str, hmac_key: bytes) -> str:
    """Derives a salted pseudonymous patient identifier using HMAC-SHA256.
    
    Never uses a plain unsalted hash of predictable identifiers.
    Returns: 'PT-<16-hex-chars>'
    """
    if len(hmac_key) < 16:
        raise CryptographicError("HMAC salt key must be at least 16 bytes")
    mac = hmac.new(hmac_key, identity_token.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"PT-{mac[:16].upper()}"


def canonical_json_bytes(data: Any) -> bytes:
    """Serializes data into canonical JSON (sorted keys, compact separators)."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")


def compute_content_digest(data: Any) -> str:
    """Computes SHA-256 content digest over canonicalized JSON representation."""
    return hashlib.sha256(canonical_json_bytes(data)).hexdigest()
