'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldCheck, ShieldAlert, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WebGLFallback } from '@/three/canvas/WebGLFallback';
import { evaluateEvidenceGate } from '@/lib/simulation/evidenceGate';

const MainCanvas = dynamic(
  () => import('@/three/canvas/MainCanvas').then((mod) => mod.MainCanvas),
  { ssr: false, loading: () => <WebGLFallback /> }
);
const EvidenceGateScene = dynamic(
  () => import('@/three/scenes/EvidenceGateScene').then((mod) => mod.EvidenceGateScene),
  { ssr: false }
);

export const EvidenceGateSection: React.FC = () => {
  const [scenario, setScenario] = useState<'valid' | 'stale' | 'severe'>('valid');

  const testCases = {
    valid: {
      eGFR: 38,
      dose: 100,
      ageHours: 4.2,
      tdmCount: 2,
      cyp: 0.5,
      label: 'Valid Scenario (CKD 3b, Fresh Labs)',
    },
    stale: {
      eGFR: 38,
      dose: 100,
      ageHours: 52.0, // Stale!
      tdmCount: 2,
      cyp: 0.5,
      label: 'Stale Specimen (>48h Lab Age)',
    },
    severe: {
      eGFR: 11, // ESRD!
      dose: 100,
      ageHours: 2.0,
      tdmCount: 1,
      cyp: 0.5,
      label: 'Pathophysiological Boundary (eGFR 11)',
    },
  };

  const activeTest = testCases[scenario];
  const evalResult = evaluateEvidenceGate(
    activeTest.eGFR,
    activeTest.dose,
    activeTest.ageHours,
    activeTest.tdmCount,
    activeTest.cyp
  );

  return (
    <section id="evidence-gate" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 10 &middot; EVIDENCE GATE &amp; ABSTENTION
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                DETERMINISTIC PRE-FLIGHT VERIFICATION
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              Sometimes the safest output is no output.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              Autonomous or black-box systems produce output regardless of data degradation.
              PRIVAVEDA establishes deterministic physiological firewalls. If clinical specimens are stale,
              laboratory assays uncalibrated, or organ function outside validated bounds, the software explicitly abstains.
            </p>
          </div>

          {/* Scenario Selector Segmented Control */}
          <div className="shrink-0 flex items-center p-1 bg-[#EEEAE1] border border-[#111513]/14 rounded-none">
            {(['valid', 'stale', 'severe'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={`px-3.5 py-2 text-[11px] font-mono tracking-wider transition-colors uppercase ${
                  scenario === key
                    ? 'bg-[#111513] text-[#F5F2EB]'
                    : 'text-[#7A817D] hover:text-[#111513]'
                }`}
              >
                {key === 'valid' ? 'Case 01: Valid' : key === 'stale' ? 'Case 02: Stale (>48h)' : 'Case 03: ESRD (<15)'}
              </button>
            ))}
          </div>
        </div>

        {/* Inspection Grid: 3D Scanner + Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* 3D Optical Scanner Viewport */}
          <div className="lg:col-span-5 bg-[#06100E] border border-[#111513]/20 relative min-h-[440px] flex flex-col justify-between p-6">
            <div className="flex items-center justify-between text-xs font-mono text-[#AFCAC4]/80 z-10 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  evalResult.overallStatus === 'REVIEWABLE_ZERO_BLOCKS'
                    ? 'bg-[#1E6861]'
                    : evalResult.overallStatus === 'CAUTION_FLAGS_PRESENT'
                    ? 'bg-[#D97706]'
                    : 'bg-[#991B1B]'
                }`} />
                <span className="tracking-widest uppercase text-[10px]">EVIDENCE SCANNER OPTICS</span>
              </div>
              <span className="text-[10px] tracking-wider text-[#7A817D]">VERNIER CALIBRATION</span>
            </div>

            <div className="absolute inset-0 pointer-events-none">
              <MainCanvas cameraPosition={[0, 0, 3.8]}>
                <EvidenceGateScene gateState={evalResult.overallStatus} />
              </MainCanvas>
            </div>

            <div className="z-10 bg-[#06100E]/90 border border-white/10 p-3 flex items-center justify-between font-mono text-[11px] text-[#AFCAC4]">
              <span className="text-[#7A817D]">AUDIT PROVENANCE</span>
              <span className="text-white font-semibold">{evalResult.auditHash}</span>
            </div>
          </div>

          {/* Right Column: Precision Tabular Verification Ledger */}
          <div className="lg:col-span-7 bg-[#EEEAE1] border border-[#111513]/12 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[#111513]/10">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#7A817D]">
                    CHECKPOINT STATUS
                  </span>
                  <div className="font-serif italic text-xl text-[#111513]">
                    {evalResult.overallStatus === 'REVIEWABLE_ZERO_BLOCKS'
                      ? 'Reviewable · Zero Blocks'
                      : evalResult.overallStatus === 'CAUTION_FLAGS_PRESENT'
                      ? 'Caution Flags Present'
                      : 'Simulation Deterministically Abstained'}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-[#7A817D] uppercase block">QUALITY SCORE</span>
                  <span className={`text-xl font-bold tabular-nums ${
                    evalResult.qualityScore >= 80
                      ? 'text-[#1E6861]'
                      : evalResult.qualityScore >= 50
                      ? 'text-[#D97706]'
                      : 'text-[#991B1B]'
                  }`}>
                    {evalResult.qualityScore} <span className="text-xs text-[#7A817D] font-normal">/ 100</span>
                  </span>
                </div>
              </div>

              {/* Individual Laboratory Checks Ledger */}
              <div className="divide-y divide-[#111513]/10 text-xs font-mono">
                {evalResult.checks.map((c) => (
                  <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          c.status === 'PASS'
                            ? 'bg-[#1E6861]'
                            : c.status === 'WARNING'
                            ? 'bg-[#D97706]'
                            : 'bg-[#991B1B]'
                        }`} />
                        <span className="text-[#111513] font-semibold">{c.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 border uppercase tracking-wider ${
                          c.status === 'PASS'
                            ? 'border-[#1E6861]/30 text-[#1E6861] bg-[#1E6861]/5'
                            : c.status === 'WARNING'
                            ? 'border-[#D97706]/30 text-[#D97706] bg-[#D97706]/5'
                            : 'border-[#991B1B]/30 text-[#991B1B] bg-[#991B1B]/5'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="font-sans text-[11px] text-[#7A817D] font-light">
                        {c.message}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-[#111513] font-semibold tabular-nums">{c.measuredValue}</div>
                      <div className="text-[10px] text-[#7A817D]">Bound: {c.safeBoundary}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Abstention Explanation Notice */}
            {evalResult.abstentionReason ? (
              <div className="p-4 bg-[#06100E] border-l-2 border-[#991B1B] text-[#F5F2EB] space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#F87171]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>DETERMINISTIC ABSTENTION DIRECTIVE</span>
                </div>
                <p className="font-sans text-xs text-[#AFCAC4] leading-relaxed font-light">
                  {evalResult.abstentionReason}
                </p>
                <div className="font-mono text-[10px] text-[#7A817D] pt-1">
                  NO SIMULATION GENERATED &middot; CLINICAL PROTOCOL REQUIRES DIRECT NEPHROLOGY CONSULT
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#F5F2EB] border border-[#111513]/10 font-mono text-[10px] text-[#7A817D] flex items-center justify-between">
                <span>PRE-FLIGHT GATE VERIFIED</span>
                <span className="text-[#1E6861]">READY FOR MONTE CARLO ODE SOLVER</span>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
