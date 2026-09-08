"""PRIVAVEDA Tamper-Evident Cryptographic Audit Chain.

Design:
H_n = SHA-256(canonical_json(event_payload_n) || H_(n-1))
Genesis: H_0 = SHA-256("PRIVAVEDA_AUDIT_GENESIS_CHAIN_V1")

Provides:
- Append-only verifiable sequence.
- Full mathematical detection of dropped, modified, or reordered events.
- Exclusion of sensitive clinical plaintext from audit chain digests.
"""
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from app.security.crypto import canonical_json_bytes

GENESIS_HASH = hashlib.sha256(b"PRIVAVEDA_AUDIT_GENESIS_CHAIN_V1").hexdigest()


@dataclass
class AuditChainEvent:
    event_id: str
    timestamp: str
    actor_pseudonym: str
    action: str
    resource_pseudonym: str
    result: str  # "SUCCESS", "DENIED", "BLOCKED", "ERROR"
    reason: str
    previous_event_hash: str
    event_hash: str
    metadata: dict[str, Any] = field(default_factory=dict)

    def payload_for_hashing(self) -> dict[str, Any]:
        """Returns the canonical event dict excluded of the event_hash itself."""
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "actor_pseudonym": self.actor_pseudonym,
            "action": self.action,
            "resource_pseudonym": self.resource_pseudonym,
            "result": self.result,
            "reason": self.reason,
            "previous_event_hash": self.previous_event_hash,
            "metadata": self.metadata
        }


def compute_event_hash(payload: dict[str, Any], previous_hash: str) -> str:
    """Computes H_n = SHA-256(canonical_json(payload) || previous_hash)."""
    serialized = canonical_json_bytes(payload)
    hasher = hashlib.sha256()
    hasher.update(serialized)
    hasher.update(previous_hash.encode("utf-8"))
    return hasher.hexdigest()


class AuditChain:
    """In-memory or persistent cryptographic audit chain."""

    def __init__(self, initial_history: list[AuditChainEvent] | None = None):
        self._events: list[AuditChainEvent] = []
        if initial_history:
            for event in initial_history:
                self.append_existing(event)

    @property
    def latest_hash(self) -> str:
        return self._events[-1].event_hash if self._events else GENESIS_HASH

    @property
    def events(self) -> list[AuditChainEvent]:
        return list(self._events)

    def append_event(
        self,
        action: str,
        actor_pseudonym: str = "SYSTEM",
        resource_pseudonym: str = "SYSTEM",
        result: str = "SUCCESS",
        reason: str = "",
        metadata: dict[str, Any] | None = None,
        event_id: str | None = None,
        timestamp: str | None = None
    ) -> AuditChainEvent:
        """Appends a new event and returns it with its cryptographic hash."""
        e_id = event_id or str(uuid4())
        ts = timestamp or datetime.now(timezone.utc).isoformat()
        prev_hash = self.latest_hash
        meta = metadata or {}

        payload = {
            "event_id": e_id,
            "timestamp": ts,
            "actor_pseudonym": actor_pseudonym,
            "action": action,
            "resource_pseudonym": resource_pseudonym,
            "result": result,
            "reason": reason,
            "previous_event_hash": prev_hash,
            "metadata": meta
        }
        h_n = compute_event_hash(payload, prev_hash)

        event = AuditChainEvent(
            event_id=e_id,
            timestamp=ts,
            actor_pseudonym=actor_pseudonym,
            action=action,
            resource_pseudonym=resource_pseudonym,
            result=result,
            reason=reason,
            previous_event_hash=prev_hash,
            event_hash=h_n,
            metadata=meta
        )
        self._events.append(event)
        return event

    def append_existing(self, event: AuditChainEvent) -> None:
        """Validates and appends an existing persisted event."""
        expected_prev = self.latest_hash
        if event.previous_event_hash != expected_prev:
            raise ValueError(f"Audit chain break at {event.event_id}: previous hash mismatch")
        
        computed = compute_event_hash(event.payload_for_hashing(), event.previous_event_hash)
        if computed != event.event_hash:
            raise ValueError(f"Audit event {event.event_id} has invalid cryptographic hash (tampered)")
        self._events.append(event)

    def verify_integrity(self) -> tuple[bool, str | None]:
        """Verifies the entire chain from genesis to tip.
        
        Returns: (True, None) if intact, (False, error_message) if tampered.
        """
        expected_prev = GENESIS_HASH
        for i, event in enumerate(self._events):
            if event.previous_event_hash != expected_prev:
                return False, f"Broken link at index {i} (event {event.event_id}): expected prev {expected_prev}, got {event.previous_event_hash}"
            
            recomputed = compute_event_hash(event.payload_for_hashing(), event.previous_event_hash)
            if recomputed != event.event_hash:
                return False, f"Tampering detected at index {i} (event {event.event_id}): recomputed {recomputed} != recorded {event.event_hash}"
            
            expected_prev = event.event_hash
        return True, None
