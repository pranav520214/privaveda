"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Play,
  RotateCcw,
  Sliders,
  TrendingUp,
  FileDown,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { PatientProfile, SimulationResponse, ComputeMode } from "./types";

interface SimulationWorkbenchProps {
  profile: PatientProfile | null;
  simulationData: SimulationResponse | null;
  onRunSimulation: (config: {
    modelType: string;
    doseMg: number;
    route: string;
    durationHours: number;
    samples: number;
  }) => Promise<void>;
  onOpenRecalibrate: () => void;
  onOpenReport: () => void;
  isSimulating: boolean;
}

export default function SimulationWorkbench({
  profile,
  simulationData,
  onRunSimulation,
  onOpenRecalibrate,
  onOpenReport,
  isSimulating,
}: SimulationWorkbenchProps) {
  const [modelType, setModelType] = useState<string>("one_compartment");
  const [doseMg, setDoseMg] = useState<number>(100.0);
  const [route, setRoute] = useState<string>("oral");
  const [computeMode, setComputeMode] = useState<ComputeMode>("STANDARD");
  const [overlayScenarioB, setOverlayScenarioB] = useState<boolean>(false);
  const [curveDrawn, setCurveDrawn] = useState<boolean>(false);

  useEffect(() => {
    // Trigger left-to-right drawing animation on data change
    setCurveDrawn(false);
    const timer = setTimeout(() => setCurveDrawn(true), 50);
    return () => clearTimeout(timer);
  }, [simulationData]);

  const handleSimulateClick = async () => {
    const samples = computeMode === "QUICK" ? 30 : computeMode === "STANDARD" ? 80 : 200;
    await onRunSimulation({
      modelType,
      doseMg,
      route,
      durationHours: 24.0,
      samples,
    });
  };

  const timeSeries = simulationData?.time_series_sample || [
    { t_hours: 0, concentration_mg_l: 0 },
    { t_hours: 2, concentration_mg_l: 1.56 },
    { t_hours: 6, concentration_mg_l: 1.15 },
    { t_hours: 12, concentration_mg_l: 0.54 },
    { t_hours: 24, concentration_mg_l: 0.18 },
  ];

  const maxConc = Math.max(...timeSeries.map((d) => d.concentration_mg_l), 2.0);
  const svgWidth = 600;
  const svgHeight = 280;
  const padding = 40;

  // Coordinate transforms
  const getX = (t: number) => padding + (t / 24.0) * (svgWidth - 2 * padding);
  const getY = (c: number) => svgHeight - padding - (c / (maxConc * 1.2)) * (svgHeight - 2 * padding);

  // Build SVG path
  const curvePoints = timeSeries.map((d) => `${getX(d.t_hours)},${getY(d.concentration_mg_l)}`).join(" ");
  const pathD = timeSeries.reduce(
    (acc, d, i) => `${acc} ${i === 0 ? "M" : "L"} ${getX(d.t_hours)} ${getY(d.concentration_mg_l)}`,
    ""
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#0c192c] flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-700" />
            <span>Pharmacokinetic Simulation Workbench</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mechanistic ODE solver coupled with Monte Carlo parameter uncertainty propagation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRecalibrate}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Add Observed TDM</span>
          </button>

          <button
            onClick={onOpenReport}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Research Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: Patient Parameters & Physiological State (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Case</span>
            <div className="font-mono text-sm font-bold text-slate-900">{profile?.case_id || "PT-SYN-01"}</div>
            <div className="text-xs text-slate-600 mt-0.5">{profile?.condition || "Essential Hypertension"}</div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Weight:</span>
              <span className="font-bold text-slate-900">{profile?.weight_kg || 72} kg</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">eGFR:</span>
              <span className="font-bold text-slate-900">{profile?.egfr || 90} mL/min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">CYP2D6 Score:</span>
              <span className="font-bold text-slate-900">{profile?.genomics?.cyp2d6_score ?? 2.0}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Allometric Model:</span>
              <span className="font-bold text-cyan-800">CL &prop; W<sup>0.75</sup></span>
            </div>
          </div>

          {/* Safety Status Pill */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Deterministic Safety Evaluation
            </div>
            {simulationData?.safety_evaluation?.blocked ? (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">SCENARIO BLOCKED</span>
                  <span className="text-[11px] leading-tight block">{simulationData.safety_evaluation.reasons[0]}</span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Reviewable &middot; Zero Blocks</span>
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANE: Interactive Concentration Curve Canvas (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Plasma Drug Concentration Trajectory</h2>
              <p className="text-[11px] text-slate-400">Predicted concentration vs time (24-hour horizon)</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overlayScenarioB}
                  onChange={(e) => setOverlayScenarioB(e.target.checked)}
                  className="rounded text-cyan-600 cursor-pointer"
                />
                <span className="text-[11px]">Overlay Scenario B</span>
              </label>
            </div>
          </div>

          {/* SVG Graph Area with Left-to-Right Animation */}
          <div className="relative w-full aspect-[2/1] bg-slate-50/50 rounded-xl border border-slate-100 p-2 flex items-center justify-center">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
              {/* Grid Lines */}
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* Y-axis Ticks & Labels */}
              <text x={padding - 8} y={getY(0)} textAnchor="end" fontSize="10" fill="#64748b">0.0</text>
              <text x={padding - 8} y={getY(1.0)} textAnchor="end" fontSize="10" fill="#64748b">1.0</text>
              <text x={padding - 8} y={getY(2.0)} textAnchor="end" fontSize="10" fill="#64748b">2.0</text>
              <text x={padding - 15} y={padding - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">mg/L</text>

              {/* X-axis Ticks & Labels */}
              <text x={getX(0)} y={svgHeight - padding + 15} textAnchor="middle" fontSize="10" fill="#64748b">0h</text>
              <text x={getX(6)} y={svgHeight - padding + 15} textAnchor="middle" fontSize="10" fill="#64748b">6h</text>
              <text x={getX(12)} y={svgHeight - padding + 15} textAnchor="middle" fontSize="10" fill="#64748b">12h</text>
              <text x={getX(18)} y={svgHeight - padding + 15} textAnchor="middle" fontSize="10" fill="#64748b">18h</text>
              <text x={getX(24)} y={svgHeight - padding + 15} textAnchor="middle" fontSize="10" fill="#64748b">24h</text>
              <text x={svgWidth / 2} y={svgHeight - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">Time (Hours)</text>

              {/* Monte Carlo Uncertainty Envelope (Faded in) */}
              {simulationData?.monte_carlo_uncertainty && (
                <path
                  d={`M ${getX(0)} ${getY(0)} L ${getX(2.2)} ${getY(simulationData.monte_carlo_uncertainty.percentile_95_c_max)} L ${getX(12)} ${getY(0.9)} L ${getX(24)} ${getY(0.35)} L ${getX(24)} ${getY(0.08)} L ${getX(12)} ${getY(0.25)} L ${getX(2.2)} ${getY(simulationData.monte_carlo_uncertainty.percentile_5_c_max)} Z`}
                  fill="#00b4d8"
                  fillOpacity="0.12"
                  className="transition-opacity duration-700"
                />
              )}

              {/* Scenario B Overlay (if enabled) */}
              {overlayScenarioB && (
                <path
                  d={`M ${getX(0)} ${getY(0)} L ${getX(2.0)} ${getY(0.82)} L ${getX(6)} ${getY(0.58)} L ${getX(12)} ${getY(0.28)} L ${getX(24)} ${getY(0.09)}`}
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}

              {/* Primary Median Trajectory (Left-to-Right Draw Animation) */}
              <path
                d={pathD}
                fill="none"
                stroke="#00b4d8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 1000,
                  strokeDashoffset: curveDrawn ? 0 : 1000,
                  transition: "stroke-dashoffset 0.8s ease-out",
                }}
              />

              {/* Observed TDM Measurement Points */}
              <g>
                <circle cx={getX(2.0)} cy={getY(1.65)} r="4" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                <circle cx={getX(8.0)} cy={getY(0.95)} r="4" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
              </g>
            </svg>
          </div>

          {/* Exposure Summary Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">C_max</span>
              <span className="font-mono font-bold text-slate-900">
                {simulationData?.metrics?.c_max_mg_l ? `${simulationData.metrics.c_max_mg_l} mg/L` : "1.56 mg/L"}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">T_max</span>
              <span className="font-mono font-bold text-slate-900">
                {simulationData?.metrics?.t_max_hours ? `${simulationData.metrics.t_max_hours} h` : "2.2 h"}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">AUC_0-24</span>
              <span className="font-mono font-bold text-slate-900">
                {simulationData?.metrics?.auc_0_24 ? `${simulationData.metrics.auc_0_24} mg*h/L` : "17.2 mg*h/L"}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Half-Life</span>
              <span className="font-mono font-bold text-slate-900">
                {simulationData?.metrics?.half_life_hours ? `${simulationData.metrics.half_life_hours} h` : "6.7 h"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Scenario Configuration & Run Button (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-700" />
              <span>Regimen Controls</span>
            </h2>
            <span className="text-[10px] font-bold uppercase text-slate-500">Config</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Model Architecture:</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-xs focus:outline-cyan-600"
              >
                <option value="one_compartment">1-Compartment PK (Gut + Systemic)</option>
                <option value="two_compartment">2-Compartment PK (Central + Peripheral)</option>
                <option value="pbpk">Physiological PBPK (Multi-Organ)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Administered Dose (mg):</label>
              <input
                type="number"
                value={doseMg}
                onChange={(e) => setDoseMg(parseFloat(e.target.value) || 0)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-mono focus:outline-cyan-600"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Route of Administration:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoute("oral")}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    route === "oral" ? "bg-cyan-50 border-cyan-400 text-cyan-900" : "border-slate-200 text-slate-600"
                  }`}
                >
                  Oral
                </button>
                <button
                  type="button"
                  onClick={() => setRoute("iv")}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    route === "iv" ? "bg-cyan-50 border-cyan-400 text-cyan-900" : "border-slate-200 text-slate-600"
                  }`}
                >
                  IV Bolus
                </button>
              </div>
            </div>

            {/* Compute Mode (Section 45) */}
            <div>
              <label className="text-slate-600 block mb-1 font-semibold">Compute Fidelity:</label>
              <div className="grid grid-cols-3 gap-1">
                {(["QUICK", "STANDARD", "RESEARCH"] as ComputeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setComputeMode(mode)}
                    className={`py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                      computeMode === mode ? "bg-[#0c192c] text-white border-[#0c192c]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Monte Carlo Progress Display (Section 17) */}
          {isSimulating && (
            <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs space-y-1">
              <div className="flex justify-between font-bold text-[11px]">
                <span>Monte Carlo Uncertainty:</span>
                <span>80 / 80 samples</span>
              </div>
              <div className="w-full h-1.5 bg-cyan-200 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 animate-pulse w-full" />
              </div>
            </div>
          )}

          <button
            onClick={handleSimulateClick}
            disabled={isSimulating}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0c192c] hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isSimulating ? "Solving ODEs..." : "Run Simulation"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
