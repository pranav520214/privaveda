from typing import Protocol


class UncertaintyEstimator(Protocol):
    def estimate(self, therapy: dict, warnings: int, missing: int) -> dict: ...


class PrototypeUncertainty:
    def estimate(self, therapy: dict, warnings: int, missing: int) -> dict:
        value = round(min(1, max(therapy["uncertainty"], 1 - therapy["evidence_quality"]) + 0.1 * warnings + 0.2 * missing), 4)
        return {"score": value, "category": "LOW_UNCERTAINTY" if value < 0.25 else "MODERATE_UNCERTAINTY" if value < 0.5 else "HIGH_UNCERTAINTY", "label": "Prototype uncertainty heuristic", "formula": "min(1, max(library uncertainty, 1 - evidence quality) + 0.10 × warnings + 0.20 × missing fields)", "calibrated": False}
