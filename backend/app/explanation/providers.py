import copy
import json
import os
from typing import Protocol


class ClinicalExplanationProvider(Protocol):
    name: str
    model: str
    def explain(self, structured_analysis: dict) -> dict: ...


def sentences(result: dict) -> list[str]:
    return [result["message"]] + [f'{c["name"]}: {c["state"]}. ' + " ".join(c["reasons"]) for c in result["candidates"]]


class MockExplanationProvider:
    name = "MockExplanationProvider"
    model = "deterministic-template-v1"

    def explain(self, structured_analysis: dict) -> dict:
        return {"text": "\n".join(sentences(structured_analysis)), "mode": "Structured template — no generative inference", "fallback": False}


class HuggingFaceExplanationProvider:
    name = "HuggingFaceExplanationProvider"

    def __init__(self, model_id: str, token: str = "", device: str = "cpu"):
        self.model = model_id
        self.token = token
        self.device = device

    def explain(self, structured_analysis: dict) -> dict:
        # Local cache only: enabling this adapter never downloads weights or sends case data.
        os.environ["HF_HUB_OFFLINE"] = "1"
        from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
        source = sentences(structured_analysis)
        tokenizer = AutoTokenizer.from_pretrained(self.model, local_files_only=True, token=self.token or None)
        model = AutoModelForCausalLM.from_pretrained(self.model, local_files_only=True, token=self.token or None)
        generator = pipeline("text-generation", model=model, tokenizer=tokenizer, device=self.device)
        prompt = "Summarize ONLY the supplied structured evidence by selecting sentence indices. Return a JSON array of integer indices, nothing else. Do not invent therapies, evidence, diagnoses, doses or prescriptions. Do not modify scores or safety flags. Sentence 0 and every excluded/abstained sentence must be retained.\n" + json.dumps(dict(enumerate(source)))
        output = generator(prompt, max_new_tokens=100, return_full_text=False, do_sample=False)[0]["generated_text"]
        indices = json.loads(output)
        if not isinstance(indices, list) or not indices or any(type(i) is not int or i < 0 or i >= len(source) for i in indices):
            raise ValueError("Unsafe explanation format")
        # All source sentences remain available; the model can only change their order.
        ordered = list(dict.fromkeys([0] + indices + list(range(len(source)))))
        return {"text": "\n".join(source[i] for i in ordered), "mode": "HF extractive explanation — supplied sentences only", "fallback": False}


def explain_safely(result: dict, provider: ClinicalExplanationProvider) -> tuple[dict, str, str]:
    try:
        explanation = provider.explain(copy.deepcopy(result))
        allowed = set(sentences(result))
        if set(explanation["text"].splitlines()) != allowed:
            raise ValueError("Explanation introduced or omitted structured evidence")
        return explanation, provider.name, provider.model
    except Exception:
        fallback = MockExplanationProvider()
        explanation = fallback.explain(result)
        explanation["fallback"] = True
        explanation["mode"] += "; optional provider unavailable or output rejected"
        return explanation, fallback.name, fallback.model
