from datetime import timezone, datetime
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from app.core.auth import current_user, roles, password_hasher, DUMMY_HASH, create_session, token_hash
from app.core.config import settings
from app.core.db import get_db
from app.models import User, PatientCase, Therapy, AnalysisRun, ClinicianReview, ClinicianDecision, AuditEvent, AuthSession
from app.schemas import CaseInput, TherapyInput, LoginInput, ReviewInput, UserOutput, CaseOutput, TherapyOutput, AnalysisOutput, AuditOutput
from app.audit.service import record, digest
from app.services.records import sync_case, sync_therapy
from app.services.analysis import run_analysis, library_snapshot
from app.services.report import report_html
from app.analysis.engine import ENGINE_VERSION, RULESET_VERSION, analyze

router = APIRouter(prefix="/api/v1")


def get_or_404(db, model, id):
    obj = db.get(model, id)
    if obj is None:
        raise HTTPException(404, "Record not found")
    return obj


def serialize(obj):
    return {c.name: (getattr(obj, c.name).replace(tzinfo=timezone.utc).isoformat() if hasattr(getattr(obj, c.name), "isoformat") else getattr(obj, c.name)) for c in obj.__table__.columns}


def case_output(db, case):
    latest = db.scalar(select(AnalysisRun).where(AnalysisRun.case_id == case.id).order_by(AnalysisRun.created_at.desc()))
    return {**serialize(case), "latest_analysis_id": latest.id if latest else None, "latest_status": latest.result["status"] if latest else "NOT_ANALYZED"}


def analysis_output(db, run):
    reviews = []
    for review in db.scalars(select(ClinicianReview).where(ClinicianReview.analysis_id == run.id).order_by(ClinicianReview.created_at)):
        decision = db.scalar(select(ClinicianDecision).where(ClinicianDecision.review_id == review.id))
        clinician = db.get(User, review.clinician_id)
        reviews.append({**serialize(review), "clinician": clinician.username, "decision": decision.decision, "candidate_id": decision.candidate_id})
    return {**serialize(run), "reviews": reviews, "review_status": "REVIEWED" if reviews and reviews[-1]["decision"] != "REQUEST_INFORMATION" else "AWAITING_REVIEW"}


@router.post("/auth/login", response_model=UserOutput)
def login(body: LoginInput, response: Response, db=Depends(get_db)):
    user = db.scalar(select(User).where(User.username == body.username))
    valid = password_hasher.verify(body.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid:
        record(db, "login_failed")
        db.commit()
        raise HTTPException(401, "Invalid username or password")
    token = create_session(db, user)
    record(db, "login_succeeded", user.id)
    db.commit()
    response.set_cookie("pmai_session", token, httponly=True, secure=settings().cookie_secure, samesite="strict", max_age=settings().session_hours * 3600, path="/")
    return user


@router.get("/auth/me", response_model=UserOutput)
def me(user=Depends(current_user)):
    return user


@router.post("/auth/logout")
def logout(request: Request, response: Response, user=Depends(current_user), db=Depends(get_db)):
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == token_hash(request.cookies.get("pmai_session", ""))))
    if session:
        db.delete(session)
    record(db, "logout", user.id)
    db.commit()
    response.delete_cookie("pmai_session", path="/")
    return {"status": "signed_out"}


@router.get("/cases", response_model=list[CaseOutput])
def cases(user=Depends(current_user), db=Depends(get_db)):
    return [case_output(db, c) for c in db.scalars(select(PatientCase).order_by(PatientCase.created_at))]


@router.post("/cases", status_code=201, response_model=CaseOutput)
def create_case(body: CaseInput, user=Depends(roles("CLINICIAN")), db=Depends(get_db)):
    data = body.model_dump(exclude={"revision"})
    case = PatientCase(label=body.label, data=data, created_by=user.id)
    db.add(case)
    db.flush()
    sync_case(db, case)
    record(db, "case_created", user.id, case_id=case.id, input_hash=digest(data))
    db.commit()
    return case_output(db, case)


@router.get("/cases/{id}", response_model=CaseOutput)
def get_case(id: str, user=Depends(current_user), db=Depends(get_db)):
    return case_output(db, get_or_404(db, PatientCase, id))


