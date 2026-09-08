from copy import deepcopy
from app.analysis.engine import analyze
from datetime import date


def test_admin_library_create_revision_retire_is_audited(api, library, cases, config):
    client, actor, users, _ = api
    actor["user"] = users["ADMIN"]
    payload = deepcopy(library[0]["data"])
    payload["name"] = "DEMO QA option"
    response = client.post("/api/v1/admin/therapies", json=payload)
    assert response.status_code == 201
    entry = response.json()
    response = client.put(f'/api/v1/admin/therapies/{entry["id"]}', json={**payload, "revision": 1, "efficacy_demo_score": 0.4})
    assert response.status_code == 200
    assert response.json()["revision"] == 2
    response = client.delete(f'/api/v1/admin/therapies/{entry["id"]}')
    assert response.status_code == 200
    retired = response.json()
    assert retired["validation_status"] == "RETIRED"
    result = analyze(cases[0], [retired], config, date.fromisoformat(payload["last_reviewed"]))
    assert result["status"] == "ABSTAINED"
    events = client.get("/api/v1/audit").json()
    assert {"therapy_created", "therapy_changed", "therapy_retired"} <= {e["event_type"] for e in events}
