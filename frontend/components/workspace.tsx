"use client";
import { useEffect, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  FolderHeart,
  Plus,
  Library,
  Fingerprint,
  Server,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Search,
  LogOut,
  ChevronRight,
  FlaskConical,
  LockKeyhole,
  Clock3,
  CircleCheck,
  PanelLeftClose,
} from "lucide-react";
import type {
  User,
  Case,
  CaseData,
  Analysis,
  Therapy,
  Audit,
  Metrics,
} from "@/types";
import { api, datetime, percent, readable } from "@/lib/api";
import AnalysisView, { Badge } from "./analysis-view";
import CaseForm from "./case-form";

type View =
  | "Dashboard"
  | "Cases"
  | "New Analysis"
  | "Therapy Library"
  | "Audit Trail"
  | "System Status"
  | "Analysis"
  | "New Case"
  | "Edit Case";
const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Cases", icon: FolderHeart },
  { name: "New Analysis", icon: Plus },
  { name: "Therapy Library", icon: Library },
  { name: "Audit Trail", icon: Fingerprint },
  { name: "System Status", icon: Server },
] as const;

function LibraryEditor({
  therapy,
  onSave,
  onCancel,
}: {
  therapy: Therapy | null;
  onSave: (text: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(
    JSON.stringify(
      therapy
        ? { ...therapy.data, revision: therapy.revision }
        : {
            name: "DEMO New option",
            indication: "DEMO-CONTEXT-A",
            approved_context: "DEMO-CONTEXT-A",
            validation_status: "DRAFT",
            evidence_status: "MISSING",
            evidence_quality: 0,
            source_reference: "local-demo://new-fixture",
            evidence: [],
            rules: [],
            required_observations: ["labs.DEMO-LAB"],
            efficacy_demo_score: 0,
            toxicity_demo_score: 1,
            interaction_demo_score: 1,
            uncertainty: 1,
            last_reviewed: new Date().toISOString().slice(0, 10),
            rule_conflict: false,
            score_label: "DEMO_SCORE",
          },
      null,
      2,
    ),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel library-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          JSON.parse(value);
          await onSave(value);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Save failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="panel-heading">
        <h2>
          {therapy ? `Edit ${therapy.name}` : "Add synthetic library entry"}
        </h2>
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <p className="notice amber">
        Administrator action. DEMO_APPROVED means approved for the fictional
        demo only. Saving creates an audited revision; previous analysis
        snapshots are retained.
      </p>
      <label>
        Structured library record
        <textarea
          className="code-editor"
          rows={25}
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      {error && (
        <p className="notice red" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Saving…" : "Save library revision"}
      </button>
    </form>
  );
}

export default function Workspace() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState<View>("Dashboard");
  const [cases, setCases] = useState<Case[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [caseId, setCaseId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("clinician@demo.local");
  const [password, setPassword] = useState("");
  const [editor, setEditor] = useState<Therapy | null | undefined>(undefined);
  const [auditScope, setAuditScope] = useState("");
  const [menu, setMenu] = useState(false);
  const [history, setHistory] = useState<
    {
      id: string;
      label: string;
      status: string;
      created_at: string;
      review_status: string;
    }[]
  >([]);

  async function refresh() {
    const [c, t, m, h] = await Promise.all([
      api<Case[]>("/cases"),
      api<Therapy[]>("/therapies"),
      api<Metrics>("/system/status"),
      api<typeof history>("/analyses"),
    ]);
    setCases(c);
    setTherapies(t);
    setMetrics(m);
    setHistory(h);
    setCaseId((previous) => previous || c[0]?.id || "");
  }
  async function openAnalysis(id: string) {
    setBusy(true);
    setError("");
    try {
      const a = await api<Analysis>(`/analyses/${id}`);
      setAnalysis(a);
      setView("Analysis");
      window.history.replaceState(null, "", `?analysis=${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load analysis");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await api<User>("/auth/me");
        if (!active) return;
        setUser(me);
        await refresh();
        const id = new URLSearchParams(window.location.search).get("analysis");
        if (id) await openAnalysis(id);
      } catch {
        /* An expired session returns to the sign-in screen. */
      } finally {
        if (active) setBooting(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  async function navigate(next: View) {
    setView(next);
    setMenu(false);
    setError("");
    setEditor(undefined);
    window.history.replaceState(null, "", "/");
    if (next === "Audit Trail") {
      setAuditScope("");
      try {
        setAudit(await api<Audit[]>("/audit"));
      } catch (e) {
        setError(String(e));
      }
    }
  }
  async function run() {
    setBusy(true);
    setError("");
    try {
      const a = await api<Analysis>(`/cases/${caseId}/analyze`, {
        method: "POST",
      });
      setAnalysis(a);
      setView("Analysis");
      window.history.replaceState(null, "", `?analysis=${a.id}`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }
  const filtered = cases.filter((c) =>
    `${c.label} ${c.data.condition} ${c.data.notes}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  if (booting)
    return (
      <main className="loading-screen">
        <Activity size={34} />
        <p>Opening clinician workspace…</p>
      </main>
    );
  if (!user)
    return (
      <main className="login-screen">
        <div className="login-story">
          <div className="brand">
            <div className="brand-mark">
              <Activity />
            </div>
            <span>
              Personalized
              <br />
              <strong>Medicine AI</strong>
            </span>
          </div>
          <span className="eyebrow">CLINICIAN DECISION SUPPORT / V1.0</span>
          <h1>
            Evidence first.
            <br />
            Physician always.
          </h1>
          <p>
            A transparent workspace to explore synthetic patient cases, inspect
            safety constraints, and compare evidence-backed demo options.
          </p>
          <div className="login-pipeline">
            Structured case <ArrowRight size={18} /> Safety gates{" "}
            <ArrowRight size={18} /> Physician review
          </div>
          <div className="login-disclaimer">
            <ShieldCheck />
            <p>
              Research / Clinical Decision Support Prototype.
              <br />
              <strong>Not validated for patient care.</strong>
            </p>
          </div>
        </div>
        <section className="login-panel">
          <div className="login-box">
            <span className="tag">
              <LockKeyhole size={13} />
              SECURE DEMO WORKSPACE
            </span>
            <h2>Welcome to your workspace</h2>
            <p>Sign in with a locally provisioned demo account.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setBusy(true);
                try {
                  const me = await api<User>("/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ username, password }),
                  });
                  setUser(me);
                  setPassword("");
                  await refresh();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Sign in failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Demo account
                <select
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                >
                  <option value="clinician@demo.local">
                    Clinician · case analysis & review
                  </option>
                  <option value="admin@demo.local">
                    Administrator · therapy library
                  </option>
                  <option value="researcher@demo.local">
                    Researcher · read-only inspection
                  </option>
                </select>
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {error && (
                <p className="notice red" role="alert">
                  {error}
                </p>
              )}
              <button className="button primary full" disabled={busy}>
                {busy ? "Signing in…" : "Enter clinician workspace"}
                <ArrowRight size={16} />
              </button>
            </form>
            <p className="credential-hint">
              Your administrator provides demo credentials. Local setup saves
              them in the private <code>backend/demo-credentials.txt</code>{" "}
              file.
            </p>
            <div className="notice amber">
              <FlaskConical size={17} />
              <span>
                Use synthetic or de-identified demonstration data only.
              </span>
            </div>
          </div>
        </section>
      </main>
    );

  const table = (limit?: number) => (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Case identifier</th>
            <th>Clinical context</th>
            <th>Scenario</th>
            <th>Analysis status</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, limit).map((c) => (
            <tr key={c.id}>
              <td>
                <div className="case-cell">
                  <span className="table-avatar">{c.label.slice(-2)}</span>
                  <div>
                    <strong>{c.label}</strong>
                    <small>Synthetic · {c.data.age_band} years</small>
                  </div>
                </div>
              </td>
              <td>{c.data.condition.replace("DEMO-", "")}</td>
              <td className="scenario-cell">{c.data.notes.split(".")[0]}</td>
              <td>
                <Badge state={c.latest_status} />
              </td>
              <td>
                <div className="actions">
                  {c.latest_analysis_id && (
                    <button
                      className="text-button"
                      onClick={() => openAnalysis(c.latest_analysis_id!)}
                      aria-label={`Open analysis for ${c.label}`}
                    >
                      View
                      <ArrowUpRight size={15} />
                    </button>
                  )}
                  {user.role === "CLINICIAN" && (
                    <button
                      className="text-button muted"
                      onClick={() => {
                        setCaseId(c.id);
                        navigate("Edit Case");
                      }}
                      aria-label={`Edit ${c.label}`}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!filtered.length && (
        <div className="empty">No synthetic cases match your search.</div>
      )}
    </div>
  );
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a href="/" className="brand">
          <div className="brand-mark">
            <Activity size={24} />
          </div>
          <span>
            Personalized
            <br />
            <strong>Medicine AI</strong>
          </span>
        </a>
        <div className="workspace-label">CLINICIAN WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={
                view === name ||
                (view === "Analysis" && name === "New Analysis")
                  ? "active"
                  : ""
              }
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              {name}
              {name === "Cases" && (
                <span className="nav-count">{cases.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="engine-status">
            <span className="live-dot" />
            <div>
              <strong>Fast Arm active</strong>
              <small>Deterministic engine · v1.0</small>
            </div>
          </div>
          <div className="sidebar-note">
            <FlaskConical size={17} />
            <span>
              Research prototype
              <br />
              Synthetic data environment
            </span>
          </div>
          <div className="user">
            <span className="user-avatar">{user.role.slice(0, 2)}</span>
            <div>
              <strong>Demo {user.role.toLowerCase()}</strong>
              <small>{user.role}</small>
            </div>
            <button
              aria-label="Sign out"
              className="icon-button"
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST" });
                  setUser(null);
                  setView("Dashboard");
                  setAnalysis(null);
                  setError("");
                  window.history.replaceState(null, "", "/");
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              onClick={() => setMenu(!menu)}
            >
              <PanelLeftClose size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{view}</strong>
          </div>
          <div className="topbar-right">
            <span className="environment">
              <span className="dot" />
              SYNTHETIC ENVIRONMENT
            </span>
            <span className="version">V1.0</span>
          </div>
        </header>
        <div className="global-banner">
          <ShieldCheck size={17} />
          <span>
            <strong>Research / Clinical Decision Support Prototype.</strong> Not
            validated for patient care.
          </span>
          <span className="banner-separator">|</span>
          <span>Use synthetic or de-identified demonstration data only.</span>
        </div>
        <main
          id="main-content"
          className={`main-content ${view === "Analysis" ? "wide" : ""}`}
        >
          {error && (
            <div className="notice red" role="alert">
              {error}
              <button className="text-button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}
          {busy && (
            <div className="progress-notice" role="status">
              <span className="spinner" />
              {view === "New Analysis"
                ? "Evaluating structured inputs, safety rules, evidence and Pareto objectives…"
                : "Loading workspace data…"}
            </div>
          )}
          {view === "Dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">OVERVIEW / DEMO METRICS</span>
                  <h1>Clinical intelligence, with oversight.</h1>
                  <p>
                    Your synthetic case workspace. Every option traceable. Every
                    decision human.
                  </p>
                </div>
                {user.role === "CLINICIAN" && (
                  <button
                    className="button primary"
                    onClick={() => navigate("New Analysis")}
                  >
                    <Plus size={17} />
                    New analysis
                  </button>
                )}
              </div>
              <div className="stat-grid">
                <Metric
                  icon={<FolderHeart size={19} />}
                  value={metrics?.total_demo_cases ?? 0}
                  label="Synthetic cases"
                  detail="Demonstration cases only"
                />
                <Metric
                  icon={<Clock3 size={19} />}
                  value={metrics?.awaiting_review ?? 0}
                  label="Awaiting review"
                  detail="Physician decision required"
                />
                <Metric
                  icon={<ShieldCheck size={19} />}
                  value={metrics?.safety_blocks ?? 0}
                  label="Safety exclusions"
                  detail="Hard constraints enforced"
                />
                <Metric
                  icon={<CircleCheck size={19} />}
                  value={metrics?.reviewed_count ?? 0}
                  label="Reviews recorded"
                  detail="Traceable clinician decisions"
                />
              </div>
              <div className="dashboard-grid">
                <section className="workflow-card">
                  <span className="eyebrow">THE FAST ARM WORKFLOW</span>
                  <h2>
                    From structured evidence
                    <br />
                    to informed review.
                  </h2>
                  <p>
                    Explore approved synthetic options through a transparent
                    safety-first pipeline.
                  </p>
                  <div className="workflow-steps">
                    <div>
                      <span>01</span>
                      <strong>Validate & filter</strong>
                      <small>Hard constraints first</small>
                    </div>
                    <ChevronRight size={15} />
                    <div>
                      <span>02</span>
                      <strong>Compare & explain</strong>
                      <small>Five demo objectives</small>
                    </div>
                    <ChevronRight size={15} />
                    <div>
                      <span>03</span>
                      <strong>Physician review</strong>
                      <small>Explicit human sign-off</small>
                    </div>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("New Analysis")}
                  >
                    Open analysis workspace
                    <ArrowRight size={16} />
                  </button>
                </section>
                <section className="panel evidence-health">
                  <div className="panel-heading">
                    <h2>Library readiness</h2>
                    <Library size={19} />
                  </div>
                  <div className="library-number">
                    {
                      therapies.filter(
                        (t) => t.validation_status === "DEMO_APPROVED",
                      ).length
                    }
                    <span>approved demo entries</span>
                  </div>
                  <div className="readiness-row">
                    <span>Evidence provenance</span>
                    <Badge state="TRACEABLE" />
                  </div>
                  <div className="readiness-row">
                    <span>Clinical validation</span>
                    <span className="amber-text">Not performed</span>
                  </div>
                  <div className="readiness-row">
                    <span>Explanation provider</span>
                    <span>Template default</span>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("Therapy Library")}
                  >
                    Inspect therapy library
                    <ArrowUpRight size={15} />
                  </button>
                </section>
              </div>
              <section className="panel cases-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Demonstration cases{" "}
                      <span className="count-pill">{cases.length}</span>
                    </h2>
                    <p className="caption">
                      Explore eligibility, safety exclusions and abstention
                      scenarios.
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("Cases")}
                  >
                    View all cases
                    <ArrowRight size={15} />
                  </button>
                </div>
                {table(6)}
              </section>
              <div className="footer-note">
                <ShieldCheck size={16} />
                AI filters, ranks, explains, and abstains. The physician
                decides.<span>All scores are DEMO_SCORE.</span>
              </div>
            </>
          )}
          {view === "Cases" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">CASE REGISTRY</span>
                  <h1>Synthetic patient cases</h1>
                  <p>
                    Demonstration data only. Notes are stored for human review,
                    never interpreted.
                  </p>
                </div>
                {user.role === "CLINICIAN" && (
                  <button
                    className="button primary"
                    onClick={() => navigate("New Case")}
                  >
                    <Plus size={16} />
                    New case
                  </button>
                )}
              </div>
              <div className="search-field">
                <Search size={17} />
                <input
                  aria-label="Search cases"
                  placeholder="Search by case, context or scenario…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <section className="panel">{table()}</section>
              <section className="panel history-panel">
                <div className="panel-heading">
                  <h2>Analysis history</h2>
                  <span className="tag">Persisted snapshots</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Case</th>
                        <th>Analysis</th>
                        <th>Created</th>
                        <th>Review</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.id}>
                          <td>{h.label}</td>
                          <td className="mono">{h.id.slice(0, 8)}</td>
                          <td>{datetime(h.created_at)}</td>
                          <td>
                            <Badge state={h.review_status} />
                          </td>
                          <td>
                            <button
                              className="text-button"
                              onClick={() => openAnalysis(h.id)}
                            >
                              Open
                              <ArrowUpRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          {(view === "New Case" || view === "Edit Case") && (
            <CaseForm
              key={view + caseId}
              existing={
                view === "Edit Case"
                  ? cases.find((c) => c.id === caseId)
                  : undefined
              }
              onCancel={() => navigate("Cases")}
              onSave={async (data: CaseData) => {
                const c = await api<Case>(
                  view === "Edit Case" ? `/cases/${caseId}` : "/cases",
                  {
                    method: view === "Edit Case" ? "PUT" : "POST",
                    body: JSON.stringify(data),
                  },
                );
                await refresh();
                setCaseId(c.id);
                navigate("New Analysis");
              }}
            />
          )}
          {view === "New Analysis" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">FAST ARM / NEW RUN</span>
                  <h1>Start with a structured case.</h1>
                  <p>
                    Safety constraints are evaluated before any option can enter
                    ranking.
                  </p>
                </div>
                {user.role === "CLINICIAN" && (
                  <button
                    className="button secondary"
                    onClick={() => navigate("New Case")}
                  >
                    <Plus size={16} />
                    Create case
                  </button>
                )}
              </div>
              <section className="panel new-analysis">
                <div className="panel-heading">
                  <h2>Select a synthetic case</h2>
                  <span className="tag">SYNTHETIC DATA ONLY</span>
                </div>
                <label>
                  Case
                  <select
                    aria-label="Case"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} — {c.data.notes.split(".")[0]}
                      </option>
                    ))}
                  </select>
                </label>
                {cases.find((c) => c.id === caseId) && (
                  <div className="case-preview">
                    <h3>{cases.find((c) => c.id === caseId)!.label}</h3>
                    <p>{cases.find((c) => c.id === caseId)!.data.notes}</p>
                    <span className="tag">
                      {cases.find((c) => c.id === caseId)!.data.condition}
                    </span>
                  </div>
                )}
                <div className="analysis-checklist">
                  {[
                    "Validate required observations",
                    "Evaluate hard safety constraints",
                    "Verify demo evidence and freshness",
                    "Compare five objectives using Pareto dominance",
                    "Calculate prototype uncertainty",
                    "Prepare structured evidence for physician review",
                  ].map((s, i) => (
                    <div key={s}>
                      <span>{i + 1}</span>
                      {s}
                    </div>
                  ))}
                </div>
                <p className="notice amber">
                  This creates a versioned demonstration analysis. It does not
                  diagnose, select doses or prescribe.
                </p>
                {user.role === "CLINICIAN" ? (
                  <button
                    className="button primary"
                    disabled={busy || !caseId}
                    onClick={run}
                  >
                    <Activity size={17} />
                    {busy
                      ? "Evaluating safety gates…"
                      : "Run safety-first analysis"}
                  </button>
                ) : (
                  <p className="notice amber">
                    Only a clinician can run an analysis. Existing demo results
                    are available under Cases.
                  </p>
                )}
              </section>
            </>
          )}
          {view === "Analysis" && analysis && (
            <AnalysisView
              key={analysis.id}
              analysis={analysis}
              user={user}
              onUpdate={(a) => {
                setAnalysis(a);
                refresh().catch((e) => setError(String(e)));
              }}
              onAudit={async () => {
                try {
                  setAudit(await api<Audit[]>(`/audit/${analysis.id}`));
                  setAuditScope(analysis.id);
                  setView("Audit Trail");
                } catch (e) {
                  setError(String(e));
                }
              }}
            />
          )}
          {view === "Therapy Library" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    ADMINISTRATOR-CONTROLLED RECORDS
                  </span>
                  <h1>Therapy & rule library</h1>
                  <p>
                    Fictional therapies and evidence. Demo approval is not
                    clinical validation.
                  </p>
                </div>
                {user.role === "ADMIN" && (
                  <button
                    className="button primary"
                    onClick={() => setEditor(null)}
                  >
                    <Plus size={16} />
                    Add demo entry
                  </button>
                )}
              </div>
              {editor !== undefined ? (
                <LibraryEditor
                  key={editor?.id || "new"}
                  therapy={editor}
                  onCancel={() => setEditor(undefined)}
                  onSave={async (text) => {
                    await api(
                      editor
                        ? `/admin/therapies/${editor.id}`
                        : "/admin/therapies",
                      { method: editor ? "PUT" : "POST", body: text },
                    );
                    setEditor(undefined);
                    await refresh();
                  }}
                />
              ) : (
                <div className="library-grid">
                  {therapies.map((t) => (
                    <article className="panel therapy-card" key={t.id}>
                      <div className="panel-heading">
                        <h2>{t.name}</h2>
                        <Badge state={t.validation_status} />
                      </div>
                      <p>
                        {t.data.indication} · Revision {t.revision}
                      </p>
                      <div className="score-row">
                        <span>
                          Efficacy<b>{percent(t.data.efficacy_demo_score)}</b>
                        </span>
                        <span>
                          Toxicity<b>{percent(t.data.toxicity_demo_score)}</b>
                        </span>
                        <span>
                          Evidence<b>{percent(t.data.evidence_quality)}</b>
                        </span>
                      </div>
                      <p className="caption">
                        DEMO_SCORE · Reviewed {t.data.last_reviewed}
                      </p>
                      <details>
                        <summary>Inspect structured rules & evidence</summary>
                        <pre>{JSON.stringify(t.data, null, 2)}</pre>
                      </details>
                      {user.role === "ADMIN" && (
                        <div className="actions">
                          <button
                            className="button secondary"
                            onClick={() => setEditor(t)}
                          >
                            Edit revision
                          </button>
                          <button
                            className="text-button danger"
                            disabled={t.validation_status === "RETIRED"}
                            onClick={async () => {
                              try {
                                await api(`/admin/therapies/${t.id}`, {
                                  method: "DELETE",
                                });
                                await refresh();
                              } catch (e) {
                                setError(String(e));
                              }
                            }}
                          >
                            Retire entry
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
          {view === "Audit Trail" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">PROVENANCE & ACCOUNTABILITY</span>
                  <h1>Audit trail</h1>
                  <p>
                    {auditScope
                      ? `Analysis ${auditScope}`
                      : "Latest 500 events across the synthetic workspace. Input hashes keep case content out of routine audit summaries."}
                  </p>
                </div>
                {auditScope && (
                  <button
                    className="button secondary"
                    onClick={() => openAnalysis(auditScope)}
                  >
                    Back to analysis
                  </button>
                )}
              </div>
              <section className="panel audit-panel">
                {audit.map((e) => (
                  <div className="audit-event" key={e.id}>
                    <div className="audit-marker">
                      <Fingerprint size={17} />
                    </div>
                    <div>
                      <div className="audit-event-title">
                        <strong>{readable(e.event_type)}</strong>
                        <time>{datetime(e.created_at)}</time>
                      </div>
                      <p className="mono">
                        Event {e.id.slice(0, 8)}
                        {e.analysis_id
                          ? ` · Run ${e.analysis_id.slice(0, 8)}`
                          : ""}
                      </p>
                      <details>
                        <summary>Inspect event & integrity hash</summary>
                        <pre>{JSON.stringify(e.data, null, 2)}</pre>
                        <small className="mono">SHA-256 {e.event_hash}</small>
                      </details>
                    </div>
                  </div>
                ))}
                {!audit.length && (
                  <div className="empty">No audit events yet.</div>
                )}
              </section>
            </>
          )}
          {view === "System Status" && metrics && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    PROTOTYPE VALIDATION / DEMO METRICS
                  </span>
                  <h1>System status</h1>
                  <p>
                    Operational measurements from demonstration runs. These do
                    not measure clinical accuracy.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => refresh().catch((e) => setError(String(e)))}
                >
                  Refresh metrics
                </button>
              </div>
              <div className="stat-grid">
                <Metric
                  label="Completed analyses"
                  value={metrics.analysis_count}
                  detail="Persisted deterministic runs"
                  icon={<Activity size={19} />}
                />
                <Metric
                  label="Eligible-result rate"
                  value={`${metrics.analysis_success_rate}%`}
                  detail="Runs yielding eligible candidates"
                  icon={<CircleCheck size={19} />}
                />
                <Metric
                  label="Abstentions"
                  value={metrics.abstention_count}
                  detail="Evidence or safety threshold unmet"
                  icon={<ShieldCheck size={19} />}
                />
                <Metric
                  label="Mean analysis latency"
                  value={`${metrics.average_latency_ms} ms`}
                  detail="Server analysis and explanation time"
                  icon={<Clock3 size={19} />}
                />
              </div>
              <section className="panel status-panel">
                <h2>Versioned, reproducible operation</h2>
                <dl>
                  {Object.entries({
                    "Engine version": metrics.engine_version,
                    "Ruleset version": metrics.ruleset_version,
                    "Library content hash": metrics.library_version,
                    "Explanation mode": metrics.explanation_mode,
                    "Clinical validation": metrics.clinical_validation,
                    Uncertainty:
                      "Prototype uncertainty heuristic — not calibrated",
                    "Data policy": "Synthetic demonstration cases only",
                    "Review pending": metrics.awaiting_review,
                    "Safety blocks": metrics.safety_blocks,
                    "Metric definition": metrics.success_definition,
                  }).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="notice amber">
                  Retrospective evaluation, clinical concordance and real-world
                  outcome validation have not been performed.
                </p>
              </section>
            </>
          )}
        </main>
        <footer className="app-footer">
          <span>Personalized Medicine AI · Research prototype</span>
          <span>Not a prescriber. Not validated for patient care.</span>
        </footer>
      </div>
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
  detail,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  detail: string;
}) {
  return (
    <div className="metric panel">
      <div className="metric-label">
        {label}
        <span>{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
