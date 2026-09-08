"""PRIVAVEDA Candidate Scenario Engine.

Safety Boundary:
"The system must NOT autonomously generate arbitrary prescribing instructions.
Scenarios are clinician-defined or predefined research hypotheses."
Language is strictly observational:
"Simulation scenario A produced..."
NEVER: "Patient should take X."
"""
from dataclasses import dataclass, field
from typing import Any
from app.twin.models.base import Intervention


@dataclass
class CandidateScenario:
    scenario_id: str
    name: str
    description: str
    intervention: Intervention
    target_window: tuple[float, float, float]  # (c_min_target, c_max_target, c_toxic) in mg/L
    interaction_score: float = 0.0             # 0.0 (none) to 1.0 (severe interaction)
    evidence_quality: float = 0.90             # 0.0 to 1.0
    ruleset_id: str = "RULES_CARDIO_V1"
    metadata: dict[str, Any] = field(default_factory=dict)


def get_default_research_scenarios(drug_name: str = "DEMO-PHARM-X") -> list[CandidateScenario]:
    """Returns standard abstract clinician-defined candidate scenarios."""
    return [
        CandidateScenario(
            scenario_id="SCENARIO_A",
            name=f"Scenario A: Standard Regimen (100mg Oral Q12H)",
            description=f"Standard reference simulation for {drug_name} at conventional label dosing.",
            intervention=Intervention(dose_mg=100.0, route="oral", repeat_interval_h=12.0, num_doses=2),
            target_window=(1.0, 10.0, 15.0),
            interaction_score=0.15,
            evidence_quality=0.92
        ),
        CandidateScenario(
            scenario_id="SCENARIO_B",
            name=f"Scenario B: Renal Dose Reduction (50mg Oral Q12H)",
            description=f"Simulated 50% dose reduction for {drug_name} intended for reduced clearance phenotypes.",
            intervention=Intervention(dose_mg=50.0, route="oral", repeat_interval_h=12.0, num_doses=2),
            target_window=(1.0, 10.0, 15.0),
            interaction_score=0.15,
            evidence_quality=0.88
        ),
        CandidateScenario(
            scenario_id="SCENARIO_C",
            name=f"Scenario C: Extended Interval Regimen (100mg Oral Q24H)",
            description=f"Simulated once-daily interval extension for {drug_name}.",
            intervention=Intervention(dose_mg=100.0, route="oral", repeat_interval_h=24.0, num_doses=1),
            target_window=(1.0, 10.0, 15.0),
            interaction_score=0.15,
            evidence_quality=0.80
        )
    ]
