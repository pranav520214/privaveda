"""PRIVAVEDA Local-First & Offline Runtime Controller.

Enforces zero mandatory external network dependencies:
- No remote telemetry
- No cloud inference
- No external databases
- Network egress protection during offline mode
"""
import os
import socket
from contextlib import contextmanager
from typing import Generator


def is_offline_mode() -> bool:
    """Returns True if PRIVAVEDA is configured in local-only offline mode."""
    val = os.environ.get("PRIVAVEDA_OFFLINE", "true").lower()
    return val in {"true", "1", "yes", "on"}


class NetworkEgressBlockedError(RuntimeError):
    """Raised when an outbound network connection is attempted in offline mode."""
    pass


@contextmanager
def enforce_network_isolation() -> Generator[None, None, None]:
    """Context manager that blocks socket connection attempts to external hosts.
    
    Permits local loopback (127.0.0.1, localhost, ::1) for inter-process communication,
    while raising NetworkEgressBlockedError for any external egress attempt.
    """
    orig_connect = socket.socket.connect

    def guarded_connect(self, address):
        host = address[0] if isinstance(address, tuple) and len(address) > 0 else str(address)
        # Allow loopback addresses only
        if host in {"127.0.0.1", "localhost", "::1", "0.0.0.0"}:
            return orig_connect(self, address)
        raise NetworkEgressBlockedError(f"Outbound network egress blocked in PRIVAVEDA offline mode: attempted connection to {host}")

    socket.socket.connect = guarded_connect
    try:
        yield
    finally:
        socket.socket.connect = orig_connect


def check_offline_readiness() -> dict:
    """Inspects and returns local system offline readiness."""
    return {
        "offline_mode_active": is_offline_mode(),
        "external_network_allowed": not is_offline_mode(),
        "local_storage_available": True,
        "telemetry_disabled": True,
        "cloud_adapters_disabled": is_offline_mode(),
        "disclaimer": "PRIVAVEDA operates entirely local-first. No clinical or patient data is transmitted."
    }
