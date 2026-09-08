"""PRIVAVEDA Simulation Provenance Manifest.

Architectural Rule:
"Every simulation must be 100% reproducible and auditable."
Records exact cryptographic hashes of inputs, model version, solver parameters,
random seeds, and knowledge snapshots.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from app.security.crypto import compute_content_digest


@dataclass
class SimulationManifest:
    simulation_id: str
    patient_token: str
    input_object_hashes: dict[str, str]
    model_definition_version: str
    parameter_set_version: str
    knowledge_base_version: str
    rule_engine_version: str
    solver_name: str
    solver_tolerances: dict[str, float]
    random_seed: int
    llm_model_version_if_used: str | None
    code_revision: str
    timestamp: str
    manifest_hash: str = ""
    extra: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if not self.manifest_hash:
            payload = {
                "simulation_id": self.simulation_id,
                "patient_token": self.patient_token,
                "input_hashes": self.input_object_hashes,
                "model_version": self.model_definition_version,
                "parameter_version": self.parameter_set_version,
                "kb_version": self.knowledge_base_version,
                "rule_version": self.rule_engine_version,
                "solver": self.solver_name,
                "tolerances": self.solver_tolerances,
                "seed": self.random_seed,
                "llm": self.llm_model_version_if_used,
                "code": self.code_revision,
                "timestamp": self.timestamp
            }
            self.manifest_hash = compute_content_digest(payload)

    def to_dict(self) -> dict[str, Any]:
        return {
            "simulation_id": self.simulation_id,
            "patient_token": self.patient_token,
            "input_object_hashes": self.input_object_hashes,
            "model_definition_version": self.model_definition_version,
            "parameter_set_version": self.parameter_set_version,
            "knowledge_base_version": self.knowledge_base_version,
            "rule_engine_version": self.rule_engine_version,
            "solver_name": self.solver_name,
            "solver_tolerances": self.solver_tolerances,
            "random_seed": self.random_seed,
            "llm_model_version_if_used": self.llm_model_version_if_used,
            "code_revision": self.code_revision,
            "timestamp": self.timestamp,
            "manifest_hash": self.manifest_hash
        }


def create_manifest(
    patient_token: str,
    case_data: dict[str, Any],
    model_version: str,
    parameter_version: str,
    solver_name: str = "scipy.solve_ivp.RK45",
    solver_tolerances: dict[str, float] | None = None,
    seed: int = 42,
    llm_version: str | None = None
) -> SimulationManifest:
    """Creates an immutable provenance manifest for a simulation execution."""
    sim_id = f"SIM-{uuid4().hex[:12].upper()}"
    ts = datetime.now(timezone.utc).isoformat()
    tols = solver_tolerances or {"rtol": 1e-6, "atol": 1e-9}
    
    input_hashes = {
        "case_data_sha256": compute_content_digest(case_data),
        "parameter_vector_sha256": compute_content_digest({"version": parameter_version, "patient": patient_token})
    }
    
    return SimulationManifest(
        simulation_id=sim_id,
        patient_token=patient_token,
        input_object_hashes=input_hashes,
        model_definition_version=model_version,
        parameter_set_version=parameter_version,
        knowledge_base_version="kb-local-v1.0",
        rule_engine_version="deterministic-rules-v1.0",
        solver_name=solver_name,
        solver_tolerances=tols,
        random_seed=seed,
        llm_model_version_if_used=llm_version,
        code_revision="privaveda-fastarm-v2.0",
        timestamp=ts
    )