@router.put("/cases/{id}", response_model=CaseOutput)
def update_case(id: str, body: CaseInput, user=Depends(roles("CLINICIAN")), db=Depends(get_db)):
    case = db.scalar(select(PatientCase).where(PatientCase.id == id).with_for_update())
    if case is None:
        raise HTTPException(404, "Record not found")
    if body.revision != case.revision:
        raise HTTPException(409, "Case changed; reload before saving")
    case.data = body.model_dump(exclude={"revision"})
    case.label = body.label
    case.revision += 1
    sync_case(db, case)
    record(db, "case_changed", user.id, case_id=case.id, revision=case.revision, input_hash=digest(case.data))
    db.commit()
    return case_output(db, case)


@router.post("/cases/{id}/analyze", status_code=201, response_model=AnalysisOutput)
def analyze_case(id: str, user=Depends(roles("CLINICIAN")), db=Depends(get_db)):
    case = get_or_404(db, PatientCase, id)
    run = run_analysis(db, case, user.id)
    db.commit()
    return analysis_output(db, run)


@router.get("/analyses")
def analyses(user=Depends(current_user), db=Depends(get_db)):
    return [{"id": r.id, "case_id": r.case_id, "created_at": r.created_at, "status": r.result["status"], "label": r.input_snapshot["label"], "review_status": analysis_output(db, r)["review_status"]} for r in db.scalars(select(AnalysisRun).order_by(AnalysisRun.created_at.desc()))]


@router.get("/analyses/{id}", response_model=AnalysisOutput)
def get_analysis(id: str, user=Depends(current_user), db=Depends(get_db)):
    return analysis_output(db, get_or_404(db, AnalysisRun, id))


@router.get("/analyses/{id}/report", response_class=HTMLResponse)
def report(id: str, user=Depends(current_user), db=Depends(get_db)):
    return HTMLResponse(report_html(analysis_output(db, get_or_404(db, AnalysisRun, id))))


@router.post("/analyses/{id}/review", status_code=201, response_model=AnalysisOutput)
def review(id: str, body: ReviewInput, user=Depends(roles("CLINICIAN")), db=Depends(get_db)):
    run = get_or_404(db, AnalysisRun, id)
    candidate = next((c for c in run.result["candidates"] if c["therapy_id"] == body.candidate_id), None)
    if body.candidate_id and candidate is None:
        raise HTTPException(422, "Candidate does not belong to this analysis")
    if body.decision == "APPROVE_FURTHER_REVIEW":
        if run.result["status"] == "ABSTAINED" or not candidate or candidate["state"] not in {"PARETO_OPTIMAL", "DOMINATED"}:
            raise HTTPException(422, "Only eligible candidates can be approved for further review")
        case = get_or_404(db, PatientCase, run.case_id)
        if digest(case.data) != run.input_hash or digest(library_snapshot(db)) != run.therapy_library_version:
            raise HTTPException(409, "Case or library changed; run a new analysis before approval")
        current_result = analyze(run.input_snapshot, run.library_snapshot, run.configuration, datetime.now(timezone.utc).date())
        if not any(c["therapy_id"] == body.candidate_id and c["state"] in {"PARETO_OPTIMAL", "DOMINATED"} for c in current_result["candidates"]):
            raise HTTPException(409, "Evidence is no longer eligible; run a new analysis before approval")
    row = ClinicianReview(analysis_id=id, clinician_id=user.id, comment=body.comment, analysis_version=run.analysis_engine_version)
    db.add(row)
    db.flush()
    db.add(ClinicianDecision(review_id=row.id, decision=body.decision, candidate_id=body.candidate_id))
    record(db, "clinician_review", user.id, id, review_id=row.id)
    record(db, "clinician_decision", user.id, id, review_id=row.id, decision=body.decision, candidate_id=body.candidate_id, analysis_version=run.analysis_engine_version)
    db.commit()
    return analysis_output(db, run)


@router.get("/therapies", response_model=list[TherapyOutput])
def therapies(user=Depends(current_user), db=Depends(get_db)):
    return [serialize(t) for t in db.scalars(select(Therapy).order_by(Therapy.name))]


