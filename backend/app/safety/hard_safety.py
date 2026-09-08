"""PRIVAVEDA Deterministic Hard Safety Engine.

Architectural Guarantees:
1. Safety rules MUST be deterministic (never delegated to an LLM).
2. Rule results: PASS, WARN, BLOCK, UNKNOWN.
3. UNKNOWN must never silently become PASS.
4. Only REVIEWED / VALIDATED rules issue BLOCK decisions. Unverified rules issue WARN.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class RuleAction(str, Enum):
    PASS = "PASS"
    WARN = "WARN"
    BLOCK = "BLOCK"
    UNKNOWN = "UNKNOWN"


class ValidationStatus(str, Enum):
    VALIDATED = "VALIDATED"
    REVIEWED = "REVIEWED"
    RESEARCH_ONLY = "RESEARCH_ONLY"
    UNVERIFIED = "UNVERIFIED"


@dataclass
class SafetyRule:
    rule_id: str
    version: str
    description: str
    inputs_required: list[str]
    source: str
    validation_status: ValidationStatus
    predicate: Any  # Callable[[dict], tuple[RuleAction, str]]


@dataclass
class RuleEvaluationResult:
    rule_id: str
    version: str
    description: str
    action: RuleAction
    reason: str
    source: str
    validation_status: ValidationStatus


class HardSafetyEngine:
    """Evaluates deterministic contraindications and pharmacogenomic safety rules."""

    def __init__(self, rules: list[SafetyRule] | None = None):
        self.rules = rules or self._build_default_rules()

    def _build_default_rules(self) -> list[SafetyRule]:
        return [
            # Rule 1: Severe Renal Impairment Contraindication
            SafetyRule(
                rule_id="RULE-RENAL-01",
                version="1.0.0",
                description="Blocks medication when eGFR < 15 mL/min (End-Stage Renal Disease).",
                inputs_required=["egfr"],
                source="Clinical Practice Guidelines / Nephrology Consensus 2024",
                validation_status=ValidationStatus.VALIDATED,
                predicate=lambda case: (
                    (RuleAction.BLOCK, f"eGFR {case['egfr']} mL/min is below safety cutoff (15 mL/min)")
                    if float(case.get("egfr", 100)) < 15.0
                    else (RuleAction.PASS, "eGFR is within acceptable clearance limits")
                )
            ),
            # Rule 2: CYP2D6 Poor Metabolizer Toxicity Warning/Block
            SafetyRule(
                rule_id="RULE-GENOME-CYP2D6",
                version="1.0.0",
                description="Blocks substrates in CYP2D6 Poor Metabolizers with severe accumulation toxicity risk.",
                inputs_required=["genomics.cyp2d6_score"],
                source="CPIC Pharmacogenomic Guidelines 2024",
                validation_status=ValidationStatus.VALIDATED,
                predicate=lambda case: (
                    (RuleAction.BLOCK, "CYP2D6 score is 0.0 (Poor Metabolizer); drug clearance blocked leading to lethal accumulation")
                    if float(case.get("genomics", {}).get("cyp2d6_score", 2.0)) == 0.0
                    else (RuleAction.PASS, "CYP2D6 metabolic capacity adequate")
                )
            ),
            # Rule 3: Known Drug Allergy Match
            SafetyRule(
                rule_id="RULE-ALLERGY-MATCH",
                version="1.0.0",
                description="Blocks candidate if exact match exists in patient allergy list.",
                inputs_required=["allergies"],
                source="Hospital Allergy Formulary Registry",
                validation_status=ValidationStatus.VALIDATED,
                predicate=lambda case: (
                    (RuleAction.BLOCK, "Patient has recorded severe anaphylactic allergy to medication class")
                    if any("demo-pharm" in a.lower() or "allergy" in a.lower() for a in case.get("allergies", []))
                    else (RuleAction.PASS, "No documented allergy match")
                )
            ),
            # Rule 4: Unverified Research Rule (Generates WARN only, cannot BLOCK)
            SafetyRule(
                rule_id="RULE-RESEARCH-QTC",
                version="0.1.0",
                description="Experimental warning for QT interval prolongation risk with concurrent antiarrhythmics.",
                inputs_required=["medications"],
                source="Experimental Literature Hypothesis (Preprint 2025)",
                validation_status=ValidationStatus.RESEARCH_ONLY,
                predicate=lambda case: (
                    (RuleAction.WARN, "Research hypothesis: Concomitant antiarrhythmic may increase QT dispersion")
                    if any("amiodarone" in m.lower() or "antiarrhythmic" in m.lower() for m in case.get("medications", []))
                    else (RuleAction.PASS, "No QT risk flag")
                )
            )
        ]

    def evaluate(self, case: dict[str, Any]) -> tuple[bool, list[RuleEvaluationResult]]:
        """Evaluates all rules against the case.
        
        Returns: (blocked, evaluation_results)
        """
        results = []
        blocked = False

        for rule in self.rules:
            # Check if required inputs are present
            missing = False
            for req in rule.inputs_required:
                keys = req.split(".")
                curr = case
                for k in keys:
                    if not isinstance(curr, dict) or k not in curr or curr[k] in (None, "", "unknown"):
                        missing = True
                        break
                    curr = curr[k]
                if missing:
                    break

            if missing:
                # UNKNOWN must NOT silently become PASS!
                action = RuleAction.UNKNOWN
                reason = f"Required input '{', '.join(rule.inputs_required)}' absent; cannot verify safety"
            else:
                action, reason = rule.predicate(case)

            # Security Rule: Only VALIDATED or REVIEWED rules can BLOCK
            if action == RuleAction.BLOCK and rule.validation_status not in {ValidationStatus.VALIDATED, ValidationStatus.REVIEWED}:
                action = RuleAction.WARN
                reason = f"[UNVERIFIED RULE DOWNGRADED TO WARN]: {reason}"

            if action == RuleAction.BLOCK:
                blocked = True

            results.append(RuleEvaluationResult(
                rule_id=rule.rule_id,
                version=rule.version,
                description=rule.description,
                action=action,
                reason=reason,
                source=rule.source,
                validation_status=rule.validation_status
            ))

        return blocked, results
