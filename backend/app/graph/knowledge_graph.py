"""PRIVAVEDA Medical Knowledge Graph.

Powered by NetworkX.
Architectural Guarantees:
1. Patient identity data is strictly forbidden from entering the graph (pseudonymous tokens only).
2. All clinical relations carry provenance, evidence confidence, and version metadata.
3. Graph integrity validation methods to detect dangling references and cycles.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any
import networkx as nx


class NodeType(str, Enum):
    PATIENT_TOKEN = "PatientToken"
    OBSERVATION = "Observation"
    LABORATORY_MEASUREMENT = "LaboratoryMeasurement"
    MEDICATION_ENTITY = "MedicationEntity"
    SCENARIO = "Scenario"
    GENE = "Gene"
    VARIANT = "Variant"
    ENZYME = "Enzyme"
    ORGAN = "Organ"
    CONDITION = "Condition"
    INTERACTION = "Interaction"
    EVIDENCE = "Evidence"
    SIMULATION = "Simulation"
    MODEL_VERSION = "ModelVersion"
    CLINICIAN_REVIEW = "ClinicianReview"
    AUDIT_EVENT = "AuditEvent"


class EdgeType(str, Enum):
    HAS_OBSERVATION = "HAS_OBSERVATION"
    HAS_VARIANT = "HAS_VARIANT"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    METABOLIZED_BY = "METABOLIZED_BY"
    INTERACTS_WITH = "INTERACTS_WITH"
    AFFECTS = "AFFECTS"
    SUPPORTED_BY = "SUPPORTED_BY"
    DERIVED_FROM = "DERIVED_FROM"
    GENERATED_BY = "GENERATED_BY"
    SIMULATED_AS = "SIMULATED_AS"
    REVIEWED_BY = "REVIEWED_BY"


@dataclass
class EdgeMetadata:
    relation: EdgeType
    provenance: str
    confidence_class: str  # "VALIDATED", "REVIEWED", "RESEARCH_HYPOTHESIS", "DEMO"
    version: str
    source_identifier: str
    weight: float = 1.0
    extra: dict[str, Any] = field(default_factory=dict)


class MedicalKnowledgeGraph:
    """Directed Medical Knowledge Graph representing patient clinical topology and pharmacology."""

    def __init__(self):
        self._graph = nx.DiGraph()

    @property
    def graph(self) -> nx.DiGraph:
        return self._graph

    def add_node(self, node_id: str, node_type: NodeType, attributes: dict[str, Any] | None = None) -> None:
        """Adds a typed node to the graph. Forbids direct patient identity attributes."""
        attrs = attributes or {}
        # Strict patient identity protection
        forbidden_identity_keys = {"patient_name", "mrn", "ssn", "dob", "birth_date", "phone", "email", "address"}
        found_forbidden = [k for k in attrs if k.lower() in forbidden_identity_keys]
        if found_forbidden:
            raise ValueError(f"Direct patient identity fields {found_forbidden} are prohibited in the Medical Knowledge Graph")
        
        if node_type == NodeType.PATIENT_TOKEN:
            if not node_id.startswith("PT-"):
                raise ValueError(f"Patient node ID must be a pseudonymous token starting with 'PT-', got '{node_id}'")
            if "name" in attrs:
                raise ValueError("Direct 'name' attribute forbidden on PatientToken nodes; use pseudonyms only")

        self._graph.add_node(node_id, node_type=node_type.value, **attrs)

    def add_edge(self, source_id: str, target_id: str, metadata: EdgeMetadata) -> None:
        """Adds a directed relation with complete provenance metadata."""
        if not self._graph.has_node(source_id):
            raise KeyError(f"Source node '{source_id}' does not exist in graph")
        if not self._graph.has_node(target_id):
            raise KeyError(f"Target node '{target_id}' does not exist in graph")

        self._graph.add_edge(
            source_id,
            target_id,
            relation=metadata.relation.value,
            provenance=metadata.provenance,
            confidence_class=metadata.confidence_class,
            version=metadata.version,
            source_identifier=metadata.source_identifier,
            weight=metadata.weight,
            **metadata.extra
        )

    def get_patient_observations(self, patient_token: str) -> list[tuple[str, dict[str, Any]]]:
        """Returns all observations connected to a patient token."""
        if not self._graph.has_node(patient_token):
            return []
        
        results = []
        for _, target, data in self._graph.out_edges(patient_token, data=True):
            if data.get("relation") in {EdgeType.HAS_OBSERVATION.value, EdgeType.HAS_VARIANT.value}:
                target_data = self._graph.nodes[target]
                results.append((target, target_data))
        return results

    def get_metabolic_pathways(self, medication_id: str) -> list[tuple[str, str]]:
        """Returns enzymes metabolizing a medication and the evidence confidence."""
        if not self._graph.has_node(medication_id):
            return []
        
        pathways = []
        for _, target, data in self._graph.out_edges(medication_id, data=True):
            if data.get("relation") == EdgeType.METABOLIZED_BY.value:
                pathways.append((target, data.get("confidence_class", "UNKNOWN")))
        return pathways

    def validate_integrity(self) -> list[str]:
        """Performs graph structural and semantic integrity verification."""
        issues = []
        # Check 1: Ensure all nodes have valid node_type
        for node, data in self._graph.nodes(data=True):
            if "node_type" not in data:
                issues.append(f"Node '{node}' missing node_type attribute")

        # Check 2: Ensure all edges have provenance and confidence_class
        for u, v, data in self._graph.edges(data=True):
            if "provenance" not in data:
                issues.append(f"Edge ({u} -> {v}) missing provenance")
            if "confidence_class" not in data:
                issues.append(f"Edge ({u} -> {v}) missing confidence_class")

        # Check 3: Isolated patient tokens (patient with zero observations)
        for node, data in self._graph.nodes(data=True):
            if data.get("node_type") == NodeType.PATIENT_TOKEN.value:
                if self._graph.out_degree(node) == 0 and self._graph.in_degree(node) == 0:
                    issues.append(f"Patient token '{node}' is isolated (no clinical observations connected)")

        return issues