@router.post("/admin/therapies", status_code=201, response_model=TherapyOutput)
def create_therapy(body: TherapyInput, user=Depends(roles("ADMIN")), db=Depends(get_db)):
    if db.scalar(select(Therapy).where(Therapy.name == body.name)):
        raise HTTPException(409, "Therapy name already exists")
    data = body.model_dump(mode="json", exclude={"revision"})
    therapy = Therapy(name=body.name, data=data, validation_status=body.validation_status, source=body.source_reference)
    db.add(therapy)
    db.flush()
    sync_therapy(db, therapy)
    record(db, "therapy_created", user.id, therapy_id=therapy.id, content_hash=digest(data), snapshot=data)
    db.commit()
    return serialize(therapy)


@router.put("/admin/therapies/{id}", response_model=TherapyOutput)
def update_therapy(id: str, body: TherapyInput, user=Depends(roles("ADMIN")), db=Depends(get_db)):
    therapy = db.scalar(select(Therapy).where(Therapy.id == id).with_for_update())
    if therapy is None:
        raise HTTPException(404, "Record not found")
    if therapy.revision != body.revision:
        raise HTTPException(409, "Library entry changed; reload before saving")
    other = db.scalar(select(Therapy).where(Therapy.name == body.name, Therapy.id != id))
    if other:
        raise HTTPException(409, "Therapy name already exists")
    therapy.data = body.model_dump(mode="json", exclude={"revision"})
    therapy.name = body.name
    therapy.validation_status = body.validation_status
    therapy.source = body.source_reference
    therapy.revision += 1
    sync_therapy(db, therapy)
    record(db, "therapy_changed", user.id, therapy_id=id, revision=therapy.revision, content_hash=digest(therapy.data), snapshot=therapy.data)
    db.commit()
    return serialize(therapy)


@router.delete("/admin/therapies/{id}", response_model=TherapyOutput)
def retire_therapy(id: str, user=Depends(roles("ADMIN")), db=Depends(get_db)):
    therapy = get_or_404(db, Therapy, id)
    therapy.data = {**therapy.data, "validation_status": "RETIRED"}
    therapy.validation_status = "RETIRED"
    therapy.revision += 1
    sync_therapy(db, therapy)
    record(db, "therapy_retired", user.id, therapy_id=id, revision=therapy.revision)
    db.commit()
    return serialize(therapy)


@router.get("/audit", response_model=list[AuditOutput])
def audit(user=Depends(current_user), db=Depends(get_db)):
    return [serialize(e) for e in db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(500))]


@router.get("/audit/{analysis_id}", response_model=list[AuditOutput])
def analysis_audit(analysis_id: str, user=Depends(current_user), db=Depends(get_db)):
    get_or_404(db, AnalysisRun, analysis_id)
    return [serialize(e) for e in db.scalars(select(AuditEvent).where(AuditEvent.analysis_id == analysis_id).order_by(AuditEvent.created_at))]


@router.get("/system/status")
def status(user=Depends(current_user), db=Depends(get_db)):
    runs = list(db.scalars(select(AnalysisRun)))
    reviewed = {r.analysis_id for r in db.scalars(select(ClinicianReview))}
    return {"database_backend": db.get_bind().dialect.name, "label": "DEMO METRICS", "total_demo_cases": len(list(db.scalars(select(PatientCase)))), "analysis_count": len(runs), "analysis_success_rate": round(100 * sum(r.result["status"] == "READY_FOR_REVIEW" for r in runs) / len(runs), 1) if runs else 0, "success_definition": "Runs yielding eligible candidates / completed runs; not clinical accuracy", "abstention_count": sum(r.result["status"] == "ABSTAINED" for r in runs), "safety_blocks": sum(c["state"] == "EXCLUDED" for r in runs for c in r.result["candidates"]), "average_latency_ms": round(sum(r.result["latency_ms"] for r in runs) / len(runs), 2) if runs else 0, "reviewed_count": len(reviewed), "awaiting_review": sum(analysis_output(db, r)["review_status"] == "AWAITING_REVIEW" for r in runs), "engine_version": ENGINE_VERSION, "ruleset_version": RULESET_VERSION, "library_version": digest(library_snapshot(db)), "explanation_mode": "Optional local HF with template fallback" if settings().use_hf_model else "Deterministic template", "clinical_validation": "Not performed", "data_policy": "Synthetic demonstration data only"}
