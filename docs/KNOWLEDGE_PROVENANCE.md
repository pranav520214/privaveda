# PRIVAVEDA Knowledge & Provenance Architecture

> **Axiom:** "Do not silently treat random documents as clinical truth."

---

## 1. Local Knowledge Base Metadata Standard

Every evidence object in PRIVAVEDA requires the following mandatory metadata attributes:

- `id`: Unique identifier (e.g. `EVID-CPIC-CYP2D6`).
- `title`: Descriptive scientific title.
- `source`: Authoritative issuing body (e.g. CPIC, FDA, PharmGKB).
- `source_type`: Category (`CPIC_GUIDELINE`, `FDA_LABEL`, `PEER_REVIEWED_LITERATURE`, `DEMO_FIXTURE`).
- `version`: Release revision.
- `doc_date`: Official publication date.
- `retrieved_at`: ISO 8601 UTC timestamp of local ingestion.
- `content_hash`: SHA-256 digest of sanitized canonical document content.
- `validation_status`: Explicit classification tier:
  - `VALIDATED_FOR_DEMO`: Reviewed benchmark fixtures.
  - `REVIEWED`: Clinically vetted evidence.
  - `RESEARCH_ONLY`: Experimental literature hypotheses (generates `WARN`, cannot `BLOCK`).
  - `UNVERIFIED`: Ingested draft material (cannot govern safety rules).
  - `SUPERSEDED`: Obsolete versions (automatically excluded from queries).
- `domain`: Therapeutic area (e.g. `PHARMACOGENOMICS`, `RENAL_CLEARANCE`).
- `citation`: Formal literature reference citation.
- `superseded_by`: Optional successor document ID.
- `review_status`: Editorial verification state (`PASSED`, `PENDING`, `REJECTED`).

---

## 2. RAG Citation and Abstention Policy

1. **Mandatory Citations:** Any language model explanation or candidate evaluation referencing clinical rationale must provide explicit local document IDs.
2. **Missing Evidence Abstention:** If a query cannot locate reviewed/validated evidence in the local database, the engine returns `ABSTAIN` ("Insufficient validated evidence for recommendation").
3. **Data, Not Instructions:** Retrieved documents are treated strictly as passive data. Embedded command patterns or instructions are stripped prior to model ingestion.
