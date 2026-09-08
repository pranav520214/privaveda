from typing import Any


def observation(case: dict, path: str) -> Any:
    current: Any = case
    for key in path.split("."):
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def evaluate(case: dict, therapy: dict) -> dict:
    flags, evaluated, missing = [], [], []
    for path in therapy["required_observations"]:
        if observation(case, path) in (None, "", "unknown"):
            missing.append(path)
    # Allergy matching is exact, structured and fictional. No synonym inference.
    if therapy["name"].casefold() in {a.casefold() for a in case["allergies"]}:
        flags.append({"rule_id": "DEMO-ALLERGY", "action": "BLOCK", "reason": "Exact synthetic therapy allergy match", "source": "synthetic-demo-v1/allergy", "input": therapy["name"]})
    evaluated.append({"rule_id": "DEMO-ALLERGY", "triggered": bool(flags)})
    for rule in therapy["rules"]:
        path = rule["field"] + ("." + rule["key"] if rule["key"] else "")
        value = observation(case, path)
        if value in (None, "", "unknown"):
            missing.append(path)
            evaluated.append({"rule_id": rule["rule_id"], "triggered": False, "missing": path})
            continue
        op, target = rule["operator"], rule["value"]
        try:
            match = (target in value if op == "contains" else value == target if op == "equals" else float(value) < float(target) if op == "lt" else float(value) > float(target) if op == "gt" else None)
        except (TypeError, ValueError):
            match = None
        if match is None:
            missing.append("unsupported-rule:" + rule["rule_id"])
        evaluated.append({"rule_id": rule["rule_id"], "triggered": bool(match), "source": rule["source"]})
        if match:
            flags.append({**rule, "input": value})
    # Conflicting actions for an identical predicate are never resolved by a score.
    predicates: dict[str, set[str]] = {}
    for r in therapy["rules"]:
        key = str((r["field"], r["key"], r["operator"], r["value"]))
        predicates.setdefault(key, set()).add(r["action"])
    conflict = therapy["rule_conflict"] or any(len(v) > 1 for v in predicates.values())
    return {"flags": flags, "evaluated_rules": evaluated, "missing_data": sorted(set(missing)), "blocked": any(f["action"] == "BLOCK" for f in flags), "conflict": conflict}
