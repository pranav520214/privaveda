"use client";

import React, { useEffect, useState } from "react";
import { Activity, Play, ChevronRight, Dna } from "lucide-react";

interface StartupScreenProps {
  onComplete: () => void;
}

export default function StartupScreen({ onComplete }: StartupScreenProps) {
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mediaQuery.matches) {
        onComplete();
        return;
      }
    }

    const t1 = setTimeout(() => setStage(1), 400);   // Step 1: P mark appears
    const t2 = setTimeout(() => setStage(2), 900);   // Step 2: DNA strand illuminates
    const t3 = setTimeout(() => setStage(3), 1400);  // Step 3: Cyan ECG line extends
    const t4 = setTimeout(() => setStage(4), 1900);  // Step 4: Tagline fades in
    const t5 = setTimeout(() => {
      setStage(5);
      onComplete();                                  // Step 5: Complete & show mode selector
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-white via-slate-50 to-[#eef5fa] text-[#0c192c]">
      {/* Background Indian geometric subtle mandala lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 600 600" className="w-[800px] h-[800px] animate-spin" style={{ animationDuration: "120s" }}>
          <circle cx="300" cy="300" r="280" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="300" cy="300" r="200" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
          <polygon points="300,50 516,425 84,425" fill="none" stroke="currentColor" strokeWidth="1" />
          <polygon points="300,550 516,175 84,175" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="300" cy="300" r="80" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      {/* Main Logo & P Mark Container */}
      <div className="relative flex flex-col items-center text-center px-6">
        <div className="relative flex items-center justify-center w-28 h-28 mb-6 rounded-2xl bg-white shadow-xl shadow-cyan-950/5 border border-slate-200/80 transition-all duration-700">
          {/* Animated P Mark with DNA strand */}
          <div className={`transition-all duration-700 ${stage >= 1 ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
            <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Primary P Backbone */}
              <path
                d="M26 18 H52 C68 18 78 28 78 42 C78 56 68 66 52 66 H40 V86 H26 V18 Z"
                fill="#0c192c"
                className="transition-all duration-500"
              />
              <path
                d="M40 32 H50 C58 32 64 36 64 42 C64 48 58 52 50 52 H40 V32 Z"
                fill="#ffffff"
              />
              {/* Inner Minimal DNA helix nodes in the P bowl */}
              {stage >= 2 && (
                <g className="transition-opacity duration-500 animate-pulse">
                  <circle cx="48" cy="38" r="3.5" fill="#00b4d8" />
                  <circle cx="56" cy="42" r="3.5" fill="#0284c7" />
                  <circle cx="48" cy="46" r="3.5" fill="#00b4d8" />
                  <line x1="48" y1="38" x2="56" y2="42" stroke="#00b4d8" strokeWidth="1.5" strokeDasharray="1 2" />
                  <line x1="56" y1="42" x2="48" y2="46" stroke="#00b4d8" strokeWidth="1.5" strokeDasharray="1 2" />
                </g>
              )}
            </svg>
          </div>

          {/* ECG Pulse Overlay line */}
          {stage >= 3 && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-32 h-6 flex items-center justify-center">
              <svg viewBox="0 0 120 24" className="w-full h-full text-cyan-500">
                <path
                  d="M0 12 H45 L50 2 L56 22 L62 8 L66 16 L70 12 H120"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="stroke-dash-animation"
                  style={{
                    strokeDasharray: 120,
                    animation: "dash 1.2s ease-out forwards",
                  }}
                />
              </svg>
            </div>
          )}
        </div>

        {/* Title & Brand */}
        <h1 className={`text-3xl font-extrabold tracking-widest text-[#0c192c] transition-all duration-700 ${stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          PRIVAVEDA
        </h1>

        {/* Sanskrit Tagline */}
        <div className={`mt-2 text-sm font-semibold tracking-wider text-cyan-700 transition-all duration-700 ${stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          यथा देहः तथा चिकित्सा
        </div>

        {/* English Translation & Core Principle */}
        <div className={`mt-1 text-xs text-slate-500 max-w-sm transition-all duration-700 ${stage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <span className="italic font-serif">"As the patient, so the treatment."</span>
          <div className="mt-2 inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-cyan-50 text-cyan-800 border border-cyan-200/60 shadow-xs">
            Simulation Before Suggestion
          </div>
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 bg-white/80 hover:bg-white border border-slate-200 rounded-full shadow-xs transition-all flex items-center gap-1 cursor-pointer"
      >
        <span>Skip animation</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <style jsx>{`
        @keyframes dash {
          0% {
            stroke-dashoffset: 120;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
