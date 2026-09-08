from datetime import datetime, timezone
from time import perf_counter
from uuid import uuid4
from sqlalchemy import select
from app.models import Therapy, AnalysisRun, CandidateResult, SafetyFlag, EvidenceReference, UncertaintyResult
from app.analysis.engine import analyze, ENGINE_VERSION, RULESET_VERSION
from app.audit.service import digest, record
from app.core.config import settings
from app.explanation.providers import MockExplanationProvider, HuggingFaceExplanationProvider, explain_safely


def library_snapshot(db) -> list[dict]:
    return [{"id": t.id, "name": t.name, "revision": t.revision, "data": t.data} for t in db.scalars(select(Therapy).order_by(Therapy.id))]


def run_analysis(db, case, actor_id: str) -> AnalysisRun:
    start = perf_counter()
    timestamp = datetime.now(timezone.utc)
    library = library_snapshot(db)
    cfg = settings()
    config = {"evidence_threshold": cfg.evidence_threshold, "evidence_max_age_days": cfg.evidence_max_age_days, "uncertainty_threshold": 0.8}
    result = analyze(case.data, library, config, timestamp.date())
    provider = HuggingFaceExplanationProvider(cfg.hf_model_id, cfg.hf_token, cfg.hf_device) if cfg.use_hf_model else MockExplanationProvider()
    explanation, provider_name, model = explain_safely(result, provider)
    run_id = str(uuid4())
    for c in result["candidates"]:
        for flag in c["flags"]:
            flag.update({"timestamp": timestamp.isoformat(), "analysis_id": run_id})
    result["explanation"] = explanation
    result["latency_ms"] = round((perf_counter() - start) * 1000, 2)
    run = AnalysisRun(id=run_id, case_id=case.id, actor_id=actor_id, input_snapshot=case.data, library_snapshot=library, configuration=config, input_hash=digest(case.data), configuration_hash=digest(config), analysis_engine_version=ENGINE_VERSION, ruleset_version=RULESET_VERSION, therapy_library_version=digest(library), explanation_provider=provider_name, explanation_model=model, result=result, created_at=timestamp)
    db.add(run)
    db.flush()
    record(db, "analysis_started", actor_id, run.id, input_hash=run.input_hash, case_id=case.id, case_revision=case.revision, library_version=run.therapy_library_version, configuration_hash=run.configuration_hash)
    for c in result["candidates"]:
        db.add(CandidateResult(analysis_id=run.id, data=c))
        db.add(UncertaintyResult(analysis_id=run.id, data={"therapy_id": c["therapy_id"], **c["uncertainty"]}))
        for e in c["evidence"]:
            db.add(EvidenceReference(analysis_id=run.id, data={"therapy_id": c["therapy_id"], **e}, source=e["source"]))
        for flag in c["flags"]:
            db.add(SafetyFlag(analysis_id=run.id, data={"therapy_id": c["therapy_id"], **flag}))
            record(db, "rule_triggered", actor_id, run.id, therapy_id=c["therapy_id"], rule_id=flag["rule_id"], action=flag["action"])
        record(db, "rules_evaluated", actor_id, run.id, therapy_id=c["therapy_id"], rules=c["evaluated_rules"])
        record(db, "candidate_excluded" if c["state"] == "EXCLUDED" else "candidate_abstained" if c["state"] == "ABSTAINED" else "candidate_ranked", actor_id, run.id, therapy_id=c["therapy_id"], state=c["state"])
    record(db, "explanation_generated", actor_id, run.id, provider=provider_name, model=model, requested_provider=provider.name, fallback=explanation["fallback"])
    record(db, "analysis_finished", actor_id, run.id, status=result["status"])
    return run
