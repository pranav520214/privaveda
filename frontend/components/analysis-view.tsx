"use client";
import { useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  FileText,
  Check,
  ChevronRight,
  CircleAlert,
  Fingerprint,
} from "lucide-react";
import type { Analysis, Candidate, User } from "@/types";
import { api, datetime, percent, readable } from "@/lib/api";
import Pareto from "./pareto";

export function Badge({ state }: { state: string }) {
  return (
    <span className={`badge ${state.toLowerCase()}`}>{readable(state)}</span>
  );
}

export default function AnalysisView({
  analysis,
  user,
  onUpdate,
  onAudit,
}: {
  analysis: Analysis;
  user: User;
  onUpdate: (a: Analysis) => void;
  onAudit: () => void;
}) {
  const [selected, setSelected] = useState(
    analysis.result.candidates.find((c) => c.state === "PARETO_OPTIMAL")
      ?.therapy_id ||
      analysis.result.candidates[0]?.therapy_id ||
      "",
  );
  const [decision, setDecision] = useState("APPROVE_FURTHER_REVIEW");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const result = analysis.result;
  const c = result.candidates.find((c) => c.therapy_id === selected);
  const eligible = result.candidates
    .filter((c) => ["PARETO_OPTIMAL", "DOMINATED"].includes(c.state))
    .sort(
      (a, b) =>
        Number(b.state === "PARETO_OPTIMAL") -
        Number(a.state === "PARETO_OPTIMAL"),
    );
  const excluded = result.candidates.filter((c) =>
    ["EXCLUDED", "ABSTAINED"].includes(c.state),
  );
  const blocks = result.candidates.flatMap((c) =>
    c.flags.filter((f) => f.action === "BLOCK"),
  );
  const warnings = result.candidates.flatMap((c) =>
    c.flags.filter((f) => f.action === "WARN"),
  );
  const canApprove =
    result.status !== "ABSTAINED" &&
    !!c &&
    ["PARETO_OPTIMAL", "DOMINATED"].includes(c.state);
  function card(candidate: Candidate) {
    return (
      <button
        key={candidate.therapy_id}
        className={`candidate ${selected === candidate.therapy_id ? "selected" : ""}`}
        onClick={() => setSelected(candidate.therapy_id)}
        aria-pressed={selected === candidate.therapy_id}
      >
        <div className="candidate-top">
          <strong>{candidate.name}</strong>
          <Badge state={candidate.state} />
        </div>
        {candidate.scores && (
          <div className="score-row">
            <span>
              Efficacy
              <b>
                {percent(candidate.scores.efficacy)}
                <small>/100</small>
              </b>
            </span>
            <span>
              Toxicity
              <b>
                {percent(candidate.scores.toxicity)}
                <small>/100</small>
              </b>
            </span>
            <span>
              Interaction
              <b>
                {percent(candidate.scores.interaction)}
                <small>/100</small>
              </b>
            </span>
            <span>
              Evidence
              <b>
                {percent(candidate.scores.evidence_quality)}
                <small>/100</small>
              </b>
            </span>
          </div>
        )}
        <div className="candidate-footer">
          <span>
            Uncertainty {percent(candidate.uncertainty.score)}% · DEMO_SCORE
          </span>
          <span>
            {candidate.flags.length
              ? `${candidate.flags.length} safety flag(s)`
              : "Inspect evidence"}
            <ChevronRight size={13} />
          </span>
        </div>
      </button>
    );
  }
  return (
    <>
      <div className="analysis-toolbar">
        <div>
          <span className="eyebrow">ANALYSIS WORKSPACE</span>
          <h1>
            {analysis.input_snapshot.label}{" "}
            <span className="heading-slash">/</span> Candidate comparison
          </h1>
          <p>
            {datetime(analysis.created_at)} · Fast Arm ·{" "}
            <span className="mono">{analysis.id.slice(0, 8)}</span>
          </p>
        </div>
        <div className="actions">
          <button className="button secondary" onClick={onAudit}>
            <Fingerprint size={16} />
            Audit trail
          </button>
          <a
            className="button secondary"
            href={`/api/v1/analyses/${analysis.id}/report`}
            target="_blank"
            rel="noreferrer"
          >
            <FileText size={16} />
            Print report
          </a>
        </div>
      </div>
      <div className="pipeline">
        {[
          "Input validated",
          "Safety evaluated",
          "Eligibility checked",
          "Pareto compared",
          "Uncertainty assessed",
        ].map((s, i) => (
          <span key={s}>
            <i>
              <Check size={12} />
            </i>
            {s}
            {i < 4 && <ChevronRight size={14} />}
          </span>
        ))}
        <span className="review-step">
          <span className="dot" />
          {analysis.review_status === "REVIEWED"
            ? "Review recorded"
            : "Physician review"}
        </span>
      </div>
      {result.status === "ABSTAINED" && (
        <div className="abstention" role="status">
          <CircleAlert />
          <div>
            <h2>Analysis abstained</h2>
            <p>{result.message}</p>
            <small>
              {result.context_supported
                ? "No candidate survived the safety and evidence requirements."
                : "This context is outside the synthetic library."}
            </small>
          </div>
        </div>
      )}
      <div className="analysis-grid">
        <aside className="case-summary panel">
          <div className="panel-heading">
            <h2>Case summary</h2>
            <span className="case-avatar">
              {analysis.input_snapshot.label.slice(-2)}
            </span>
          </div>
          <p className="synthetic-label">SYNTHETIC PATIENT — NOT REAL DATA</p>
          <dl>
            <dt>Case identifier</dt>
            <dd>{analysis.input_snapshot.label}</dd>
            <dt>Clinical context</dt>
            <dd>{analysis.input_snapshot.condition}</dd>
            <dt>Age band / sex</dt>
            <dd>
              {analysis.input_snapshot.age_band} / {analysis.input_snapshot.sex}
            </dd>
            {(["history", "medications", "allergies"] as const).map((key) => (
              <div key={key}>
                <dt>{readable(key)}</dt>
                <dd>
                  {analysis.input_snapshot[key].join(", ") || "None recorded"}
                </dd>
              </div>
            ))}
            {(["labs", "genomics", "organ_function"] as const).map((key) => (
              <div key={key}>
                <dt>{readable(key)}</dt>
                <dd>
                  {Object.entries(analysis.input_snapshot[key]).map(
                    ([k, v]) => (
                      <span className="observation" key={k}>
                        {k}
                        <b>{v}</b>
                      </span>
                    ),
                  )}
                  {Object.keys(analysis.input_snapshot[key]).length === 0 &&
                    "Missing"}
                </dd>
              </div>
            ))}
          </dl>
          <details>
            <summary>Human-readable notes</summary>
            <p>{analysis.input_snapshot.notes || "No notes"}</p>
            <small>Not interpreted by the engine.</small>
          </details>
          <div className="summary-note">
            <ShieldCheck size={18} />
            <p>
              AI filters, ranks, explains, and abstains.
              <br />
              <strong>The physician decides.</strong>
            </p>
          </div>
        </aside>
        <div className="comparison">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">MULTI-OBJECTIVE COMPARISON</span>
                <h2>Pareto landscape</h2>
              </div>
              <span className="tag">DEMO_SCORE</span>
            </div>
            {result.candidates.length ? (
              <Pareto
                candidates={result.candidates}
                selected={selected}
                onSelect={setSelected}
              />
            ) : (
              <div className="empty">
                No library candidates for this context.
              </div>
            )}
          </section>
          <section>
            <div className="section-title">
              <h2>
                Eligible candidates <span>{eligible.length}</span>
              </h2>
              <small>Five-objective comparison</small>
            </div>
            {eligible.length ? (
              eligible.map(card)
            ) : (
              <div className="panel empty">
                No eligible candidates. The engine has abstained.
              </div>
            )}
          </section>
          <section>
            <div className="section-title">
              <h2>
                Safety & evidence exclusions <span>{excluded.length}</span>
              </h2>
            </div>
            {excluded.map(card)}
          </section>
        </div>
        <aside className="inspector">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <ShieldCheck size={18} />
                Safety gate
              </h2>
              <Badge
                state={
                  result.status === "ABSTAINED"
                    ? "ABSTAIN"
                    : blocks.length
                      ? "BLOCKED"
                      : warnings.length
                        ? "WARNING"
                        : "PASS"
                }
              />
            </div>
            <div className="gate-counts">
              <div>
                <b>{eligible.length}</b>
                <small>Eligible</small>
              </div>
              <div>
                <b>{blocks.length}</b>
                <small>Hard blocks</small>
              </div>
              <div>
                <b>{excluded.filter((c) => c.state === "ABSTAINED").length}</b>
                <small>Abstained</small>
              </div>
            </div>
            <p className="caption">Hard constraints override every score.</p>
            {blocks.length > 0 && (
              <p className="notice red compact">
                <ShieldX size={16} />
                {blocks.length} rule exclusion(s) enforced
              </p>
            )}
          </section>
          {c && (
            <section className="panel evidence-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">SELECTED OPTION</span>
                  <h2>{c.name}</h2>
                </div>
              </div>
              <Badge state={c.state} />
              <h3>
                {c.state === "EXCLUDED" || c.state === "ABSTAINED"
                  ? "Why excluded / abstained"
                  : "Why included"}
              </h3>
              {c.reasons.map((r) => (
                <p key={r}>{r}</p>
              ))}
              <h3>Reason for rank</h3>
              <p>{c.rank_reason}</p>
              {c.flags.map((f, i) => (
                <div
                  key={i}
                  className={`rule-flag ${f.action === "BLOCK" ? "red" : "amber"}`}
                >
                  <strong>
                    {f.action} · {f.rule_id}
                  </strong>
                  <p>{f.reason}</p>
                  <dl>
                    <dt>Case input</dt>
                    <dd className="mono">{JSON.stringify(f.input)}</dd>
                    <dt>Rule source</dt>
                    <dd>{f.source}</dd>
                    <dt>Evaluated</dt>
                    <dd>{datetime(f.timestamp)}</dd>
                    <dt>Analysis run</dt>
                    <dd className="mono">{f.analysis_id}</dd>
                  </dl>
                </div>
              ))}
              <h3>Evidence & provenance</h3>
              {c.evidence.length ? (
                c.evidence.map((e) => (
                  <div className="evidence" key={e.reference}>
                    <span className="reference">{e.reference}</span>
                    <p>{e.title}</p>
                    <small>{e.source}</small>
                    <Badge state={e.status} />
                  </div>
                ))
              ) : (
                <p className="notice amber">No approved evidence supplied.</p>
              )}
              <small>Library review: {c.last_reviewed || "Unavailable"}</small>
              <h3>Uncertainty · {percent(c.uncertainty.score)}%</h3>
              <div className="uncertainty-bar">
                <i style={{ width: `${percent(c.uncertainty.score)}%` }} />
              </div>
              <p>{readable(c.uncertainty.category)}</p>
              <small>
                {c.uncertainty.label}. Not statistically calibrated.
              </small>
              <details>
                <summary>Calculation</summary>
                <p>{c.uncertainty.formula}</p>
              </details>
              {c.missing_data.length > 0 && (
                <div className="notice amber">
                  <strong>Missing data</strong>
                  <p>{c.missing_data.join(", ")}</p>
                </div>
              )}
            </section>
          )}
        </aside>
      </div>
      <div className="bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">TRACEABLE EXPLANATION</span>
              <h2>Structured rationale</h2>
            </div>
            <span className="tag">
              {result.explanation.fallback
                ? "Fallback active"
                : "Evidence only"}
            </span>
          </div>
          <p className="caption">{result.explanation.mode}</p>
          <div className="explanation">
            {result.explanation.text.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <details>
            <summary>Reproducibility & versions</summary>
            <dl>
              {(
                [
                  "analysis_engine_version",
                  "ruleset_version",
                  "therapy_library_version",
                  "input_hash",
                  "configuration_hash",
                  "explanation_provider",
                  "explanation_model",
                ] as const
              ).map((key) => (
                <div key={key}>
                  <dt>{readable(key)}</dt>
                  <dd className="mono">{analysis[key]}</dd>
                </div>
              ))}
            </dl>
          </details>
        </section>
        <section className="panel review-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">HUMAN IN THE LOOP</span>
              <h2>Physician review</h2>
            </div>
            <Badge state={analysis.review_status} />
          </div>
          <p>
            Record a review of this analysis. Approval is only for further
            clinical review and is never a prescription.
          </p>
          {user.role === "CLINICIAN" ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setBusy(true);
                try {
                  const updated = await api<Analysis>(
                    `/analyses/${analysis.id}/review`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        decision,
                        candidate_id: selected || null,
                        comment,
                      }),
                    },
                  );
                  onUpdate(updated);
                  setComment("");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Review failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Review decision
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  <option value="APPROVE_FURTHER_REVIEW" disabled={!canApprove}>
                    Approve for further clinical review
                  </option>
                  <option value="REJECT">Reject</option>
                  <option value="REQUEST_INFORMATION">
                    Request more information
                  </option>
                  <option value="INCONCLUSIVE">
                    Mark analysis inconclusive
                  </option>
                </select>
              </label>
              <p className="caption">Selected candidate: {c?.name || "None"}</p>
              <label>
                Comment (optional)
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Record your rationale using synthetic information only…"
                />
              </label>
              {error && (
                <p role="alert" className="notice red">
                  {error}
                </p>
              )}
              <button
                className="button primary"
                disabled={
                  busy || (decision === "APPROVE_FURTHER_REVIEW" && !canApprove)
                }
              >
                {busy ? "Recording…" : "Record clinician decision"}
              </button>
            </form>
          ) : (
            <p className="notice amber">
              Only the clinician role can record a decision.
            </p>
          )}
          {analysis.reviews.map((r) => (
            <div className="review-entry" key={r.id}>
              <Badge state={r.decision} />
              <p>{r.comment || "No comment supplied"}</p>
              <small>
                {r.clinician} · {datetime(r.created_at)}
              </small>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
