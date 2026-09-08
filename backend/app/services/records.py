from sqlalchemy import delete
from app.models import ClinicalObservation, GenomicObservation, LabObservation, MedicationRecord, TherapyEvidence, ContraindicationRule, InteractionRule, GenomicRule


def sync_case(db, case):
    mappings = [(ClinicalObservation, "organ_function"), (GenomicObservation, "genomics"), (LabObservation, "labs"), (MedicationRecord, "medications")]
    for model, field in mappings:
        db.execute(delete(model).where(model.case_id == case.id))
        values = case.data[field]
        records = [{"key": k, "value": v} for k, v in values.items()] if isinstance(values, dict) else [{"name": v} for v in values]
        if model == ClinicalObservation:
            records += [{"history": v} for v in case.data["history"]] + [{"allergy": v} for v in case.data["allergies"]]
        for data in records:
            db.add(model(case_id=case.id, data=data))


def sync_therapy(db, therapy):
    for model in (TherapyEvidence, ContraindicationRule, InteractionRule, GenomicRule):
        db.execute(delete(model).where(model.therapy_id == therapy.id))
    for evidence in therapy.data["evidence"]:
        db.add(TherapyEvidence(therapy_id=therapy.id, data=evidence, source=evidence["source"], validation_status=evidence["status"]))
    models = {"contraindication": ContraindicationRule, "interaction": InteractionRule, "genomic": GenomicRule}
    for rule in therapy.data["rules"]:
        db.add(models[rule["kind"]](therapy_id=therapy.id, data=rule, source=rule["source"], validation_status=therapy.validation_status))
