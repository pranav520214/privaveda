# Native desktop extension — ECC development workflow

Requested: Windows-native app, a medicine-oriented local model with at most 2,000,000,000 actual parameters, large trusted medical-reference dataset, readable diagnostic-review reports. Preserve synthetic-case and human-sign-off boundaries of V1. Diagnostic assessment is clinician-authored, never a model-issued diagnosis.

Use PySide6/Qt Widgets, the existing FastAPI/SQLAlchemy services via a private in-process ASGI client, and a PyInstaller directory application. No browser, Node, Docker or public port is required for the desktop UI. Per-user application data is separate from installation files. Keep the web app working.

Reference library: download all 14 openFDA drug-label partitions from the current official manifest (262,737 raw records as of 2026-09-07), record download SHA-256/date/source, stream JSON into a local SQLite FTS5 index, preserve label metadata and clinical text sections. The index is evidence for manual review and retrieval; it cannot silently create approved therapies or infer diagnosis. Full refresh builds a new index before atomic activation.

Model: medically fine-tuned Qwen2.5-1.5B GGUF, publisher NewSonnet, pinned revision. Verify SHA-256 and actual GGUF tensor parameter count below 2B. Run through a pinned official llama.cpp Windows binary. All inference stays local. Grounded briefing selects verbatim supplied evidence sentences using grammar-constrained output, forbids new medical claims, preserves warnings and supports refusal. The model is explicitly experimental and not clinically validated.

Reports: replace raw JSON presentation with readable patient-input tables, candidate states, numeric DEMO_SCORE fields, safety/evidence/uncertainty, clinician review and version provenance. Native report preview supports PDF export. Reference briefings separately show sources, evidence excerpts, actual model use or fallback, and clinician-authored differential/assessment.

ECC skills read from installed ecc/2.2.1: ecc-guide, tdd-workflow, windows-desktop-e2e. Follow RED/GREEN testing for indexing, source confinement, hash checks, model size, unsupported citations, report escaping and native user flows. UIA testing uses stable accessible names and isolated user storage; no screen-wide credential traces. Record measured coverage rather than claiming unmeasured compliance.
