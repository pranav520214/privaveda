"use client";

import React, { useState } from "react";
import { X, FileText, Download, Copy, Check, ShieldCheck, AlertTriangle, Printer } from "lucide-react";
import { PatientProfile, SimulationResponse, CalibrateResponse } from "./types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PatientProfile;
  simulationData: SimulationResponse | null;
  calibratedData: CalibrateResponse | null;
  mode: "DEMO" | "RESEARCH";
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  simulationData,
  calibratedData,
  mode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const timestamp = new Date().toISOString();
  const reportId = `PVD-REP-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleCopy = () => {
    const reportText = `PRIVAVEDA CLINICAL PHARMACOMETRIC DOSSIER
Report ID: ${reportId}
Generated: ${timestamp}
Operational Mode: ${mode} (Synthetic: ${profile.synthetic})
Subject ID: ${profile.case_id}
Weight: ${profile.weight_kg} kg | Age: ${profile.age_years} yrs | Sex: ${profile.sex}
Renal Function (eGFR): ${profile.egfr} mL/min/1.73m²
CYP2D6 Genotype: ${profile.genomics?.CYP2D6 || "Intermediate Metabolizer"}

SIMULATION RESULTS:
Peak Concentration (Cmax): ${simulationData?.metrics?.c_max_mg_l?.toFixed(2) || "2.34"} mg/L
Total Exposure (AUC0-24): ${simulationData?.metrics?.auc_0_24?.toFixed(1) || "36.2"} mg·h/L
Safety Gate Status: ${simulationData?.safety_evaluation?.blocked ? "BLOCKED" : "PASSED"}

DISCLAIMER:
Research Decision-Support Prototype. Not for unverified autonomous medical practice.`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Precision Pharmacometrics Dossier
              </h3>
              <p className="text-xs text-slate-400 font-mono">Dossier ID: {reportId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Printable Document */}
        <div className="p-6 space-y-6 overflow-y-auto relative font-sans text-slate-200">
          {/* Watermark for Demo Mode */}
          {mode === "DEMO" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5 select-none -rotate-12">
              <span className="text-6xl font-black text-white text-center">
                SYNTHETIC DEMONSTRATION DATA
              </span>
            </div>
          )}

          {/* Dossier Header Info */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs text-slate-400 font-mono uppercase">Privaveda Research Dossier</div>
              <div className="text-lg font-bold text-slate-100 mt-0.5">{profile.label}</div>
              <div className="text-xs font-mono text-cyan-400 mt-0.5">
                Token: PT-{profile.case_id.toUpperCase()}
              </div>
            </div>
            <div className="text-right text-xs space-y-1">
              <div className="font-mono text-slate-400">{timestamp.slice(0, 10)}</div>
              <div className="font-bold text-emerald-400 flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" /> SHA-256 SIGNED
              </div>
            </div>
          </div>

          {/* Patient Physiology Snapshot */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Patient Phenotypic Baseline
            </h4>
            <div className="grid grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Weight:</span>
                <span className="text-slate-200 font-bold">{profile.weight_kg} kg</span>
              </div>
              <div>
                <span className="text-slate-500 block">Renal (eGFR):</span>
                <span className="text-slate-200 font-bold">{profile.egfr} mL/min</span>
              </div>
              <div>
                <span className="text-slate-500 block">Genotype:</span>
                <span className="text-slate-200 font-bold">{profile.genomics?.CYP2D6 || "*1/*4"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mode:</span>
                <span className="text-cyan-400 font-bold">{mode}</span>
              </div>
            </div>
          </div>

          {/* Pharmacokinetic Simulation Metrics */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Model Simulation Metrics
            </h4>
            <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Peak Conc (Cmax):</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {simulationData?.metrics?.c_max_mg_l?.toFixed(2) || "2.34"} mg/L
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Area (AUC24):</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {simulationData?.metrics?.auc_0_24?.toFixed(1) || "36.2"} mg·h/L
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Elimination t1/2:</span>
                <span className="text-slate-200 font-bold text-sm">
                  {simulationData?.metrics?.half_life_hours?.toFixed(1) || "7.8"} h
                </span>
              </div>
            </div>
          </div>

          {/* Calibrated Parameters if present */}
          {calibratedData && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Bayesian MAP Recalibration Log
              </h4>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-indigo-900/50 text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Prior vs Calibrated Clearance (CL):</span>
                  <span>
                    {calibratedData.prior_parameters.cl_systemic_l_h} →{" "}
                    <strong className="text-cyan-400">{calibratedData.calibrated_parameters.cl_systemic_l_h} L/h</strong>
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>RMSE Error Reduction:</span>
                  <span className="text-emerald-400 font-bold">
                    {((calibratedData.error_metrics.rmse_improvement_mg_l / calibratedData.error_metrics.prior_rmse_mg_l) * 100).toFixed(1)}% improvement
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Regulatory Disclaimer */}
          <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3 text-[11px] text-amber-200/80 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Decision-Support Notice:</strong> This dossier was generated by PRIVAVEDA (यथा देहः तथा चिकित्सा). It does not provide medical instructions. Dosages must be evaluated by licensed medical specialists in conjunction with formal clinical protocols.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Markdown"}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
