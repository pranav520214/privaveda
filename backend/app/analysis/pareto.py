def objectives(candidate: dict) -> tuple:
    s = candidate["scores"]
    return (-s["efficacy"], -s["evidence_quality"], s["toxicity"], s["interaction"], candidate["uncertainty"]["score"])


def rank(candidates: list[dict]) -> None:
    eligible = [c for c in candidates if c["state"] == "ELIGIBLE"]
    for candidate in eligible:
        a = objectives(candidate)
        dominated = any(all(x <= y for x, y in zip(objectives(other), a)) and any(x < y for x, y in zip(objectives(other), a)) for other in eligible if other is not candidate)
        candidate["state"] = "DOMINATED" if dominated else "PARETO_OPTIMAL"
        candidate["rank_reason"] = "Another eligible option is at least as good on all five demo objectives and better on at least one." if dominated else "No eligible option improves one demo objective without worsening another. No single best therapy is implied."
