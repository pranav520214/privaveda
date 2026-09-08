"""Offline and Network Egress Guard Tests for PRIVAVEDA."""
import pytest
import socket
from app.core.offline import enforce_network_isolation, NetworkEgressBlockedError, check_offline_readiness


def test_offline_readiness_report():
    readiness = check_offline_readiness()
    assert readiness["local_storage_available"] is True
    assert readiness["telemetry_disabled"] is True
    assert "No clinical" in readiness["disclaimer"]


def test_network_egress_blocking():
    with enforce_network_isolation():
        # Outbound connection to external host must be blocked
        with pytest.raises(NetworkEgressBlockedError):
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.connect(("8.8.8.8", 53))


def test_loopback_allowed_during_offline_mode():
    with enforce_network_isolation():
        # Loopback connection attempt should not raise NetworkEgressBlockedError
        # (may raise ConnectionRefusedError if no listener on that port, which is normal socket behavior)
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.connect(("127.0.0.1", 65432))
        except ConnectionRefusedError:
            pass  # Normal loopback refusal
        except NetworkEgressBlockedError:
            pytest.fail("Loopback 127.0.0.1 should not trigger NetworkEgressBlockedError")
