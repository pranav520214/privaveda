"""End-to-End Automated Test for PRIVAVEDA 21-Step Golden Demonstration."""
from app.demo import run_golden_demonstration


def test_e2e_golden_demonstration():
    """Runs and asserts all 21 steps of the PRIVAVEDA Golden Demonstration."""
    results = run_golden_demonstration(verbose=False)
    assert results["status"] == "SUCCESS"
    assert results["steps_completed"] == 21
    assert results["patient_token"].startswith("PT-")
    assert results["manifest"]["simulation_id"].startswith("SIM-")
    assert len(results["manifest"]["manifest_hash"]) == 64
    assert results["calibration_results"]["error_improved"] is True
    assert results["calibration_results"]["v2_rmse"] < results["calibration_results"]["v1_rmse"]
    assert len(results["audit_tip_hash"]) == 64
