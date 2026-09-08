"""Idempotent synthetic bootstrap. No real medical facts are represented."""
import json
import os
import secrets
from pathlib import Path
from sqlalchemy import select
from app.core.db import SessionLocal
from app.core.auth import password_hasher
from app.core.config import settings
from app.models import User, ClinicianProfile, PatientCase, Therapy, ClinicianReview, ClinicianDecision
from app.schemas import CaseInput, TherapyInput
from app.services.records import sync_case, sync_therapy
from app.services.analysis import run_analysis
from app.audit.service import record, digest

DATA = Path(__file__).resolve().parents[2] / "data"
if not DATA.exists():
    DATA = Path(__file__).resolve().parents[3] / "data"


def seed(db):
    users = {}
    new_accounts = []
    configured = settings().demo_password
    if configured and len(configured) < 16:
        raise ValueError("DEMO_PASSWORD must have at least 16 characters")
    for role in ("CLINICIAN", "ADMIN", "RESEARCHER"):
        username = role.lower() + "@demo.local"
        user = db.scalar(select(User).where(User.username == username))
        if user is None:
            password = configured or secrets.token_urlsafe(20)
            user = User(username=username, role=role, password_hash=password_hasher.hash(password))
            db.add(user)
            db.flush()
            if role == "CLINICIAN":
                db.add(ClinicianProfile(user_id=user.id, display_name="Demo clinician"))
            new_accounts.append(f"{username}: {password}")
        users[role] = user
    if new_accounts:
        credential_path = Path(os.getenv("DEMO_CREDENTIALS_PATH", "demo-credentials.txt"))
        credential_path.parent.mkdir(parents=True, exist_ok=True)
        credential_path.write_text("LOCAL SYNTHETIC DEMO ACCOUNTS — do not publish\n" + "\n".join(new_accounts) + "\n", encoding="utf-8")
        try:
            credential_path.chmod(0o600)
        except OSError:
            pass
        print(f"Demo credentials written to {credential_path.resolve()} (not logged).")
    for item in json.loads((DATA / "demo_therapy_library" / "therapies.json").read_text(encoding="utf-8")):
        if db.scalar(select(Therapy).where(Therapy.name == item["name"])):
            continue
        data = TherapyInput.model_validate(item).model_dump(mode="json", exclude={"revision"})
        therapy = Therapy(name=data["name"], data=data, source=data["source_reference"], validation_status=data["validation_status"])
        db.add(therapy)
        db.flush()
        sync_therapy(db, therapy)
        record(db, "therapy_seeded", users["ADMIN"].id, therapy_id=therapy.id, content_hash=digest(data), snapshot=data)
    for item in json.loads((DATA / "demo_cases" / "cases.json").read_text(encoding="utf-8")):
        if db.scalar(select(PatientCase).where(PatientCase.label == item["label"])):
            continue
        data = CaseInput.model_validate(item).model_dump(exclude={"revision"})
        case = PatientCase(label=data["label"], data=data, created_by=users["CLINICIAN"].id)
        db.add(case)
        db.flush()
        sync_case(db, case)
        record(db, "case_created", users["CLINICIAN"].id, case_id=case.id, input_hash=digest(data), synthetic_seed=True)
        run = run_analysis(db, case, users["CLINICIAN"].id)
        if data["label"] in {"SYN-007", "SYN-008"}:
            decision = "REJECT" if data["label"] == "SYN-007" else "APPROVE_FURTHER_REVIEW"
            candidate = next(c for c in run.result["candidates"] if c["state"] == "PARETO_OPTIMAL")
            review = ClinicianReview(analysis_id=run.id, clinician_id=users["CLINICIAN"].id, comment="Synthetic demonstration of clinician review; not a real clinical decision.", analysis_version=run.analysis_engine_version)
            db.add(review)
            db.flush()
            db.add(ClinicianDecision(review_id=review.id, decision=decision, candidate_id=candidate["therapy_id"]))
            record(db, "clinician_review", users["CLINICIAN"].id, run.id, review_id=review.id, synthetic_seed=True)
            record(db, "clinician_decision", users["CLINICIAN"].id, run.id, decision=decision, review_id=review.id, candidate_id=candidate["therapy_id"], analysis_version=run.analysis_engine_version, synthetic_seed=True)
    db.commit()


if __name__ == "__main__":
    with SessionLocal() as session:
        seed(session)
