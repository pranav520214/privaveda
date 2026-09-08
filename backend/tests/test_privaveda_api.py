"""Unit and Integration Tests for PRIVAVEDA Precision Medicine API Endpoints."""
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
    resp = client.get("/api/v1/privaveda/profiles")
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
