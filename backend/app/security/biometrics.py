"""PRIVAVEDA Platform & Hardware Authentication Abstraction.

CRITICAL SECURITY POLICY:
"Biometric verification is delegated to platform/hardware security;
PRIVAVEDA does not store raw fingerprints, iris scans, or face images."

No home-grown computer vision, facial recognition, or iris pattern matching is implemented.
Instead, PRIVAVEDA models platform hardware authenticator handoffs (e.g. Windows Hello,
TouchID, FIDO2/WebAuthn passkeys).
"""
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class HardwareAuthResult:
    authenticated: bool
    authenticator_type: str  # e.g. "PLATFORM_FIDO2", "WINDOWS_HELLO", "TPM_ENCLAVE", "DEMO_MOCK"
    credential_id: str
    hardware_backed: bool
    error_message: str | None = None


class HardwareSecurityProvider(Protocol):
    """Protocol for interacting with platform hardware authenticators."""
    def verify_platform_credential(self, user_id: str, challenge: bytes) -> HardwareAuthResult: ...
    def unlock_vault_key(self, credential_id: str, key_tag: str) -> bytes: ...


class MockPlatformAuthenticator:
    """Mock platform hardware authenticator for demonstration and testing.
    
    Explicitly labeled as DEMO_MOCK. Does NOT pretend to be production biometric security.
    """
    def __init__(self, simulate_pass: bool = True):
        self.simulate_pass = simulate_pass

    def verify_platform_credential(self, user_id: str, challenge: bytes) -> HardwareAuthResult:
        if self.simulate_pass:
            return HardwareAuthResult(
                authenticated=True,
                authenticator_type="DEMO_MOCK_PLATFORM_AUTH",
                credential_id=f"cred-mock-{user_id[:8]}",
                hardware_backed=False,
                error_message=None
            )
        return HardwareAuthResult(
            authenticated=False,
            authenticator_type="DEMO_MOCK_PLATFORM_AUTH",
            credential_id="",
            hardware_backed=False,
            error_message="User biometric or pin authentication rejected by simulated platform"
        )
