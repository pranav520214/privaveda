'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { WebGLFallback } from '@/three/canvas/WebGLFallback';

const MainCanvas = dynamic(
  () => import('@/three/canvas/MainCanvas').then((mod) => mod.MainCanvas),
  { ssr: false, loading: () => <WebGLFallback /> }
);
const MolecularScene = dynamic(
  () => import('@/three/scenes/MolecularScene').then((mod) => mod.MolecularScene),
  { ssr: false }
);

export const MolecularSection: React.FC = () => {
  return (
    <section id="molecular" className="w-full py-24 px-6 sm:px-10 lg:px-16 bg-canvas border-b border-[rgba(17,21,19,0.12)]">
      <div className="max-w-[1440px] mx-auto space-y-16">
        {/* Section Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <span className="text-[10px] font-mono tracking-widest text-muted uppercase block">
              04 / BIOLOGICAL COMPLEXITY
            </span>
            <div className="w-12 h-[1px] bg-ink/20 mt-2 mb-4" />
            <p className="font-mono text-xs text-graphite uppercase tracking-wide">
              Molecular Resolution
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-ink tracking-tight leading-[1.05]">
              From biological complexity to computational parameters.
            </h2>
            <p className="font-sans text-sm sm:text-base text-graphite max-w-2xl leading-relaxed font-normal">
              Biological organisms exhibit near-infinite molecular variation. PRIVAVEDA condenses 
              clinically actionable pharmacogenomic classifications (such as CYP2D6 enzyme activity scores) 
              into mechanistic ODE coefficients.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* 3D Molecular Canvas */}
          <div className="lg:col-span-6 h-[400px] sm:h-[460px] w-full border border-[rgba(17,21,19,0.14)] bg-[#F0ECE3] relative">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-mono tracking-widest text-muted uppercase">
              &mdash;&mdash; BIOLOGICAL STRUCTURE &rarr; MEASURABLE FEATURES
            </div>

            <MainCanvas cameraPosition={[0, 0, 3.8]}>
              <MolecularScene />
            </MainCanvas>

            <div className="absolute bottom-4 left-4 right-4 text-center text-[10px] font-mono text-muted uppercase">
              Double-Helix Macromolecular Representation &middot; Slow Drift
            </div>
          </div>

          {/* Right: Explicit Clinical Boundary */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2 border-l-2 border-teal pl-6">
              <span className="text-[10px] font-mono tracking-widest text-teal font-semibold uppercase">
                SCIENTIFIC INTEGRITY SPECIFICATION
              </span>
              <h4 className="font-serif text-2xl font-normal text-ink">
                Model Scope &amp; Exclusion of Whole Genomics
              </h4>
              <p className="font-sans text-xs text-graphite leading-relaxed font-normal pt-1">
                PRIVAVEDA deliberately limits genomic inputs to validated single-gene enzyme genotypes 
                (such as CYP2D6 *1/*4). Whole-genome sequencing is explicitly excluded to preserve 
                reproducibility and prevent overfitting in bedside acute scenarios.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[rgba(17,21,19,0.10)] text-xs font-mono">
              <div>
                <span className="text-[10px] text-muted uppercase block">PARAMETER COVARIATE</span>
                <span className="text-ink font-semibold">CYP2D6 Activity Score (0.0 &ndash; 2.0)</span>
              </div>
              <div>
                <span className="text-[10px] text-muted uppercase block">CLEARANCE MODULATION</span>
                <span className="text-ink font-semibold">f(CYP) = 0.40 + 0.60 &middot; Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
