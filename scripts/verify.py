#!/usr/bin/env python
"""PRIVAVEDA Automated Verification Suite (Equivalent to make verify).

Executes the complete test battery:
1. Unit tests
2. Numerical solver & analytical reference tests
3. Security, cryptography, and tamper-evident audit tests
4. Offline network-egress isolation test
5. Property-based hypothesis tests
6. End-to-end 21-step golden demonstration
"""
import os
import sys
import subprocess
from pathlib import Path

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
PYTHON = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
if not PYTHON.exists():
    PYTHON = Path(sys.executable)

def run_step(step_name: str, cmd: list[str]) -> bool:
    print(f"\n[RUNNING] {step_name}...")
    sys.stdout.flush()
    env = os.environ.copy()
    existing_py_path = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = str(BACKEND_DIR) + (f";{existing_py_path}" if existing_py_path else "")
    res = subprocess.run(cmd, cwd=str(ROOT_DIR), env=env)
    if res.returncode != 0:
        print(f"[FAILED] {step_name} exited with code {res.returncode}", file=sys.stderr)
        return False
    print(f"[PASSED] {step_name}")
    return True

def main():
    print("=" * 80)
    print("PRIVAVEDA VERIFICATION SUITE")
    print("यथा देहः तथा चिकित्सा (Yathā dehaḥ tathā cikitsā)")
    print("=" * 80)

    steps = [
        ("Full Backend Pytest Battery (Unit, Security, Numerical, Property, Offline)", [
            str(PYTHON), "-m", "pytest", "backend/tests", "-v"
        ]),
        ("21-Step End-to-End Golden Demonstration", [
            str(PYTHON), "scripts/run_golden_demo.py"
        ]),
        ("Hardware Capability Diagnostic Profiler", [
            str(PYTHON), "-c", "from app.core.hardware import detect_system_capabilities; print(detect_system_capabilities().to_dict())"
        ]),
        ("Offline Local Readiness Check", [
            str(PYTHON), "-c", "from app.core.offline import check_offline_readiness; print(check_offline_readiness())"
        ])
    ]

    all_passed = True
    for name, cmd in steps:
        if not run_step(name, cmd):
            all_passed = False
            break

    print("\n" + "=" * 80)
    if all_passed:
        print("ALL VERIFICATION CHECKS PASSED (100% SUCCESS)")
        print("=" * 80)
        return 0
    else:
        print("VERIFICATION FAILED", file=sys.stderr)
        print("=" * 80)
        return 1

if __name__ == "__main__":
    sys.exit(main())
