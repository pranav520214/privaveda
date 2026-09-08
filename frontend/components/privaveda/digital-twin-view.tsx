"use client";

import React, { useEffect, useState } from "react";
import { Cpu, HeartPulse, Droplet, Dna, ArrowDown, CheckCircle2, RotateCw } from "lucide-react";
import type { PatientProfile } from "./types";

interface DigitalTwinViewProps {
  profile: PatientProfile | null;
}

export default function DigitalTwinView({ profile }: DigitalTwinViewProps) {
  const [animStage, setAnimStage] = useState<number>(0);

  const triggerAnimation = () => {
    setAnimStage(0);
    setTimeout(() => setAnimStage(1), 300);  // Demographics appear
    setTimeout(() => setAnimStage(2), 700);  // Labs appear
    setTimeout(() => setAnimStage(3), 1100); // Genomics appear
    setTimeout(() => setAnimStage(4), 1500); // Converge into central twin
    setTimeout(() => setAnimStage(5), 2000); // Parameters fully populated
  };

  useEffect(() => {
    triggerAnimation();
  }, [profile?.case_id]);

  const weight = profile?.weight_kg || 72.0;
  const egfr = profile?.egfr || 90.0;
  const cypScore = profile?.genomics?.cyp2d6_score ?? 2.0;

  // Derived physiological values
  const vCentral = (14.0 * (weight / 70.0)).toFixed(1);
  const vPeripheral = (28.0 * (weight / 70.0)).toFixed(1);
  const clRenal = (2.0 * Math.pow(weight / 70.0, 0.75) * (egfr / 100.0)).toFixed(2);
  const clHepatic = (2.5 * Math.pow(weight / 70.0, 0.75) * (cypScore / 2.0)).toFixed(2);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0c192c] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-700" />
            <span>Bio-Mathematical Digital Twin (&theta;<sub>patient</sub>)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Abstract biological parameter representation with organ clearance factors, physiological volumes, and uncertainty bounds.
          </p>
        </div>

        <button
          onClick={triggerAnimation}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Replay Convergence</span>
        </button>
      </div>

      {/* Convergence Stream (Steps converging into twin) */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        <div className={`p-2.5 rounded-xl border transition-all duration-500 ${animStage >= 1 ? "bg-cyan-50 border-cyan-300 text-cyan-900" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
          <span className="font-bold block text-[10px] uppercase">1. Demographics</span>
          <span>{weight} kg &middot; {profile?.age_years || 48}y</span>
        </div>
        <div className={`p-2.5 rounded-xl border transition-all duration-500 ${animStage >= 2 ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
          <span className="font-bold block text-[10px] uppercase">2. Labs</span>
          <span>eGFR: {egfr} mL/min</span>
        </div>
        <div className={`p-2.5 rounded-xl border transition-all duration-500 ${animStage >= 3 ? "bg-indigo-50 border-indigo-300 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
          <span className="font-bold block text-[10px] uppercase">3. Genomics</span>
          <span>CYP2D6: {cypScore}</span>
        </div>
        <div className={`p-2.5 rounded-xl border transition-all duration-500 ${animStage >= 4 ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
          <span className="font-bold block text-[10px] uppercase">4. Physiology</span>
          <span>Allometric $W^{0.75}$</span>
        </div>
        <div className={`p-2.5 rounded-xl border transition-all duration-500 ${animStage >= 5 ? "bg-blue-50 border-blue-300 text-blue-900" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
          <span className="font-bold block text-[10px] uppercase">5. Parameter Vector</span>
          <span className="font-mono">&theta;<sub>patient</sub> v1.0</span>
        </div>
      </div>

      {/* Main Visualizer: Central Twin with Organ Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left Column Organs: Liver & Kidney */}
        <div className="space-y-4">
          {/* Card: Liver */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Dna className="w-4 h-4 text-indigo-600" />
                <span>Liver / Hepatic Metabolism</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                MODEL-DERIVED
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Clearance ($CL_h$):</span>
                <span className="font-bold font-mono text-slate-900">{clHepatic} L/h</span>
              </div>
              <div className="flex justify-between">
                <span>Enzyme Modifier:</span>
                <span className="font-semibold text-slate-700">CYP2D6 (Score {cypScore})</span>
              </div>
              <div className="flex justify-between">
                <span>Uncertainty:</span>
                <span className="font-mono text-slate-500">&sigma;<sub>CL</sub> = 25.0%</span>
              </div>
            </div>
          </div>

          {/* Card: Kidney */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Kidney / Renal Filtration</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                MEASURED
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Renal Clearance ($CL_r$):</span>
                <span className="font-bold font-mono text-slate-900">{clRenal} L/h</span>
              </div>
              <div className="flex justify-between">
                <span>Filtration Rate (eGFR):</span>
                <span className="font-semibold text-slate-700">{egfr} mL/min</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold text-emerald-700">Intact / Normal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Central Digital Twin Core */}
        <div className="bg-gradient-to-b from-[#0c192c] to-[#152744] text-white p-6 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-4 border border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
            <Cpu className="w-10 h-10 text-cyan-400 animate-pulse" />
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">Patient Twin State</span>
            <h2 className="text-xl font-bold font-mono text-white mt-0.5">
              {profile?.case_id || "PT-SYN-01"}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Physiological Mass Conservation Enforced
            </p>
          </div>

          <div className="w-full pt-4 border-t border-slate-700/60 text-xs space-y-2 font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Total Clearance (CL_sys):</span>
              <span className="text-cyan-300 font-bold">{(parseFloat(clRenal) + parseFloat(clHepatic)).toFixed(2)} L/h</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Distribution Volume (V_tot):</span>
              <span className="text-cyan-300 font-bold">{(parseFloat(vCentral) + parseFloat(vPeripheral)).toFixed(1)} L</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Absorption Rate (k_a):</span>
              <span className="text-cyan-300 font-bold">1.20 h⁻¹</span>
            </div>
          </div>
        </div>

        {/* Right Column Organs: Blood & Target Compartment */}
        <div className="space-y-4">
          {/* Card: Blood Pool */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-red-600" />
                <span>Central Blood Compartment ($V_c$)</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase">
                ESTIMATED
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Plasma Volume:</span>
                <span className="font-bold font-mono text-slate-900">{vCentral} L</span>
              </div>
              <div className="flex justify-between">
                <span>Equilibration Flow ($Q$):</span>
                <span className="font-semibold text-slate-700">8.0 L/h</span>
              </div>
              <div className="flex justify-between">
                <span>Sampling Site:</span>
                <span className="font-semibold text-slate-700">Systemic Venous</span>
              </div>
            </div>
          </div>

          {/* Card: Peripheral Tissue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-600" />
                <span>Peripheral Distribution ($V_p$)</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase">
                ESTIMATED
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Tissue Volume ($V_p$):</span>
                <span className="font-bold font-mono text-slate-900">{vPeripheral} L</span>
              </div>
              <div className="flex justify-between">
                <span>Partition Coefficient ($K_p$):</span>
                <span className="font-semibold text-slate-700">1.50 (Lipophilic)</span>
              </div>
              <div className="flex justify-between">
                <span>State:</span>
                <span className="font-semibold text-slate-700">Non-Eliminating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
