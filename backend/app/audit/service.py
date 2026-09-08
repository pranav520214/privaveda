import hashlib
import json
from app.models import AuditEvent, now


def digest(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()


def record(db, event_type: str, actor_id=None, analysis_id=None, **data):
    timestamp = now()
    event = AuditEvent(event_type=event_type, actor_id=actor_id, analysis_id=analysis_id, data=data,
                       created_at=timestamp, event_hash=digest({"type": event_type, "actor": actor_id, "analysis": analysis_id, "at": timestamp.isoformat(), "data": data}))
    db.add(event)
    return event
