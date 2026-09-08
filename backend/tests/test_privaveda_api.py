"""Unit and Integration Tests for PRIVAVEDA Phase 2 Precision Medicine API Endpoints."""
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_privaveda_health():
    resp = client.get("/api/v1/privaveda/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "hardware" in data
    assert "offline_guard" in data
    assert data["offline_guard"]["offline_mode_active"] is True


def test_privaveda_list_profiles():
    resp = client.get("/api/v1/privaveda/profiles?mode=DEMO")
    assert resp.status_code == 200
    profiles = resp.json()
    assert len(profiles) >= 7
    ids = [p["case_id"] for p in profiles]
    assert "SYN-NORM-01" in ids
    assert "SYN-CONTRA-03" in ids
    assert all(p["synthetic"] is True for p in profiles)


def test_privaveda_get_profile():
    resp = client.get("/api/v1/privaveda/profiles/SYN-NORM-01")
    assert resp.status_code == 200
    data = resp.json()
    assert data["case"]["case_id"] == "SYN-NORM-01"
    assert "parameter_vector" in data
    assert "organ_status" in data
    assert data["organ_status"]["kidney"]["status"] == "NORMAL"
    assert data["parameter_vector"]["v_total_l"] > 0
    assert data["baseline_safety"]["is_blocked"] is False


def test_privaveda_simulate():
    payload = {
        "profile_id": "SYN-NORM-01",
        "model_type": "one_compartment",
        "dose_mg": 100.0,
        "route": "oral",
        "interval_hours": 12.0,
        "duration_hours": 24.0,
        "run_monte_carlo": True,
        "mc_samples": 20
    }
    resp = client.post("/api/v1/privaveda/simulate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile_id"] == "SYN-NORM-01"
    assert data["metrics"]["c_max_mg_l"] > 0
    assert data["metrics"]["auc_0_24"] > 0
    assert "monte_carlo_uncertainty" in data
    assert data["monte_carlo_uncertainty"]["samples"] == 20
    assert len(data["time_series_sample"]) > 0


def test_privaveda_calibrate():
    payload = {
        "profile_id": "SYN-NORM-01",
        "observed_points": [[2.0, 6.8], [8.0, 2.4], [12.0, 1.2]],
        "dose_mg": 100.0,
        "route": "oral"
    }
    resp = client.post("/api/v1/privaveda/calibrate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile_id"] == "SYN-NORM-01"
    assert data["error_metrics"]["posterior_rmse_mg_l"] < data["error_metrics"]["prior_rmse_mg_l"]
    assert data["error_metrics"]["rmse_improvement_mg_l"] > 0
    assert "updated_time_series" in data


def test_privaveda_import_inspect_and_commit():
    fhir_bundle = json.dumps({
        "resourceType": "Bundle",
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "name": [{"text": "Alice Smith"}],
                    "gender": "female",
                    "birthDate": "1975-04-10"
                }
            },
            {
                "resource": {
                    "resourceType": "Observation",
                    "code": {"coding": [{"code": "29463-7", "display": "Body Weight"}]},
                    "valueQuantity": {"value": 62.0, "unit": "kg"}
                }
            },
            {
                "resource": {
                    "resourceType": "Observation",
                    "code": {"coding": [{"code": "33914-3", "display": "eGFR"}]},
                    "valueQuantity": {"value": 85.0, "unit": "mL/min"}
                }
            }
        ]
    })
    
    # 1. Inspect
    inspect_resp = client.post("/api/v1/privaveda/import/inspect", json={
        "source_type": "fhir",
        "raw_content": fhir_bundle
    })
    assert inspect_resp.status_code == 200
    inspect_data = inspect_resp.json()
    assert inspect_data["has_direct_identifiers"] is True
    assert inspect_data["suggested_pseudonym"].startswith("PT-")

    # 2. Commit
    token = inspect_data["suggested_pseudonym"]
    commit_resp = client.post("/api/v1/privaveda/import/commit", json={
        "source_type": "fhir",
        "raw_content": fhir_bundle,
        "confirmed_pseudonym": token,
        "user_confirmed_disclaimer": True
    })
    assert commit_resp.status_code == 200
    commit_data = commit_resp.json()
    assert commit_data["success"] is True
    assert commit_data["patient_token"] == token
    assert commit_data["mode"] == "RESEARCH"
    assert commit_data["synthetic"] is False

    # 3. Simulate with newly imported Research case
    sim_resp = client.post("/api/v1/privaveda/simulate", json={
        "profile_id": token,
        "model_type": "one_compartment",
        "dose_mg": 75.0,
        "route": "oral",
        "run_monte_carlo": False
    })
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert sim_data["synthetic"] is False
    assert sim_data["mode"] == "RESEARCH"


def test_privaveda_timeline():
    resp = client.get("/api/v1/privaveda/timeline/SYN-NORM-01")
    assert resp.status_code == 200
    data = resp.json()
    assert data["case_id"] == "SYN-NORM-01"
    assert len(data["events"]) >= 5
    categories = [e["category"] for e in data["events"]]
    assert "BASELINE_OBSERVATION" in categories
    assert "LAB_MEASUREMENT" in categories
    assert "SIMULATION_RUN" in categories


def test_privaveda_knowledge_graph():
    resp = client.get("/api/v1/privaveda/graph/SYN-NORM-01")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["nodes"]) >= 4
    assert len(data["edges"]) >= 3
    node_types = [n["type"] for n in data["nodes"]]
    assert "PatientToken" in node_types
    assert "Gene" in node_types
    assert data["integrity_verified"] is True


def test_privaveda_sensitivity():
    resp = client.post("/api/v1/privaveda/sensitivity", json={
        "profile_id": "SYN-NORM-01",
        "target_metric": "auc_0_t",
        "dose_mg": 100.0
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "rankings" in data
    assert len(data["rankings"]) > 0
    top_param = data["rankings"][0]
    assert "parameter" in top_param
    assert "sensitivity_score" in top_param


def test_privaveda_validation_metrics():
    resp = client.get("/api/v1/privaveda/validation/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["sample_count"] > 0
    assert data["rmse_mg_l"] > 0
    assert data["solver_failure_rate_pct"] == 0.0


def test_privaveda_report():
    resp = client.post("/api/v1/privaveda/report", json={
        "profile_id": "SYN-NORM-01",
        "mode": "DEMO"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "SYNTHETIC DEMONSTRATION DATA" in data["report_markdown"]
    assert data["is_synthetic"] is True


def test_privaveda_demo_reset():
    resp = client.post("/api/v1/privaveda/demo/reset")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["profiles_available"] >= 7
