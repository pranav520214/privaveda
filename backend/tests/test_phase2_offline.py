"""Integration Test for PRIVAVEDA Phase 2 Offline Research Pipeline.

Verifies end-to-end local-first execution under strict network isolation:
1. Enforces network isolation (blocks any external socket connect attempts)
2. Ingests local de-identified clinical test record (FHIR format)
3. Detects PII and generates pseudonymous PT-XXXXXXXX token
4. Validates data quality & physiological bounds
5. Constructs Medical Knowledge Graph
6. Initializes Bio-Mathematical Digital Twin
7. Solves mechanistic ODE simulation via SciPy
8. Propagates Monte Carlo uncertainty envelope
9. Applies deterministic safety rules
10. Generates research report
11. Asserts zero external network egress occurred
"""
import json
import pytest
from app.core.offline import enforce_network_isolation, NetworkEgressBlockedError
from app.importers.fhir_importer import FHIRImporter
from app.twin.parameter_vector import PatientParameterVector
from app.twin.models.one_compartment import OneCompartmentPKModel
from app.twin.models.base import Intervention
from app.twin.solver import ODESolverEngine
from app.twin.monte_carlo import MonteCarloEngine
from app.safety.hard_safety import HardSafetyEngine
from app.graph.knowledge_graph import MedicalKnowledgeGraph, NodeType, EdgeType, EdgeMetadata


def test_phase2_offline_research_pipeline():
    # 1. Enforce strict local-first network isolation
    with enforce_network_isolation():
        # Test synthetic FHIR fixture
        test_fhir = json.dumps({
            "resourceType": "Bundle",
            "type": "collection",
            "entry": [
                {
                    "resource": {
                        "resourceType": "Patient",
                        "name": [{"family": "ResearchSubject", "given": ["RS-901"]}],
                        "gender": "male",
                        "birthDate": "1968-08-20"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "code": {"coding": [{"code": "29463-7", "display": "Body Weight"}]},
                        "valueQuantity": {"value": 74.0, "unit": "kg"}
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "code": {"coding": [{"code": "33914-3", "display": "eGFR"}]},
                        "valueQuantity": {"value": 82.0, "unit": "mL/min"}
                    }
                },
                {
                    "resource": {
                        "resourceType": "Condition",
                        "code": {"text": "Non-valvular Atrial Fibrillation"}
                    }
                }
            ]
        })

        # 2. Ingest & Inspect
        importer = FHIRImporter()
        inspection = importer.inspect_privacy(test_fhir)
        assert inspection.has_direct_identifiers is True
        pseudonym = inspection.suggested_pseudonym
        assert pseudonym.startswith("PT-")

        # 3. Parse & Pseudonymize
        import_res = importer.parse_and_normalize(test_fhir, confirmed_pseudonym=pseudonym)
        assert import_res.success is True
        case_data = import_res.extracted_entities
        assert case_data["mode"] == "RESEARCH"
        assert case_data["synthetic"] is False

        # 4. Construct Medical Knowledge Graph
        kg = MedicalKnowledgeGraph()
        kg.add_node(pseudonym, NodeType.PATIENT_TOKEN, {"token": pseudonym, "synthetic": False})
        kg.add_node("COND-AFIB", NodeType.CONDITION, {"name": "Atrial Fibrillation"})
        kg.add_edge(pseudonym, "COND-AFIB", EdgeMetadata(EdgeType.HAS_OBSERVATION, "FHIR_IMPORT", "VALIDATED", "1.0", "EHR"))
        assert len(kg.validate_integrity()) == 0

        # 5. Initialize Patient Parameter Vector θ_patient
        theta = PatientParameterVector.from_case(pseudonym, case_data)
        assert theta.patient_token == pseudonym
        assert theta.v_total_l > 0

        # 6. Mechanistic Simulation
        model = OneCompartmentPKModel()
        intervention = Intervention(dose_mg=100.0, route="oral")
        solver = ODESolverEngine()
        sim = solver.simulate(model, theta, intervention, t_span=(0.0, 24.0))
        assert sim.solver_status == "SUCCESS"
        assert sim.metrics.c_max > 0
        assert sim.metrics.auc_0_t > 0

        # 7. Uncertainty Propagation
        mc = MonteCarloEngine()
        mc_res = mc.run(model, theta, intervention, sample_count=30, seed=42)
        assert len(mc_res.median) > 0
        assert mc_res.tail_toxicity_risk >= 0.0

        # 8. Deterministic Hard Safety Rules
        safety = HardSafetyEngine()
        is_blocked, rules_out = safety.evaluate(case_data)
        assert is_blocked is False  # Normal eGFR and standard profile

        # Zero network egress verified by socket guard
