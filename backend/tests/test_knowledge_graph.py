"""Tests for Medical Knowledge Graph in PRIVAVEDA."""
import pytest
from app.graph.knowledge_graph import MedicalKnowledgeGraph, NodeType, EdgeType, EdgeMetadata


def test_graph_node_and_edge_creation():
    kg = MedicalKnowledgeGraph()
    pt = "PT-ALICE-1234"
    kg.add_node(pt, NodeType.PATIENT_TOKEN, {"synthetic": True})
    kg.add_node("DRUG-WARFARIN", NodeType.MEDICATION_ENTITY, {"name": "Warfarin"})
    kg.add_node("ENZ-CYP2C9", NodeType.ENZYME, {"symbol": "CYP2C9"})

    meta = EdgeMetadata(
        relation=EdgeType.METABOLIZED_BY,
        provenance="CPIC_GUIDELINE_2024",
        confidence_class="VALIDATED",
        version="1.0",
        source_identifier="CPIC-009"
    )
    kg.add_edge("DRUG-WARFARIN", "ENZ-CYP2C9", meta)

    pathways = kg.get_metabolic_pathways("DRUG-WARFARIN")
    assert len(pathways) == 1
    assert pathways[0] == ("ENZ-CYP2C9", "VALIDATED")


def test_graph_forbids_direct_identity():
    kg = MedicalKnowledgeGraph()
    
    # Must reject if node contains direct patient identity
    with pytest.raises(ValueError, match="Direct patient identity fields"):
        kg.add_node("PT-001", NodeType.PATIENT_TOKEN, {"mrn": "MRN-12345", "name": "Real Patient"})

    # Must reject if patient token does not start with PT-
    with pytest.raises(ValueError, match="must be a pseudonymous token"):
        kg.add_node("JohnDoe", NodeType.PATIENT_TOKEN)


def test_graph_integrity_validation():
    kg = MedicalKnowledgeGraph()
    # Add an isolated patient token
    kg.add_node("PT-ISOLATED-01", NodeType.PATIENT_TOKEN)
    
    issues = kg.validate_integrity()
    assert len(issues) > 0
    assert any("isolated" in iss for iss in issues)
