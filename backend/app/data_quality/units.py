"""PRIVAVEDA Unit-Aware Quantity Engine.

Powered by Pint.
Architectural Guarantee:
"Never compare raw numerical values with mismatched units."
Validates physical dimensions and converts clinical observations to canonical simulation units.
"""
from typing import Any
import pint

# Global singleton UnitRegistry
ureg = pint.UnitRegistry()
Q_ = ureg.Quantity

# Canonical simulation units
CANONICAL_UNITS = {
    "concentration": "mg / L",
    "clearance": "L / h",
    "volume": "L",
    "mass": "mg",
    "time": "h",
    "rate": "mg / h",
    "flow": "L / h",
    "dimensionless": ""
}


class UnitError(ValueError):
    """Raised when unit parsing or dimensionality validation fails."""
    pass


def parse_quantity(value: float, unit_str: str) -> pint.Quantity:
    """Parses a numerical value with an explicit unit string."""
    try:
        clean_unit = unit_str.strip()
        if not clean_unit or clean_unit.lower() in {"unitless", "dimensionless", "none", "ratio"}:
            return Q_(value, ureg.dimensionless)
        return Q_(value, ureg.parse_units(clean_unit))
    except Exception as exc:
        raise UnitError(f"Failed to parse unit '{unit_str}': {exc}") from exc


def validate_unit_dimension(unit_str: str, expected_category: str) -> bool:
    """Checks if a unit string matches the expected physical dimensionality."""
    if expected_category not in CANONICAL_UNITS:
        raise UnitError(f"Unknown physical dimension category: {expected_category}")
    
    canonical = CANONICAL_UNITS[expected_category]
    if canonical == "":
        return unit_str.strip().lower() in {"", "unitless", "dimensionless", "none", "ratio"}
    
    try:
        q_test = parse_quantity(1.0, unit_str)
        q_target = parse_quantity(1.0, canonical)
        return q_test.dimensionality == q_target.dimensionality
    except Exception:
        return False


def convert_to_canonical(value: float, unit_str: str, category: str) -> float:
    """Converts a value with its source unit into the canonical simulation unit."""
    if not validate_unit_dimension(unit_str, category):
        raise UnitError(f"Unit '{unit_str}' is incompatible with required physical dimension '{category}'")
    
    target_unit = CANONICAL_UNITS[category]
    if target_unit == "":
        return float(value)
    
    q_src = parse_quantity(value, unit_str)
    q_conv = q_src.to(target_unit)
    return float(q_conv.magnitude)


def compare_quantities(v1: float, u1: str, v2: float, u2: str) -> int:
    """Safely compares two unit-aware quantities.
    
    Returns:
       -1 if q1 < q2
        0 if q1 == q2
        1 if q1 > q2
    Raises UnitError if dimensions are incompatible.
    """
    q1 = parse_quantity(v1, u1)
    q2 = parse_quantity(v2, u2)
    if q1.dimensionality != q2.dimensionality:
        raise UnitError(f"Cannot compare quantities with incompatible dimensions: '{u1}' ({q1.dimensionality}) vs '{u2}' ({q2.dimensionality})")
    
    diff = (q1 - q2).magnitude
    if abs(diff) < 1e-9:
        return 0
    return 1 if diff > 0 else -1
