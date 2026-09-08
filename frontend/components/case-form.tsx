"use client";
import { useState } from "react";
import type { Case, CaseData } from "@/types";

const empty: CaseData = {
  label: "",
  synthetic: true,
  age_band: "40-64",
  sex: "unspecified",
  condition: "DEMO-CONTEXT-A",
  history: [],
  medications: [],
  allergies: [],
  labs: {},
  genomics: {},
  organ_function: {},
  notes: "",
};
export default function CaseForm({
  existing,
  onSave,
  onCancel,
}: {
  existing?: Case;
  onSave: (data: CaseData) => Promise<void>;
  onCancel: () => void;
}) {
  const [data, setData] = useState<CaseData>(
    existing ? { ...existing.data, revision: existing.revision } : empty,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [labs, setLabs] = useState(JSON.stringify(data.labs, null, 2));
  const [genomics, setGenomics] = useState(
    JSON.stringify(data.genomics, null, 2),
  );
  const [organ, setOrgan] = useState(
    JSON.stringify(data.organ_function, null, 2),
  );
  const set = (key: keyof CaseData, value: unknown) =>
    setData((d) => ({ ...d, [key]: value }));
  return (
    <form
      className="panel case-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
          await onSave({
            ...data,
            labs: JSON.parse(labs),
            genomics: JSON.parse(genomics),
            organ_function: JSON.parse(organ),
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save case");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SYNTHETIC CASE WORKSPACE</span>
          <h2>
            {existing
              ? "Edit demonstration case"
              : "Create a demonstration case"}
          </h2>
        </div>
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <p className="notice amber">
        Use synthetic or de-identified demonstration data only. No patient
        names, dates of birth or identifiers. V1 fixtures and scores are
        fictional.
      </p>
      <div className="form-grid">
        <label>
          Case identifier
          <input
            required
            maxLength={80}
            value={data.label}
            placeholder="SYN-011"
            onChange={(e) => set("label", e.target.value)}
          />
        </label>
        <label>
          Clinical context
          <input
            required
            value={data.condition}
            maxLength={100}
            onChange={(e) => set("condition", e.target.value)}
          />
          <small>Supported demo contexts: DEMO-CONTEXT-A / B</small>
        </label>
        <label>
          Age band
          <select
            value={data.age_band}
            onChange={(e) => set("age_band", e.target.value)}
          >
            {["18-39", "40-64", "65+", "unknown"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Biological sex
          <select value={data.sex} onChange={(e) => set("sex", e.target.value)}>
            {["unspecified", "female", "male"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {(["history", "medications", "allergies"] as const).map((k) => (
          <label key={k}>
            {k[0].toUpperCase() + k.slice(1)}
            <input
              value={data[k].join(", ")}
              onChange={(e) =>
                set(
                  k,
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
            <small>Comma-separated exact demo labels</small>
          </label>
        ))}
      </div>
      <div className="form-grid three">
        <label>
          Lab observations (JSON)
          <textarea
            value={labs}
            onChange={(e) => setLabs(e.target.value)}
            rows={4}
          />
          <small>Fictional key: {`{"DEMO-LAB":72}`}; no clinical units</small>
        </label>
        <label>
          Genomic observations (JSON)
          <textarea
            value={genomics}
            onChange={(e) => setGenomics(e.target.value)}
            rows={4}
          />
          <small>{`{"DEMO-G1":"unflagged"}`}</small>
        </label>
        <label>
          Organ indicators (JSON)
          <textarea
            value={organ}
            onChange={(e) => setOrgan(e.target.value)}
            rows={4}
          />
          <small>{`{"DEMO-ORGAN":"available"}`}</small>
        </label>
      </div>
      <label>
        Demonstration notes
        <textarea
          value={data.notes}
          maxLength={2000}
          rows={3}
          onChange={(e) => set("notes", e.target.value)}
        />
        <small>
          Stored for human review only. The engine does not interpret notes.
        </small>
      </label>
      <label className="checkbox">
        <input required type="checkbox" />I confirm this is a synthetic
        demonstration case.
      </label>
      {error && (
        <p className="notice red" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={saving}>
        {saving ? "Saving…" : "Save synthetic case"}
      </button>
    </form>
  );
}
