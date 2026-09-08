from datetime import date
from pydantic import ValidationError
from app.schemas import TherapyInput
from app.safety.engine import evaluate
from app.uncertainty.heuristic import PrototypeUncertainty
from app.analysis.pareto import rank

ENGINE_VERSION = "fast-arm-1.0.0"
RULESET_VERSION = "synthetic-rules-1.0.0"
ABSTENTION = "Insufficient validated evidence for recommendation."


def analyze(case: dict, library: list[dict], config: dict, as_of: date) -> dict:
    candidates = []
    for record in library:
        raw = record["data"]
        if raw.get("indication") != case["condition"]:
            continue
        try:
            therapy = TherapyInput.model_validate(raw).model_dump(mode="json")
        except ValidationError:
            candidates.append({"therapy_id": record["id"], "name": record["name"], "state": "ABSTAINED", "reasons": ["Invalid library record"], "flags": [], "missing_data": [], "evidence": [], "evaluated_rules": [], "scores": None, "uncertainty": {"score": 1, "category": "HIGH_UNCERTAINTY", "label": "Prototype uncertainty heuristic", "calibrated": False}, "rank_reason": "Not ranked"})
            continue
        safety = evaluate(case, therapy)
        reasons = []
        if safety["blocked"]:
            reasons.extend(f["reason"] for f in safety["flags"] if f["action"] == "BLOCK")
        if safety["missing_data"]:
            reasons.append("Required observations are missing; no imputation is performed.")
        age = (as_of - date.fromisoformat(therapy["last_reviewed"])).days
        evidence_valid = bool(therapy["evidence"]) and all(e["status"] == "DEMO_APPROVED" for e in therapy["evidence"])
        if therapy["validation_status"] != "DEMO_APPROVED" or therapy["evidence_status"] != "DEMO_APPROVED" or not evidence_valid:
            reasons.append("Evidence or library approval is missing, invalid or conflicting.")
        if therapy["evidence_quality"] < config["evidence_threshold"]:
            reasons.append("Evidence quality is below the configured demo threshold.")
        if age < 0 or age > config["evidence_max_age_days"]:
            reasons.append("Evidence review is stale or has an invalid future date.")
        if therapy["approved_context"] != case["condition"]:
            reasons.append("Clinical context is outside the approved demo context.")
        if safety["conflict"]:
            reasons.append("Conflicting safety rules; no automatic resolution is permitted.")
        state = "EXCLUDED" if safety["blocked"] else "ABSTAINED" if reasons else "ELIGIBLE"
        uncertainty = PrototypeUncertainty().estimate(therapy, sum(f["action"] == "WARN" for f in safety["flags"]), len(safety["missing_data"]))
        if uncertainty["score"] >= config["uncertainty_threshold"] and state == "ELIGIBLE":
            state = "ABSTAINED"
            reasons.append("Prototype uncertainty exceeds the configured eligibility threshold.")
        candidates.append({"therapy_id": record["id"], "name": therapy["name"], "state": state, "reasons": reasons or ["Approved synthetic library entry; all required observations present; no hard exclusion triggered."], "flags": safety["flags"], "evaluated_rules": safety["evaluated_rules"], "missing_data": safety["missing_data"], "evidence": therapy["evidence"], "source": therapy["source_reference"], "last_reviewed": therapy["last_reviewed"], "uncertainty": uncertainty, "scores": {"label": "DEMO_SCORE", "efficacy": therapy["efficacy_demo_score"], "toxicity": therapy["toxicity_demo_score"], "interaction": therapy["interaction_demo_score"], "evidence_quality": therapy["evidence_quality"]}, "rank_reason": "Not ranked: eligibility or safety gate failed."})
    rank(candidates)
    eligible = [c for c in candidates if c["state"] in {"PARETO_OPTIMAL", "DOMINATED"}]
    return {"status": "READY_FOR_REVIEW" if eligible else "ABSTAINED", "message": "Structured demo comparison requires physician review." if eligible else ABSTENTION, "candidates": candidates, "missing_data": sorted({m for c in candidates for m in c["missing_data"]}), "context_supported": bool(candidates), "score_label": "DEMO_SCORE", "notes_interpreted": False, "stages": ["INPUT_VALIDATED", "SAFETY_EVALUATED", "ELIGIBILITY_CHECKED", "PARETO_COMPUTED", "UNCERTAINTY_EVALUATED", "AWAITING_CLINICIAN_REVIEW"]}
