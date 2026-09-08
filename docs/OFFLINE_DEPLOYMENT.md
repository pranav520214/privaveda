# PRIVAVEDA Offline Deployment & Local Runtime Guide

> **Runtime Requirement:** NETWORK ACCESS = OFF.  
> PRIVAVEDA has zero mandatory remote telemetry, external vector databases, or cloud inference dependencies.

---

## 1. Offline Mode Configuration

Set the environment variable:

```bash
export PRIVAVEDA_OFFLINE=true
```
or in Windows PowerShell:
```powershell
$env:PRIVAVEDA_OFFLINE = "true"
```

When active:
- External HTTP and socket connections are strictly intercepted and blocked (`NetworkEgressBlockedError`).
- Local loopback connections (`127.0.0.1`, `localhost`) remain enabled for inter-process communication.
- Cloud model adapters cannot initialize.
- Telemetry endpoints are fully disabled.

---

## 2. Hardware Capability Diagnostic

Run the local system diagnostic profiler:

```powershell
.\.venv\Scripts\python.exe -c "from app.core.hardware import detect_system_capabilities; print(detect_system_capabilities().to_dict())"
```

The profiler checks CPU core count, total physical RAM, available disk space, and GPU availability/VRAM, then suggests a runtime mode:

- **`MINIMAL`:** (< 8 GB RAM, CPU-only). Uses `NullMedicalModel`, fast deterministic templates, and $N=50$ Monte Carlo samples.
- **`STANDARD`:** (8–16 GB RAM). Enables local 4-bit quantized models and standard $N=100$ Monte Carlo simulation.
- **`HIGH_FIDELITY`:** (>= 16 GB RAM + dedicated GPU with $\ge 8$ GB VRAM). Enables high-fidelity $N=1000$ Monte Carlo uncertainty sweeps.

---

## 3. Local Medical Model Setup (MedGemma)

PRIVAVEDA does **NOT** download weights automatically at runtime.

If weights are desired:
1. Obtain authorized access to Google MedGemma on Hugging Face (`google/medgemma-4b-it`).
2. Run the explicit setup helper:
   ```powershell
   $env:HF_TOKEN = "your_hf_token"
   .\.venv\Scripts\python.exe scripts\download_medgemma.py
   ```
3. Set environment configuration:
   ```powershell
   $env:MEDICAL_MODEL_PROVIDER = "medgemma"
   $env:MEDICAL_MODEL_PATH = "models/medgemma"
   ```
4. If weights are absent or disabled, the application degrades gracefully to `NullMedicalModel`, ensuring continuous, uninterrupted deterministic simulation.
