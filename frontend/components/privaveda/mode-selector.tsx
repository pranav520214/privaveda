"use client";

import React from "react";
import { Sparkles, Shield, Database, Lock, Eye, AlertTriangle, ArrowRight, Play } from "lucide-react";
import type { ApplicationMode } from "./types";

interface ModeSelectorProps {
  onSelectMode: (mode: ApplicationMode, startGuidedDemo?: boolean) => void;
}

export default function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[#edf4fa] text-[#0c192c] flex flex-col items-center justify-center p-6">
      {/* Brand Header */}
      <div className="text-center max-w-2xl mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-50 text-cyan-800 border border-cyan-200/80 mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Local-First Precision Medicine</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0c192c] sm:text-4xl">
          PRIVAVEDA
        </h1>
        <p className="mt-1 text-base font-semibold text-cyan-700">
          यथा देहः तथा चिकित्सा &middot; <span className="italic font-serif font-normal text-slate-600">"As the patient, so the treatment."</span>
        </p>
        <p className="mt-2 text-xs font-semibold tracking-widest uppercase text-slate-500">
          Simulation Before Suggestion
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Select an operating domain. Strict technical isolation is enforced between synthetic demonstration models and local research datasets.
        </p>
      </div>

      {/* Mode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Card 1: Demo / Synthetic Mode */}
        <div className="relative group bg-white rounded-2xl border-2 border-cyan-100 hover:border-cyan-400 p-8 shadow-lg shadow-cyan-900/5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
          <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200">
            SYNTHETIC
          </div>

          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-5 text-cyan-600">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="text-xs font-bold tracking-wider text-cyan-700 uppercase">
              SAFE DEMONSTRATION ENVIRONMENT
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Demo / Synthetic Mode
            </h2>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Runs PRIVAVEDA using deterministic synthetic patient profiles. Designed for presentations, testing, education, validation, and competition demonstrations.
            </p>

            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              {[
                "synthetic data (synthetic = true)",
                "no patient identity or PHI",
                "reproducible deterministic seeds",
                "preconfigured clinical scenarios (A, B, C)",
                "live autopilot walkthrough available",
                "safe for public presentation and judging",
              ].map((prop, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span>{prop}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => onSelectMode("DEMO", false)}
              className="w-full py-3 px-4 rounded-xl bg-[#0c192c] hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Safe Demo Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectMode("DEMO", true)}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-semibold text-xs border border-cyan-200 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-cyan-700 text-cyan-700" />
              <span>Run Guided Presentation Autopilot</span>
            </button>
          </div>
        </div>

        {/* Card 2: Research Data Mode */}
        <div className="relative group bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-400 p-8 shadow-lg shadow-slate-900/5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
          <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            ENCRYPTED VAULT
          </div>

          <div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-5 text-slate-700">
              <Database className="w-6 h-6" />
            </div>

            <div className="text-xs font-bold tracking-wider text-slate-600 uppercase">
              LOCAL RESEARCH WORKSPACE
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Research Data Mode
            </h2>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Processes approved real, retrospective, or de-identified clinical data entirely on the local system with automatic pseudonymization and envelope encryption.
            </p>

            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
              {[
                "local-first processing with zero egress",
                "AES-256-GCM envelope encryption",
                "FHIR, CSV & JSON modular ingestion wizard",
                "cryptographic provenance & audit hash chain",
                "clinician & researcher oversight workflow",
                "explicit uncertainty & abstention engine",
              ].map((prop, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span>{prop}</span>
                </div>
              ))}
            </div>

            {/* Mandatory Safety Notice */}
            <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-snug">
                <span className="font-bold block">RESEARCH &amp; DECISION SUPPORT ONLY</span>
                <span>NOT an autonomous prescriber. All outputs require qualified human clinician review.</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => onSelectMode("RESEARCH", false)}
              className="w-full py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Local Research Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
