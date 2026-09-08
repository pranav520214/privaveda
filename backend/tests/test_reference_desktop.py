"""ECC RED guarantees for local references and source-constrained medical inference."""
import json
from pathlib import Path
import pytest
from app.reference.catalog import ReferenceCatalog, normalized_label
from app.reference.local_model import validate_selection, validate_model_manifest


def label(id="label-1", name="Example drug"):
    return {"id": id, "set_id": "set-1", "effective_time": "20260901", "openfda": {"brand_name": [name], "generic_name": ["Example ingredient"]}, "indications_and_usage": ["Source indication text."], "warnings": ["Source warning text."], "dosage_and_administration": ["Never use source dosage as autonomous advice."]}


def test_reference_index_search_and_provenance(tmp_path):
    catalog = ReferenceCatalog(tmp_path / "reference.sqlite")
    catalog.initialize()
    catalog.ingest([label()], "https://download.open.fda.gov/drug/label/test.json.zip", "test-hash", "2026-09-07")
    assert catalog.count() == 1
    found = catalog.search("Example ingredient")
    assert found[0]["id"] == "label-1"
    full = catalog.get("label-1")
    assert full["source_url"].startswith("https://dailymed.nlm.nih.gov/")
    assert full["archive_sha256"] == "test-hash"
    assert full["sections"]["warnings"] == "Source warning text."
    assert full["validation_status"] == "REFERENCE_ONLY_NOT_CLINICALLY_APPROVED"


@pytest.mark.parametrize("query", ['" OR *', "NEAR()", "x' UNION SELECT * FROM sqlite_master--", "", "a" * 501])
def test_search_does_not_execute_sql_or_fts_syntax(tmp_path, query):
    catalog = ReferenceCatalog(tmp_path / "reference.sqlite")
    catalog.initialize()
    catalog.ingest([label()], "source", "hash", "2026-09-07")
    assert isinstance(catalog.search(query), list)
    assert catalog.count() == 1


def test_missing_reference_returns_none_and_duplicate_import_is_idempotent(tmp_path):
    catalog = ReferenceCatalog(tmp_path / "reference.sqlite")
    catalog.initialize()
    for _ in range(2):
        catalog.ingest([label()], "source", "hash", "2026-09-07")
    assert catalog.count() == 1
    assert catalog.get("not-found") is None


def test_source_label_html_is_plain_text():
    data = label(name="<script>untrusted</script>")
    data["warnings"] = ["<b>Warning</b> &amp; review"]
    assert normalized_label(data)["sections"]["warnings"] == "Warning & review"


@pytest.mark.parametrize("output", ['{"indices":[999]}', '{"indices":[true]}', '{"indices":[0],"diagnosis":"invented"}', 'Take a fabricated medication', '{"indices":[]}'])
def test_model_cannot_invent_evidence(output):
    with pytest.raises(ValueError):
        validate_selection(output, ["Known evidence."])


def test_model_can_only_select_supplied_sentences():
    assert validate_selection('{"indices":[1,0,1]}', ["A", "B"]) == ["B", "A"]


def test_strict_two_billion_parameter_ceiling():
    with pytest.raises(ValueError):
        validate_model_manifest({"parameter_count": 2031739904, "sha256": "a" * 64})
    validate_model_manifest({"parameter_count": 1543714304, "sha256": "a" * 64})
