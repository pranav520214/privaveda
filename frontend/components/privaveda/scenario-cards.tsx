"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, ShieldX, Award, Sparkles, ArrowRight, Check } from "lucide-react";

export interface ScenarioItem {
  id: "standard" | "reduced" | "optimized";
  name: string;
  regimen: string;
  c_max: number;
  auc_24: number;
  efficacy_prob: number; // percentage
  toxicity_risk: number; // percentage
  pareto_status: "OPTIMAL" | "DOMINATED" | "SUBTHERAPEUTIC";
  safety_gate: "PASS" | "WARN" | "BLOCKED";
  safety_reasons: string[];
  rationale: string;
}

interface ScenarioCardsProps {
  selectedScenario: string;
  onSelectScenario: (scenarioId: "standard" | "reduced" | "optimized") => void;
  mode: "DEMO" | "RESEARCH";
}

export const ScenarioCards: React.FC<ScenarioCardsProps> = ({
  selectedScenario,
  onSelectScenario,
  mode,
}) => {
  const scenarios: ScenarioItem[] = [
    {
      id: "standard",
      name: "Scenario A: Standard Guideline",
      regimen: "50 mg Every 12 Hours (BID)",
      c_max: 3.42,
      auc_24: 58.4,
      efficacy_prob: 98.5,
      toxicity_risk: 34.8,
      pareto_status: "DOMINATED",
      safety_gate: "BLOCKED",
      safety_reasons: [
        "Projected Cmax (3.42 mg/L) exceeds MTC safety threshold (3.00 mg/L)",
        "Cumulative AUC exceeds renal clearance capacity by +42%",
      ],
      rationale: "Default population monograph dose fails to account for reduced eGFR (38 mL/min) and CYP2D6 IM status.",
    },
    {
      id: "reduced",
      name: "Scenario B: Empirical Renal Reduction",
      regimen: "25 mg Once Daily (QD)",
      c_max: 1.45,
      auc_24: 18.2,
      efficacy_prob: 64.2,
      toxicity_risk: 1.1,
      pareto_status: "SUBTHERAPEUTIC",
      safety_gate: "WARN",
      safety_reasons: [
        "Trough concentration falls below MIC / MEC therapeutic threshold for >8h",
      ],
      rationale: "Empiric 50% dose reduction over-corrects, leaving patient with insufficient antimicrobial/therapeutic coverage.",
    },
    {
      id: "optimized",
      name: "Scenario C: Digital Twin Optimized",
      regimen: "35 mg Once Daily (QD)",
      c_max: 2.18,
      auc_24: 34.6,
      efficacy_prob: 94.0,
      toxicity_risk: 2.2,
      pareto_status: "OPTIMAL",
      safety_gate: "PASS",
      safety_reasons: [
        "Cmax strictly within 1.5 - 3.0 mg/L therapeutic window",
        "Steady-state trough maintains >90% receptor occupancy",
      ],
      rationale: "Personalized simulation balances patient eGFR and metabolizer kinetics to achieve maximal therapeutic index.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Multi-Scenario Exploration & Pareto Optimization
          </h2>
          <p className="text-sm text-slate-400">
            Compare guideline empirical regimens against the patient-specific digital twin model
          </p>
        </div>
        {mode === "DEMO" && (
          <span className="text-xs bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 px-2.5 py-1 rounded-full font-mono">
            SYNTHETIC SIMULATION
          </span>
        )}
      </div>

      {/* 3-Column Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {scenarios.map((sc) => {
          const isSelected = selectedScenario === sc.id;
          const isOptimal = sc.pareto_status === "OPTIMAL";

          return (
            <div
              key={sc.id}
              className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? "bg-slate-900/90 border-cyan-500 shadow-xl shadow-cyan-950/30"
                  : isOptimal
                  ? "bg-slate-900/60 border-emerald-500/40 hover:border-emerald-500/70"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Top Banner for Optimal */}
              {isOptimal && (
                <div className="bg-gradient-to-r from-emerald-600/90 to-cyan-600/90 text-white text-[11px] font-bold py-1 px-4 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recommended: Pareto Optimal Frontier
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100 text-base">{sc.name}</h3>
                    <div className="text-xs font-mono text-cyan-400 mt-0.5">{sc.regimen}</div>
                  </div>

                  {/* Animated Safety Gate Badge */}
                  {sc.safety_gate === "PASS" && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 animate-pulse">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      GATE: PASS
                    </div>
                  )}
                  {sc.safety_gate === "WARN" && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-700/60">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      GATE: WARN
                    </div>
                  )}
                  {sc.safety_gate === "BLOCKED" && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-700/60">
                      <ShieldX className="w-3.5 h-3.5" />
                      GATE: BLOCK
                    </div>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Simulated Cmax</div>
                    <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                      {sc.c_max.toFixed(2)} <span className="text-xs font-normal text-slate-400">mg/L</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Simulated AUC24</div>
                    <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                      {sc.auc_24.toFixed(1)} <span className="text-xs font-normal text-slate-400">mg·h/L</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Efficacy Prob</div>
                    <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                      {sc.efficacy_prob.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Toxicity Risk</div>
                    <div className={`text-base font-bold font-mono mt-0.5 ${
                      sc.toxicity_risk > 10 ? "text-rose-400" : "text-emerald-400"
                    }`}>
                      {sc.toxicity_risk.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Safety Gate Reasons */}
                <div className="text-xs space-y-1">
                  <div className="text-slate-400 font-medium">Safety Gate Observations:</div>
                  {sc.safety_reasons.map((r, i) => (
                    <div key={i} className="text-slate-300 flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Rationale */}
                <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {sc.rationale}
                </p>
              </div>

              {/* Action Button */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectScenario(sc.id)}
                  className={`w-full py-2 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : isOptimal
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" /> Active on Workbench
                    </>
                  ) : (
                    <>
                      Load Scenario <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
