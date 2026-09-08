from copy import deepcopy
import pytest
from sqlalchemy import select
from app.core.auth import current_user
from app.main import app
from app.models import AnalysisRun, CandidateResult, AuditEvent
from app.audit.service import digest


def create_run(client, case):
    response = client.post("/api/v1/cases", json=case)
    assert response.status_code == 201, response.text
    created = response.json()
    response = client.post(f'/api/v1/cases/{created["id"]}/analyze')
    assert response.status_code == 201, response.text
    return created, response.json()


def eligible(run):
    return next(c["therapy_id"] for c in run["result"]["candidates"] if c["state"] == "PARETO_OPTIMAL")


def test_persistence_review_audit_and_versions(api, cases):
    client, _, _, factory = api
    case, run = create_run(client, cases[0])
    assert client.get(f'/api/v1/analyses/{run["id"]}').json() == run
    assert run["input_hash"] == digest(run["input_snapshot"])
    assert run["configuration_hash"] == digest(run["configuration"])
    assert run["therapy_library_version"] == digest(run["library_snapshot"])
    assert run["analysis_engine_version"] and run["ruleset_version"]
    response = client.post(f'/api/v1/analyses/{run["id"]}/review', json={"decision": "APPROVE_FURTHER_REVIEW", "candidate_id": eligible(run), "comment": "Synthetic review"})
    assert response.status_code == 201, response.text
    reloaded = client.get(f'/api/v1/analyses/{run["id"]}').json()
    assert reloaded["review_status"] == "REVIEWED"
    assert reloaded["reviews"][0]["analysis_version"] == run["analysis_engine_version"]
    events = client.get(f'/api/v1/audit/{run["id"]}').json()
    assert {"analysis_started", "rules_evaluated", "analysis_finished", "clinician_review", "clinician_decision", "explanation_generated"} <= {e["event_type"] for e in events}
    with factory() as db:
        assert db.get(AnalysisRun, run["id"]).result == run["result"]
        assert len(list(db.scalars(select(CandidateResult).where(CandidateResult.analysis_id == run["id"])))) == len(run["result"]["candidates"])


@pytest.mark.parametrize("edit", ["case", "library"])
def test_old_snapshots_survive_edits_and_stale_approval_denied(api, cases, edit):
    client, actor, users, _ = api
    case, run = create_run(client, cases[0])
    if edit == "case":
        payload = {**case["data"], "revision": case["revision"], "notes": "Updated synthetic case"}
        response = client.put(f'/api/v1/cases/{case["id"]}', json=payload)
    else:
        actor["user"] = users["ADMIN"]
        therapy = client.get("/api/v1/therapies").json()[0]
        payload = {**therapy["data"], "revision": therapy["revision"], "efficacy_demo_score": .01}
        response = client.put(f'/api/v1/admin/therapies/{therapy["id"]}', json=payload)
        actor["user"] = users["CLINICIAN"]
    assert response.status_code == 200, response.text
    assert client.get(f'/api/v1/analyses/{run["id"]}').json() == run
    response = client.post(f'/api/v1/analyses/{run["id"]}/review', json={"decision": "APPROVE_FURTHER_REVIEW", "candidate_id": eligible(run)})
    assert response.status_code == 409
    new_run = client.post(f'/api/v1/cases/{case["id"]}/analyze').json()
    field = "input_hash" if edit == "case" else "therapy_library_version"
    assert new_run[field] != run[field]


def test_unauthorized_edits_and_researcher_signoff_denied(api, cases):
    client, actor, users, _ = api
    case, run = create_run(client, cases[0])
    therapy = client.get("/api/v1/therapies").json()[0]
    actor["user"] = users["RESEARCHER"]
    assert client.post("/api/v1/cases", json=cases[0]).status_code == 403
    assert client.put(f'/api/v1/cases/{case["id"]}', json={**cases[0], "revision": 1}).status_code == 403
    assert client.post(f'/api/v1/cases/{case["id"]}/analyze').status_code == 403
    assert client.post(f'/api/v1/analyses/{run["id"]}/review', json={"decision": "APPROVE_FURTHER_REVIEW", "candidate_id": eligible(run)}).status_code == 403
    for role in ("RESEARCHER", "CLINICIAN"):
        actor["user"] = users[role]
        assert client.put(f'/api/v1/admin/therapies/{therapy["id"]}', json={**therapy["data"], "revision": 1}).status_code == 403
        assert client.delete(f'/api/v1/admin/therapies/{therapy["id"]}').status_code == 403
    app.dependency_overrides.pop(current_user)
    assert client.get("/api/v1/cases").status_code == 401


@pytest.mark.parametrize("index", [1, 3, 4, 8])
def test_ineligible_or_absent_candidates_cannot_be_approved(api, cases, index):
    client, _, _, _ = api
    _, run = create_run(client, cases[index])
    blocked = next((c["therapy_id"] for c in run["result"]["candidates"] if c["state"] in {"EXCLUDED", "ABSTAINED"}), None)
    response = client.post(f'/api/v1/analyses/{run["id"]}/review', json={"decision": "APPROVE_FURTHER_REVIEW", "candidate_id": blocked})
    assert response.status_code == 422


def test_report_escapes_untrusted_case_and_review_text(api, cases):
    client, _, _, _ = api
    payload = "<script>alert('synthetic')</script>"
    cases[0].update(label=payload, notes=payload)
    _, run = create_run(client, cases[0])
    client.post(f'/api/v1/analyses/{run["id"]}/review', json={"decision": "REJECT", "comment": payload})
    response = client.get(f'/api/v1/analyses/{run["id"]}/report')
    assert response.status_code == 200
    assert "<script>" not in response.text
    assert "&lt;script&gt;" in response.text
    assert "not a prescription" in response.text


def test_stale_edits_cross_origin_and_invalid_library_rejected(api, cases):
    client, actor, users, _ = api
    case, _ = create_run(client, cases[0])
    path = f'/api/v1/cases/{case["id"]}'
    assert client.put(path, json={**cases[0], "revision": 99}).status_code == 409
    assert client.post("/api/v1/cases", json=cases[0], headers={"Origin": "https://attacker.invalid"}).status_code == 403
    actor["user"] = users["ADMIN"]
    therapy = client.get("/api/v1/therapies").json()[0]
    assert client.post("/api/v1/admin/therapies", json={**therapy["data"], "efficacy_demo_score": 2}).status_code == 422


def test_immutable_audit_and_result_reject_orm_updates(api, cases):
    client, _, _, factory = api
    _, run = create_run(client, cases[0])
    for model in (AnalysisRun, AuditEvent):
        with factory() as db:
            row = db.get(AnalysisRun, run["id"]) if model is AnalysisRun else db.scalar(select(AuditEvent))
            row.source = "tampered"
            with pytest.raises(ValueError, match="Immutable"):
                db.commit()
