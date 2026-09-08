#!/usr/bin/env python
"""PRIVAVEDA Golden Demonstration Launcher.

Tagline:
यथा देहः तथा चिकित्सा
Yathā dehaḥ tathā cikitsā
"As the patient, so the treatment."

Core Principle:
SIMULATION BEFORE SUGGESTION.

Runs the complete 21-step end-to-end golden demonstration.
"""
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.demo import run_golden_demonstration

BANNER = """
================================================================================
PRIVAVEDA: Local-First Bio-Mathematical Digital Twin & Precision Medicine
================================================================================
यथा देहः तथा चिकित्सा
Yathā dehaḥ tathā cikitsā
"As the patient, so the treatment."

CORE PRINCIPLE: SIMULATION BEFORE SUGGESTION.
SAFETY BOUNDARY: RESEARCH PROTOTYPE ONLY. NOT AN AUTONOMOUS PRESCRIBER.
================================================================================
"""

def main():
    print(BANNER)
    try:
        results = run_golden_demonstration(verbose=True)
        print("=" * 80)
        print(f"DEMONSTRATION COMPLETED SUCCESSFULLY ({results['steps_completed']}/21 STEPS)")
        print(f"Patient Pseudonym: {results['patient_token']}")
        print(f"Simulation Manifest ID: {results['manifest']['simulation_id']}")
        print(f"Calibration: Prior RMSE {results['calibration_results']['v1_rmse']} mg/L -> Calibrated RMSE {results['calibration_results']['v2_rmse']} mg/L")
        print(f"Audit Trail Tip Hash: {results['audit_tip_hash']}")
        print("=" * 80)
        return 0
    except Exception as exc:
        print(f"ERROR during golden demonstration: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
