#!/usr/bin/env python
"""PRIVAVEDA MedGemma Download & Asset Preparation Helper.

Architectural Rule:
"Do not automatically download model weights at runtime.
Runtime execution must operate offline.
This script is executed explicitly by the user during setup when network is available."
"""
import os
import sys
import shutil
from pathlib import Path

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TARGET_DIR = Path(__file__).resolve().parent.parent / "models" / "medgemma"

def main():
    print("=" * 80)
    print("PRIVAVEDA MedGemma 4B / GGUF Download Helper")
    print("=" * 80)
    print(f"Target local storage directory: {TARGET_DIR}")

    # Check available disk space (require at least 8 GB)
    total, used, free = shutil.disk_usage(Path.cwd())
    free_gb = free / (1024 ** 3)
    print(f"Available disk space: {free_gb:.2f} GB")
    if free_gb < 8.0:
        print(f"ERROR: Insufficient disk space ({free_gb:.2f} GB available, >= 8.0 GB required).", file=sys.stderr)
        return 1

    model_id = os.environ.get("MEDGEMMA_MODEL_ID", "google/medgemma-4b-it")
    hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")

    print(f"Requested Model ID: {model_id}")
    if not hf_token:
        print("\nNOTE: Google MedGemma is an authenticated/gated model on Hugging Face.")
        print("To download the genuine weights, please ensure you have accepted the license at:")
        print(f"https://huggingface.co/{model_id}")
        print("and set your token via:")
        print("   $env:HF_TOKEN='hf_...'")
        print("\nChecking if huggingface_hub is available...")

    try:
        from huggingface_hub import snapshot_download
    except ImportError:
        print("ERROR: huggingface_hub package is not installed in current Python environment.", file=sys.stderr)
        return 1

    if not hf_token:
        print("No HF_TOKEN detected. Creating target directory and offline descriptor stub.")
        TARGET_DIR.mkdir(parents=True, exist_ok=True)
        manifest_file = TARGET_DIR / "manifest.json"
        manifest_file.write_text(
            '{\n  "model_id": "' + model_id + '",\n  "status": "UNLOADED_REQUIRES_HF_TOKEN",\n  "instructions": "Set HF_TOKEN and rerun download_medgemma.py"\n}\n',
            encoding="utf-8"
        )
        print(f"Wrote descriptor stub to {manifest_file}.")
        print("PRIVAVEDA will operate cleanly in offline mode using NullMedicalModel.")
        return 0

    print(f"Starting authenticated download of {model_id}...")
    try:
        snapshot_download(
            repo_id=model_id,
            local_dir=str(TARGET_DIR),
            token=hf_token,
            local_dir_use_symlinks=False
        )
        print(f"\nSUCCESS: MedGemma weights successfully downloaded to {TARGET_DIR}")
        return 0
    except Exception as exc:
        print(f"Download failed or authorization required: {exc}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
