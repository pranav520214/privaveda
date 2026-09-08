"use client";

import React, { useState } from "react";
import { Sliders, ArrowUpDown, Info, Zap, AlertCircle } from "lucide-react";

interface SensitivityParameter {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  baseline: number;
  sensitivity_index: number; // 0 to 1
  delta_auc_low: number; // % change at -20% parameter
  delta_auc_high: number; // % change at +20% parameter
  clinical_meaning: string;
  target_organ: string;
}

export const SensitivityPanel: React.FC = () => {
  const [selectedParam, setSelectedParam] = useState<string>("cl");

  const parameters: SensitivityParameter[] = [
    {
      id: "cl",
      name: "Hepatic / Systemic Clearance",
      symbol: "CL_sys",
      unit: "L/h",
      baseline: 4.8,
      sensitivity_index: 0.74,
      delta_auc_low: 24.5,
      delta_auc_high: -16.8,
      clinical_meaning: "Determines steady-state area under curve (AUC). Impairment leads to rapid drug accumulation.",
      target_organ: "Liver / Systemic",
    },
    {
      id: "egfr",
      name: "Glomerular Filtration Rate (eGFR)",
      symbol: "eGFR",
      unit: "mL/min/1.73m²",
      baseline: 38.0,
      sensitivity_index: 0.58,
      delta_auc_low: 18.2,
      delta_auc_high: -12.4,
      clinical_meaning: "Controls renal elimination fraction. In CKD Stage 3b, renal clearance is reduced by ~45%.",
      target_organ: "Kidneys",
    },
    {
      id: "vd",
      name: "Central Volume of Distribution",
      symbol: "V_d",
      unit: "L",
      baseline: 42.0,
      sensitivity_index: 0.44,
      delta_auc_low: 8.5,
      delta_auc_high: -6.9,
      clinical_meaning: "Dictates initial peak concentration (Cmax). Sepsis or fluid overload increases Vd and lowers peak efficacy.",
      target_organ: "Vascular Space",
    },
    {
      id: "cyp2d6",
      name: "CYP2D6 Activity Score",
      symbol: "AS_CYP2D6",
      unit: "Score (0-2)",
      baseline: 0.5,
      sensitivity_index: 0.36,
      delta_auc_low: 15.1,
      delta_auc_high: -9.8,
      clinical_meaning: "Intermediate metabolizers show 40% reduced hepatic biotransformation for CYP2D6-dependent pathways.",
      target_organ: "Hepatocytes",
    },
    {
      id: "ka",
      name: "Absorption Rate Constant",
      symbol: "k_a",
      unit: "h⁻¹",
      baseline: 1.1,
      sensitivity_index: 0.19,
      delta_auc_low: -4.2,
      delta_auc_high: 3.8,
      clinical_meaning: "Alters time to peak (Tmax) and Cmax, but has minimal impact on 24-hour total exposure (AUC).",
      target_organ: "GI Tract",
    },
  ];

  const activeParam = parameters.find((p) => p.id === selectedParam) || parameters[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            Global Sensitivity Analysis: "What Changes the Result Most?"
          </h2>
          <p className="text-sm text-slate-400">
            One-At-A-Time (OAT) & Morris Screening parameter elasticities relative to total exposure (AUC0-24)
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-3 py-1.5 rounded-lg">
          <Zap className="w-3.5 h-3.5" />
          <span>First-order Sobol indices computed</span>
        </div>
      </div>

      {/* Tornado Chart Container */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-indigo-400" />
            Tornado Impact Analysis (±20% Parameter Perturbation vs AUC)
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 bg-amber-500/80 rounded-sm"></span> -20% Parameter
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 bg-cyan-500/80 rounded-sm"></span> +20% Parameter
            </span>
          </div>
        </div>

        {/* Tornado Rows */}
        <div className="space-y-3">
          {parameters.map((param) => {
            const isSelected = param.id === selectedParam;
            // Normalizing widths: max swing is ~30%
            const maxSwing = 30;
            const leftWidth = Math.min((Math.abs(param.delta_auc_low) / maxSwing) * 50, 50);
            const rightWidth = Math.min((Math.abs(param.delta_auc_high) / maxSwing) * 50, 50);

            return (
              <div
                key={param.id}
                onClick={() => setSelectedParam(param.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-slate-800/90 border-indigo-500/60 shadow-md shadow-indigo-950/40"
                    : "bg-slate-950/40 border-slate-800/70 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-300">{param.symbol}</span>
                    <span className="font-medium text-slate-200">{param.name}</span>
                    <span className="text-slate-500">({param.target_organ})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono">
                      Baseline: {param.baseline} {param.unit}
                    </span>
                    <span className="font-mono font-bold text-indigo-400">
                      S_i = {param.sensitivity_index.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Tornado Bar Visualization */}
                <div className="grid grid-cols-2 gap-1 items-center h-5 bg-slate-900/60 rounded px-1 relative">
                  {/* Left Bar (Negative direction or AUC increase upon reduction) */}
                  <div className="flex justify-end items-center h-full">
                    <div
                      className="bg-amber-500/80 h-3.5 rounded-l text-[10px] text-slate-950 font-bold font-mono px-1 flex items-center justify-end"
                      style={{ width: `${leftWidth * 2}%` }}
                    >
                      +{param.delta_auc_low}%
                    </div>
                  </div>

                  {/* Center Line Indicator */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600 z-10" />

                  {/* Right Bar */}
                  <div className="flex justify-start items-center h-full">
                    <div
                      className="bg-cyan-500/80 h-3.5 rounded-r text-[10px] text-slate-950 font-bold font-mono px-1 flex items-center justify-start"
                      style={{ width: `${rightWidth * 2}%` }}
                    >
                      {param.delta_auc_high}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Parameter Deep Dive */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          Clinical Pharmacometrics Insight: {activeParam.name} ({activeParam.symbol})
        </h4>
        <p className="text-sm text-slate-300 leading-relaxed">
          {activeParam.clinical_meaning}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-indigo-400" />
          <span>
            Ranked #{parameters.findIndex((p) => p.id === activeParam.id) + 1} most critical parameter driving inter-patient variability for this compound.
          </span>
        </div>
      </div>
    </div>
  );
};
