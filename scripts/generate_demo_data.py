"""Build fictional fixtures. Scores and rules have no clinical meaning."""
import json
from pathlib import Path
from datetime import date

root = Path(__file__).resolve().parents[1] / "data"
source = "local-demo://fictional-design-fixture-v1"
rules = [
    {"rule_id": "DEMO-HISTORY-01", "kind": "contraindication", "field": "history", "key": "", "operator": "contains", "value": "demo-block-a", "action": "BLOCK", "reason": "Synthetic history flag excludes this fictional option", "source": source},
    {"rule_id": "DEMO-INTERACTION-01", "kind": "interaction", "field": "medications", "key": "", "operator": "contains", "value": "DEMO Med-X", "action": "BLOCK", "reason": "Fictional medication pairing is excluded by the demo rule", "source": source},
    {"rule_id": "DEMO-GENOMIC-01", "kind": "genomic", "field": "genomics", "key": "DEMO-G1", "operator": "equals", "value": "flagged", "action": "BLOCK", "reason": "Synthetic genomic marker excludes this fictional option; no real genetic association", "source": source},
]
therapies = []
for i, (name, efficacy, toxicity, interaction, quality, uncertainty) in enumerate([
    ("DEMO Atlas", .86, .32, .18, .9, .16),
    ("DEMO Birch", .74, .16, .1, .88, .12),
    ("DEMO Cedar", .64, .38, .25, .76, .25),
    ("DEMO Delta", .91, .49, .22, .85, .2),
    ("DEMO Elm", .81, .28, .12, .45, .55),
]):
    therapies.append({"name": name, "indication": "DEMO-CONTEXT-A", "approved_context": "DEMO-CONTEXT-A", "validation_status": "DEMO_APPROVED", "evidence_status": "DEMO_APPROVED", "evidence_quality": quality, "source_reference": source, "evidence": [{"reference": f"FIXTURE-{i+1:03}", "title": f"Fictional {name} design fixture — not medical evidence", "source": source, "status": "DEMO_APPROVED"}], "rules": [rules[0]] if i == 0 else [rules[1]] if i == 1 else [rules[2]] if i == 3 else [], "required_observations": ["labs.DEMO-LAB", "organ_function.DEMO-ORGAN"], "efficacy_demo_score": efficacy, "toxicity_demo_score": toxicity, "interaction_demo_score": interaction, "uncertainty": uncertainty, "last_reviewed": date.today().isoformat(), "rule_conflict": False, "score_label": "DEMO_SCORE"})
therapies.append({**therapies[4], "name": "DEMO Flint", "indication": "DEMO-CONTEXT-B", "approved_context": "DEMO-CONTEXT-B", "evidence_status": "MISSING", "evidence": []})
cases = []
scenarios = ["Baseline eligible comparison", "Hard contraindication", "Medication interaction", "Insufficient evidence", "Missing required observations", "Multiple Pareto options", "Clinician rejection example", "Approved for further review example", "Unsupported context", "Genomic exclusion and allergy"]
for i, scenario in enumerate(scenarios, 1):
    c = {"label": f"SYN-{i:03}", "synthetic": True, "age_band": ["40-64", "65+", "18-39"][(i-1)%3], "sex": "unspecified", "condition": "DEMO-CONTEXT-A", "history": [], "medications": [], "allergies": [], "labs": {"DEMO-LAB": 72.0}, "genomics": {"DEMO-G1": "unflagged"}, "organ_function": {"DEMO-ORGAN": "available"}, "notes": scenario + ". SYNTHETIC PATIENT — NOT REAL DATA. Notes are not interpreted by the engine."}
    if i == 2: c["history"] = ["demo-block-a"]
    if i == 3: c["medications"] = ["DEMO Med-X"]
    if i == 4: c["condition"] = "DEMO-CONTEXT-B"
    if i == 5: c["labs"] = {}
    if i == 9: c["condition"] = "DEMO-UNSUPPORTED"
    if i == 10:
        c["genomics"] = {"DEMO-G1": "flagged"}
        c["allergies"] = ["DEMO Atlas"]
    cases.append(c)
for folder, filename, data in [("demo_cases", "cases.json", cases), ("demo_therapy_library", "therapies.json", therapies)]:
    (root / folder).mkdir(parents=True, exist_ok=True)
    (root / folder / filename).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
