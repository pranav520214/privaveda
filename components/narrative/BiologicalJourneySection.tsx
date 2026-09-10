'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { WebGLFallback } from '@/three/canvas/WebGLFallback';

const MainCanvas = dynamic(
  () => import('@/three/canvas/MainCanvas').then((mod) => mod.MainCanvas),
  { ssr: false, loading: () => <WebGLFallback /> }
);
const VascularFlowScene = dynamic(
  () => import('@/three/scenes/VascularFlowScene').then((mod) => mod.VascularFlowScene),
  { ssr: false }
);

export const BiologicalJourneySection: React.FC = () => {
  const journeyPhases = [
    { num: '01', title: 'ADMINISTRATION & ABSORPTION', desc: 'Oral formulation disintegrates within gut mucosa. Bioavailability fraction (F = 0.85) enters portal circulation.' },
    { num: '02', title: 'CENTRAL CIRCULATION', desc: 'Molecules enter central venous plasma, distributed at physiological cardiac output across central vascular volume V_c.' },
    { num: '03', title: 'ORGAN EXTRACTION', desc: 'Hepatic cytochrome P450 hydroxylation coupled with renal glomerulus ultrafiltration continuously clears parent drug.' },
    { num: '04', title: 'OBSERVED SERUM LEVEL', desc: 'Residual circulating concentration is quantified via Therapeutic Drug Monitoring (TDM) serum draw.' },
  ];

  return (
    <section id="biology" className="w-full py-24 px-6 sm:px-10 lg:px-16 bg-canvas border-b border-[rgba(17,21,19,0.12)]">
      <div className="max-w-[1440px] mx-auto space-y-16">
        {/* Section Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <span className="text-[10px] font-mono tracking-widest text-muted uppercase block">
              03 / PHARMACOKINETICS
            </span>
            <div className="w-12 h-[1px] bg-ink/20 mt-2 mb-4" />
            <p className="font-mono text-xs text-graphite uppercase tracking-wide">
              Vascular Micro-Transport
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-ink tracking-tight leading-[1.05]">
              How medicine moves through a living patient.
            </h2>
            <p className="font-sans text-sm sm:text-base text-graphite max-w-2xl leading-relaxed font-normal">
              Pharmacokinetics describes the temporal rate of drug absorption, distribution, metabolism, 
              and excretion. The visualization below illustrates microscopic intravascular transport.
            </p>
          </div>
        </div>

        {/* Studio Viewport & Industrial Schematic Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: 3D Vascular Flow Scene */}
          <div className="lg:col-span-7 h-[420px] sm:h-[480px] w-full border border-[rgba(17,21,19,0.14)] bg-[#F0ECE3] relative">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-mono tracking-widest text-muted uppercase">
              &mdash;&mdash; MICRO-VASCULAR ENDOTHELIAL LUMEN
            </div>

            <MainCanvas cameraPosition={[0, 0, 4.4]}>
              <VascularFlowScene />
            </MainCanvas>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-muted uppercase">
              <span>Erythrocytes (Crimson)</span>
              <span>Ligand Molecules (Mineral Teal)</span>
            </div>
          </div>

          {/* Right: Industrial Schematic Phases */}
          <div className="lg:col-span-5 space-y-6">
            {journeyPhases.map((phase) => (
              <div key={phase.num} className="space-y-1 pb-4 border-b border-[rgba(17,21,19,0.10)]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-teal font-semibold">{phase.num}</span>
                  <span className="w-6 h-[1px] bg-ink/20 inline-block" />
                  <h4 className="font-mono text-xs tracking-wider text-ink font-bold uppercase">
                    {phase.title}
                  </h4>
                </div>
                <p className="font-sans text-xs text-graphite leading-relaxed pl-9 font-normal">
                  {phase.desc}
                </p>
              </div>
            ))}

            <div className="pt-2 pl-9 text-[10px] font-mono text-muted italic">
              * Explanatory conceptual visualization. Does not assert exact patient histology.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
