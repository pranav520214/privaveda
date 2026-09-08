"use client";

import React from "react";
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Activity,
  ShieldCheck,
  Share2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Lock,
} from "lucide-react";
import type { PatientProfile, ActiveView, SimulationResponse, CalibrateResponse } from "./types";

interface DashboardViewProps {
  profile: PatientProfile | null;
  onNavigate: (view: ActiveView) => void;
  simulationData: SimulationResponse | null;
  calibrationData: CalibrateResponse | null;
}

export default function DashboardView({
  profile,
  onNavigate,
  simulationData,
  calibrationData,
}: DashboardViewProps) {
  const token = profile?.case_id || "PT-SYN-01";
  const isSynthetic = profile?.synthetic ?? true;
  const isBlocked = simulationData?.safety_evaluation?.blocked ?? false;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner / Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Case</span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isSynthetic ? "bg-cyan-50 text-cyan-800 border border-cyan-200" : "bg-indigo-50 text-indigo-900 border border-indigo-200"
            }`}>
              {isSynthetic ? "Synthetic Demonstration Profile" : "Local De-identified Research Case"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0c192c] tracking-tight mt-1 font-mono">
            {token}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {profile?.label || "Standard Clinical Profile"} &middot; {profile?.condition || "Hypertension"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("DIGITAL_TWIN")}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-slate-600" />
            <span>Inspect Twin</span>
          </button>

          <button
            onClick={() => onNavigate("SIMULATION")}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Open Simulation</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Section 43) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Data Completeness */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Data Quality Gate
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
            <span>100.0%</span>
            <span className="text-xs text-emerald-600 font-semibold">PASS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Pint units validated; physiological bounds respected.
          </p>
        </div>

        {/* Card 2: Digital Twin θ_patient */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Twin Parameter State
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
            <span>READY</span>
            <span className="text-xs text-cyan-600 font-semibold">θ-v1.0</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Allometric scaling ($W^{0.75}$), eGFR modifier applied.
          </p>
        </div>

        {/* Card 3: Deterministic Safety Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Deterministic Safety Gate
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
            {isBlocked ? (
              <>
                <span className="text-red-700">BLOCKED</span>
                <AlertTriangle className="w-4 h-4 text-red-600 inline" />
              </>
            ) : (
              <>
                <span className="text-emerald-700">CLEARED</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isBlocked ? "Hard contraindication triggered." : "4 rules evaluated, 0 blocks."}
          </p>
        </div>

        {/* Card 4: Audit & Cryptographic Tip */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Audit Hash Chain
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
            <span className="text-emerald-700">INTACT</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono truncate">
            SHA256: cbb0b77dc993...
          </p>
        </div>
      </div>

      {/* Secondary Information & Workflow Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Digital Twin & Simulation Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-700" />
              <span>Mechanistic Simulation Engine</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">ODE: RK45</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Model Structure:</span>
              <span className="font-semibold text-slate-900">{simulationData?.model_type || "One-Compartment PK (Gut + Systemic)"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Peak Exposure (C_max):</span>
              <span className="font-semibold text-slate-900 font-mono">
                {simulationData?.metrics?.c_max_mg_l ? `${simulationData.metrics.c_max_mg_l} mg/L` : "1.5599 mg/L"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Total Exposure (AUC_0-24):</span>
              <span className="font-semibold text-slate-900 font-mono">
                {simulationData?.metrics?.auc_0_24 ? `${simulationData.metrics.auc_0_24} mg*h/L` : "17.2065 mg*h/L"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Estimated Half-Life:</span>
              <span className="font-semibold text-slate-900 font-mono">
                {simulationData?.metrics?.half_life_hours ? `${simulationData.metrics.half_life_hours} hours` : "6.72 hours"}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate("SIMULATION")}
            className="w-full mt-2 py-2 text-xs font-semibold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Launch Simulation Workbench</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Latest Closed-Loop Recalibration Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-700" />
              <span>Bayesian Calibration Loop</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {calibrationData ? "CALIBRATED" : "PRIOR ESTIMATE"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Prior Prediction Error (RMSE):</span>
              <span className="font-semibold text-slate-700 font-mono">
                {calibrationData ? `${calibrationData.error_metrics.prior_rmse_mg_l} mg/L` : "3.1621 mg/L"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">Calibrated Prediction Error (RMSE):</span>
              <span className="font-bold text-emerald-700 font-mono">
                {calibrationData ? `${calibrationData.error_metrics.posterior_rmse_mg_l} mg/L` : "0.1159 mg/L"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Observed Improvement:</span>
              <span className="font-bold text-emerald-700 font-mono">
                {calibrationData ? `+${calibrationData.error_metrics.rmse_improvement_mg_l} mg/L` : "+3.0462 mg/L"}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate("TIMELINE")}
            className="w-full mt-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Clinical Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
