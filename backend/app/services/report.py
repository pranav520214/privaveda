from html import escape
import json


DISCLAIMER = "Decision-support prototype. This output is not a prescription and has not been validated for direct patient care."


def report_html(run: dict) -> str:
    def text(value):
        return escape(str(value))
    def section(title, value):
        return f"<section><h2>{text(title)}</h2><pre>{text(json.dumps(value, indent=2, ensure_ascii=False))}</pre></section>"
    result = run["result"]
    return "<!doctype html><html lang='en'><head><meta charset='utf-8'><title>Demo analysis report</title><style>body{font:15px system-ui;max-width:960px;margin:40px auto;color:#16333c;padding:20px}header{border-bottom:3px solid #176b67}aside{background:#fff4dc;padding:20px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px system-ui}section{break-inside:avoid}h2{margin-top:30px}@media print{body{margin:0}}</style></head><body><header><h1>Personalized Medicine AI</h1><p>SYNTHETIC PATIENT — NOT REAL DATA · DEMO_SCORE</p></header><aside>" + DISCLAIMER + "</aside><h2>Case " + text(run["input_snapshot"]["label"]) + "</h2><p>Analysis " + text(run["id"]) + " · " + text(run["created_at"]) + "</p>" + section("Input summary — notes are not interpreted", run["input_snapshot"]) + section("Versions and provenance", {k: run[k] for k in ("analysis_engine_version", "ruleset_version", "therapy_library_version", "configuration_hash", "input_hash", "explanation_provider", "explanation_model")}) + section("Analysis status", result["message"]) + section("Eligible candidates, evidence and uncertainty", [c for c in result["candidates"] if c["state"] in {"PARETO_OPTIMAL", "DOMINATED"}]) + section("Excluded / abstained candidates and safety flags", [c for c in result["candidates"] if c["state"] in {"EXCLUDED", "ABSTAINED"}]) + section("Missing data", result["missing_data"]) + section("Clinician review history", run["reviews"]) + "<p>Prototype uncertainty heuristic — not calibrated. No clinical validation has occurred.</p></body></html>"
