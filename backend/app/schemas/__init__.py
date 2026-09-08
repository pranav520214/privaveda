from datetime import date, datetime
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

Short = Annotated[str, Field(min_length=1, max_length=100)]
Score = Annotated[float, Field(ge=0, le=1, allow_inf_nan=False)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CaseInput(StrictModel):
    label: Short
    synthetic: Literal[True] = True
    age_band: Literal["18-39", "40-64", "65+", "unknown"] = "40-64"
    sex: Literal["female", "male", "unspecified"] = "unspecified"
    condition: Short
    history: list[Short] = Field(default_factory=list, max_length=30)
    medications: list[Short] = Field(default_factory=list, max_length=30)
    allergies: list[Short] = Field(default_factory=list, max_length=30)
    labs: dict[Short, Annotated[float, Field(allow_inf_nan=False)]] = Field(default_factory=dict, max_length=30)
    genomics: dict[Short, Short] = Field(default_factory=dict, max_length=30)
    organ_function: dict[Short, Short] = Field(default_factory=dict, max_length=30)
    notes: str = Field(default="", max_length=2000)
    revision: int | None = Field(default=None, ge=1)


class Evidence(StrictModel):
    reference: Short
    title: str = Field(min_length=1, max_length=300)
    source: str = Field(min_length=1, max_length=500)
    status: Literal["DEMO_APPROVED", "MISSING", "CONFLICTING", "INVALID"]


class Rule(StrictModel):
    rule_id: Short
    kind: Literal["contraindication", "interaction", "genomic"]
    field: Literal["history", "medications", "allergies", "genomics", "organ_function", "labs", "age_band", "sex"]
    key: str = Field(default="", max_length=100)
    operator: Literal["contains", "equals", "lt", "gt"]
    value: str | Annotated[float, Field(allow_inf_nan=False)]
    action: Literal["BLOCK", "WARN"] = "BLOCK"
    reason: str = Field(min_length=1, max_length=500)
    source: str = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def supported_combination(self):
        lists = {"history", "medications", "allergies"}
        if self.field in lists and (self.operator != "contains" or not isinstance(self.value, str)):
            raise ValueError("List rules require contains and a string")
        if self.field == "labs" and (self.operator not in {"lt", "gt"} or not isinstance(self.value, (int, float))):
            raise ValueError("Lab rules require a numeric lt/gt comparison")
        if self.field in {"genomics", "organ_function", "age_band", "sex"} and (self.operator != "equals" or not isinstance(self.value, str)):
            raise ValueError("Categorical rules require equals and a string")
        if self.field in {"genomics", "organ_function", "labs"} and not self.key:
            raise ValueError("Observation rules require a key")
        return self


class TherapyInput(StrictModel):
    name: str = Field(min_length=5, max_length=100, pattern=r"^DEMO .+")
    indication: Short
    approved_context: Short
    validation_status: Literal["DEMO_APPROVED", "DRAFT", "RETIRED"] = "DRAFT"
    evidence_status: Literal["DEMO_APPROVED", "MISSING", "CONFLICTING", "INVALID"] = "MISSING"
    evidence_quality: Score
    source_reference: str = Field(min_length=1, max_length=500)
    evidence: list[Evidence] = Field(default_factory=list, max_length=30)
    rules: list[Rule] = Field(default_factory=list, max_length=50)
    required_observations: list[Short] = Field(default_factory=list, max_length=30)
    efficacy_demo_score: Score
    toxicity_demo_score: Score
    interaction_demo_score: Score
    uncertainty: Score
    last_reviewed: date
    rule_conflict: bool = False
    score_label: Literal["DEMO_SCORE"] = "DEMO_SCORE"
    revision: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def valid_library(self):
        if len({r.rule_id for r in self.rules}) != len(self.rules):
            raise ValueError("Rule IDs must be unique per therapy")
        for path in self.required_observations:
            bits = path.split(".")
            if len(bits) != 2 or bits[0] not in {"labs", "genomics", "organ_function"}:
                raise ValueError("Required observations must be labs.key, genomics.key or organ_function.key")
        return self


class LoginInput(StrictModel):
    username: Short
    password: str = Field(min_length=1, max_length=256)


class ReviewInput(StrictModel):
    decision: Literal["APPROVE_FURTHER_REVIEW", "REJECT", "REQUEST_INFORMATION", "INCONCLUSIVE"]
    candidate_id: str | None = Field(default=None, max_length=36)
    comment: str = Field(default="", max_length=2000)


class UserOutput(BaseModel):
    id: str
    username: str
    role: str


class HealthOutput(BaseModel):
    status: str
    prototype: bool = True


class RecordOutput(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    source: str
    validation_status: str


class CaseOutput(RecordOutput):
    label: str
    created_by: str
    revision: int
    data: dict
    latest_analysis_id: str | None
    latest_status: str


class TherapyOutput(RecordOutput):
    name: str
    revision: int
    data: dict


class AnalysisOutput(RecordOutput):
    case_id: str
    actor_id: str
    input_snapshot: dict
    library_snapshot: list[dict]
    configuration: dict
    input_hash: str
    configuration_hash: str
    analysis_engine_version: str
    ruleset_version: str
    therapy_library_version: str
    explanation_provider: str
    explanation_model: str
    result: dict
    reviews: list[dict]
    review_status: str


class AuditOutput(RecordOutput):
    analysis_id: str | None
    actor_id: str | None
    event_type: str
    data: dict
    event_hash: str
