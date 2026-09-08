from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, Integer, event
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base


def now() -> datetime:
    return datetime.now(timezone.utc)


class Record:
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    source: Mapped[str] = mapped_column(Text, default="synthetic-demo-v1")
    validation_status: Mapped[str] = mapped_column(String(40), default="SYNTHETIC_DEMO")


class User(Record, Base):
    __tablename__ = "users"
    username: Mapped[str] = mapped_column(String(100), unique=True)
    password_hash: Mapped[str] = mapped_column(Text)
    role: Mapped[str] = mapped_column(String(20))


class ClinicianProfile(Record, Base):
    __tablename__ = "clinician_profiles"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    display_name: Mapped[str] = mapped_column(String(100))


class AuthSession(Record, Base):
    __tablename__ = "auth_sessions"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class PatientCase(Record, Base):
    __tablename__ = "patient_cases"
    label: Mapped[str] = mapped_column(String(80))
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    revision: Mapped[int] = mapped_column(Integer, default=1)
    data: Mapped[dict] = mapped_column(JSON)


class Observation(Record):
    case_id: Mapped[str] = mapped_column(ForeignKey("patient_cases.id"), index=True)
    data: Mapped[dict] = mapped_column(JSON)


class ClinicalObservation(Observation, Base):
    __tablename__ = "clinical_observations"


class GenomicObservation(Observation, Base):
    __tablename__ = "genomic_observations"


class LabObservation(Observation, Base):
    __tablename__ = "lab_observations"


class MedicationRecord(Observation, Base):
    __tablename__ = "medication_records"


class Therapy(Record, Base):
    __tablename__ = "therapies"
    name: Mapped[str] = mapped_column(String(100), unique=True)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    data: Mapped[dict] = mapped_column(JSON)


class LibraryChild(Record):
    therapy_id: Mapped[str] = mapped_column(ForeignKey("therapies.id"), index=True)
    data: Mapped[dict] = mapped_column(JSON)


class TherapyEvidence(LibraryChild, Base):
    __tablename__ = "therapy_evidence"


class ContraindicationRule(LibraryChild, Base):
    __tablename__ = "contraindication_rules"


class InteractionRule(LibraryChild, Base):
    __tablename__ = "interaction_rules"


class GenomicRule(LibraryChild, Base):
    __tablename__ = "genomic_rules"


class AnalysisRun(Record, Base):
    __tablename__ = "analysis_runs"
    case_id: Mapped[str] = mapped_column(ForeignKey("patient_cases.id"), index=True)
    actor_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    input_snapshot: Mapped[dict] = mapped_column(JSON)
    library_snapshot: Mapped[list] = mapped_column(JSON)
    configuration: Mapped[dict] = mapped_column(JSON)
    input_hash: Mapped[str] = mapped_column(String(64))
    configuration_hash: Mapped[str] = mapped_column(String(64))
    analysis_engine_version: Mapped[str] = mapped_column(String(60))
    ruleset_version: Mapped[str] = mapped_column(String(80))
    therapy_library_version: Mapped[str] = mapped_column(String(80))
    explanation_provider: Mapped[str] = mapped_column(String(80))
    explanation_model: Mapped[str] = mapped_column(String(200))
    result: Mapped[dict] = mapped_column(JSON)


class AnalysisChild(Record):
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analysis_runs.id"), index=True)
    data: Mapped[dict] = mapped_column(JSON)


class CandidateResult(AnalysisChild, Base):
    __tablename__ = "candidate_results"


class SafetyFlag(AnalysisChild, Base):
    __tablename__ = "safety_flags"


class EvidenceReference(AnalysisChild, Base):
    __tablename__ = "evidence_references"


class UncertaintyResult(AnalysisChild, Base):
    __tablename__ = "uncertainty_results"


class ClinicianReview(Record, Base):
    __tablename__ = "clinician_reviews"
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analysis_runs.id"), index=True)
    clinician_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    comment: Mapped[str] = mapped_column(Text, default="")
    analysis_version: Mapped[str] = mapped_column(String(80))


class ClinicianDecision(Record, Base):
    __tablename__ = "clinician_decisions"
    review_id: Mapped[str] = mapped_column(ForeignKey("clinician_reviews.id"), unique=True)
    decision: Mapped[str] = mapped_column(String(40))
    candidate_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class AuditEvent(Record, Base):
    __tablename__ = "audit_events"
    analysis_id: Mapped[str | None] = mapped_column(ForeignKey("analysis_runs.id"), nullable=True, index=True)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(80))
    data: Mapped[dict] = mapped_column(JSON)
    event_hash: Mapped[str] = mapped_column(String(64))


def immutable(_mapper, _connection, _target):
    raise ValueError("Immutable analysis and audit records cannot be changed")


for model in (AnalysisRun, CandidateResult, SafetyFlag, EvidenceReference, UncertaintyResult, ClinicianReview, ClinicianDecision, AuditEvent):
    event.listen(model, "before_update", immutable)
    event.listen(model, "before_delete", immutable)
