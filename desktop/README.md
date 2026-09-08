# Personalized Medicine AI — Windows desktop

Open `PersonalizedMedicineAI.exe`, then choose **Open local synthetic demo**. The app provisions a local clinician demo account on first launch. No browser, Python, Node or Docker installation is needed for the packaged application. Keep the `_internal` and `resources` folders beside the executable.

## Use the application

1. **Case workspace:** select one of ten synthetic cases, edit structured observations, run the fictional therapy comparison, and record a clinician assessment or differential through **Clinician review**. Export a readable PDF. Clinical notes do not become automated diagnoses.
2. **Medicine library:** search generic ingredients, product names or indications in the downloaded openFDA drug-label collection. Select a label to read its full retained clinical sections and provenance. **Open original source** opens the public DailyMed page in your browser only when clicked.
3. Enter a research question and choose **Create local model brief**. The first load verifies the model and runtime, then runs CPU inference locally. The model selects supplied source excerpts; it cannot add new medical claims. Safety sections are independently included even when not selected by the model.
4. Add an optional clinician interpretation and **Save reference report**. Open it under **Saved reports** and export PDF. An integrity hash detects accidental modification; it is not a cryptographic clinician signature.
5. **Local system:** view model parameter count, FDA snapshot count/date and storage paths.

The account store, case database and saved reports are under `%LOCALAPPDATA%\PersonalizedMedicineAI`. Back up this folder if needed. For an isolated test profile set `PMAI_DATA_DIR`; set `PMAI_ASSETS_DIR` to reuse a separate asset folder. Demo account credentials are local and never included in the package.

## Clinical boundaries

This is a research prototype, not validated clinical software. Use synthetic cases only. The drug labels are real reference material; the six therapy candidates and all scores in the case analysis are fictional demo data. Real labels never silently enter the approved therapy library. Inclusion in openFDA does not establish FDA approval. Review the label dates and original source for currency. The app does not diagnose, prescribe, give patient-specific doses, or validate a clinician's differential.

The experimental medical fine-tune is NewSonnet's Qwen2.5-1.5B GGUF, pinned to revision `c18158f017b21aac89bd1de052d2c00fad327bce`. The app enforces at most 2,000,000,000 stored tensor parameters, verifies SHA-256, and only accepts bounded JSON excerpt selections. Medical fine-tuning is the publisher's claim, not independent clinical validation. The publisher itself warns against clinical use.

Data stays local during normal use. The native API runs in the app process. The model server binds only to 127.0.0.1 with an ephemeral secret and no prompt logs. Stored data is not encrypted clinical storage. First-time asset preparation downloads public artifacts; normal app operation does not send case records to public services.

## Developer build

From the project root, install `backend/requirements.txt` and `desktop/requirements.txt` into `.venv`, then run:

```powershell
.venv\Scripts\python.exe scripts\prepare-desktop-assets.py
.venv\Scripts\python.exe desktop\main.py
powershell -ExecutionPolicy Bypass -File desktop\build.ps1
```

Asset preparation downloads every partition in the pinned official openFDA manifest, streams its JSON, records source/date/archive SHA-256 and builds a temporary SQLite full-text index. It activates the index only after raw record counts match the manifest. Archive downloads and imports are reusable after interruption. The first cached manifest pins a reproducible snapshot; choose a fresh asset directory for a new snapshot. The FDA service provides no cryptographic archive checksum, so computed SHA-256 records local integrity and provenance, not a publisher signature.

Native interface: PySide6 Qt Widgets, no WebEngine. Tests: `python -m pytest desktop/tests` separately from backend tests because each suite initializes its own isolated database configuration. Production assets are tested separately with `scripts/desktop-model-smoke.py`. ECC guidance: `ecc-guide`, `tdd-workflow`, `windows-desktop-e2e` from installed ECC 2.2.1. See `desktop/VALIDATION.md` for measured results.
