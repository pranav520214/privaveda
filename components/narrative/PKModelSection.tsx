'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { WebGLFallback } from '@/three/canvas/WebGLFallback';

const MainCanvas = dynamic(
  () => import('@/three/canvas/MainCanvas').then((mod) => mod.MainCanvas),
  { ssr: false, loading: () => <WebGLFallback /> }
);
const CompartmentScene = dynamic(
  () => import('@/three/scenes/CompartmentScene').then((mod) => mod.CompartmentScene),
  { ssr: false }
);

export const PKModelSection: React.FC = () => {
  const [modelType, setModelType] = useState<'1-Compartment' | '2-Compartment'>('1-Compartment');

  return (
    <section id="pk-model" className="w-full py-24 px-6 sm:px-10 lg:px-16 bg-canvas border-b border-[rgba(17,21,19,0.12)]">
      <div className="max-w-[1440px] mx-auto space-y-16">
        {/* Section Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <span className="text-[10px] font-mono tracking-widest text-muted uppercase block">
              06 / MECHANISTIC PHARMACOKINETICS
            </span>
            <div className="w-12 h-[1px] bg-ink/20 mt-2 mb-4" />
            <p className="font-mono text-xs text-graphite uppercase tracking-wide">
              Coupled Fluid Compartments
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-ink tracking-tight leading-[1.05]">
              The body becomes<br />
              <span className="italic font-light text-graphite">a dynamic system.</span>
            </h2>
            <p className="font-sans text-sm sm:text-base text-graphite max-w-2xl leading-relaxed font-normal">
              The geometry is the explanation. Pharmacokinetic modeling transforms anatomy into 
              interconnected distribution volumes and mass transfer flux rates.
            </p>
          </div>
        </div>

        {/* Studio Viewport & Model Architecture Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: 3D Precision Fluid Chambers */}
          <div className="lg:col-span-8 h-[460px] sm:h-[520px] w-full border border-[rgba(17,21,19,0.14)] bg-[#F0ECE3] relative">
            {/* Architectural Schematic Annotations */}
            <div className="absolute top-4 left-4 z-10 text-[10px] font-mono tracking-widest text-muted uppercase">
              &mdash;&mdash; FLUID DISTRIBUTION CHAMBERS
            </div>

            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                onClick={() => setModelType('1-Compartment')}
                className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded transition-colors ${
                  modelType === '1-Compartment'
                    ? 'bg-ink text-canvas font-semibold'
                    : 'text-graphite hover:text-ink'
                }`}
              >
                1-Compartment
              </button>
              <button
                onClick={() => setModelType('2-Compartment')}
                className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded transition-colors ${
                  modelType === '2-Compartment'
                    ? 'bg-ink text-canvas font-semibold'
                    : 'text-graphite hover:text-ink'
                }`}
              >
                2-Compartment
              </button>
            </div>

            <MainCanvas cameraPosition={[0, 0, 4.8]}>
              <CompartmentScene modelType={modelType} />
            </MainCanvas>

            {/* Industrial Fluid Labels */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] font-mono text-muted uppercase">
              <span>Depot (Gut) &rarr; k_a</span>
              <span>Central (V₁)</span>
              <span>Clearance (CL) &rarr; Sink</span>
            </div>
          </div>

          {/* Right: Analytical Equations & Minimalist Telemetry */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-widest text-teal font-semibold uppercase">
                MASS BALANCE FORMULATION
              </span>
              <h4 className="font-serif text-2xl font-normal text-ink">
                Linear Differential Balance
              </h4>
              <p className="text-xs font-sans text-graphite leading-relaxed font-normal">
                Rate of concentration change within central volume V₁ is governed by mucosal input, 
                intercompartmental clearance, and irreversible elimination:
              </p>
            </div>

            <div className="p-4 bg-paper/60 border border-[rgba(17,21,19,0.12)] space-y-2 font-mono text-xs">
              <div className="text-ink font-semibold">
                dC/dt = input &minus; distribution &minus; elimination
              </div>
              <div className="text-muted text-[11px] pt-1 border-t border-ink/10">
                CL = CL_pop &middot; (Weight / 70)^0.75 &middot; (eGFR / 90)^0.85
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono text-muted">
              <div className="flex justify-between border-b border-[rgba(17,21,19,0.08)] pb-1.5">
                <span>Central Distribution Volume V₁</span>
                <span className="text-ink font-semibold tabular-nums">43.7 L</span>
              </div>
              <div className="flex justify-between border-b border-[rgba(17,21,19,0.08)] pb-1.5">
                <span>Absorption Velocity k_a</span>
                <span className="text-ink font-semibold tabular-nums">1.10 h⁻¹</span>
              </div>
              <div className="flex justify-between border-b border-[rgba(17,21,19,0.08)] pb-1.5">
                <span>Elimination Constant k_e</span>
                <span className="text-ink font-semibold tabular-nums">0.034 h⁻¹</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
