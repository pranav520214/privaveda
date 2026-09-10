'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { WebGLFallback } from '@/three/canvas/WebGLFallback';
import { computeBayesianUpdate } from '@/lib/simulation/bayesian';

const MainCanvas = dynamic(
  () => import('@/three/canvas/MainCanvas').then((mod) => mod.MainCanvas),
  { ssr: false, loading: () => <WebGLFallback /> }
);
const BayesianSurfaceScene = dynamic(
  () => import('@/three/scenes/BayesianSurfaceScene').then((mod) => mod.BayesianSurfaceScene),
  { ssr: false }
);

export const BayesianSection: React.FC = () => {
  const [hasObservation, setHasObservation] = useState<boolean>(true);

  const bayesianResult = computeBayesianUpdate(
    1.45,
    0.35,
    1.85,
    0.12,
    3.5
  );

  return (
    <section id="bayesian" className="w-full py-28 px-6 sm:px-10 lg:px-16 bg-comp-bg text-[#EEEAE1] border-b border-comp-border">
      <div className="max-w-[1440px] mx-auto space-y-16">
        {/* Section Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <span className="text-[10px] font-mono tracking-widest text-teal-soft uppercase block">
              08 / BAYESIAN INFERENCE
            </span>
            <div className="w-12 h-[1px] bg-white/20 mt-2 mb-4" />
            <p className="font-mono text-xs text-muted uppercase tracking-wide">
              Conjugate Posterior Update
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-white tracking-tight leading-[0.96]">
              New evidence<br />
              <span className="italic font-light text-[#AFCAC4]">changes the model.</span>
            </h2>
            <p className="font-sans text-sm sm:text-base text-muted max-w-2xl leading-relaxed font-normal">
              As new serum concentrations arrive, the system updates its parameter estimates 
              rather than treating initial population predictions as permanent.
            </p>
          </div>
        </div>

        {/* 3D Computational Sculpture Viewport & Mathematical Readout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: 3D Probability Surface */}
          <div className="lg:col-span-8 h-[460px] sm:h-[520px] w-full border border-comp-border bg-[#030807] relative">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-mono tracking-widest text-teal-soft uppercase">
              &mdash;&mdash; 3D PROBABILISTIC DENSITY MANIFOLD &middot; P(&theta;|y)
            </div>

            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                onClick={() => setHasObservation(false)}
                className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded transition-colors ${
                  !hasObservation
                    ? 'bg-white text-ink font-semibold'
                    : 'text-muted hover:text-white'
                }`}
              >
                Prior Only
              </button>
              <button
                onClick={() => setHasObservation(true)}
                className={`px-3 py-1 text-[11px] font-mono uppercase tracking-wider rounded transition-colors ${
                  hasObservation
                    ? 'bg-teal text-white font-semibold'
                    : 'text-muted hover:text-white'
                }`}
              >
                + Measured Level
              </button>
            </div>

            <MainCanvas cameraPosition={[0, 0, 4.4]}>
              <BayesianSurfaceScene hasObservation={hasObservation} />
            </MainCanvas>

            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] font-mono text-muted uppercase">
              <span>Prior Dispersion (Graphite)</span>
              <span>Observed TDM (Red Needle)</span>
              <span>Posterior Peak (Mineral Teal)</span>
            </div>
          </div>

          {/* Right: Analytical Form & Contraction Metrics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-widest text-teal-soft font-semibold uppercase">
                CONJUGATE FORMULATION
              </span>
              <h4 className="font-serif text-2xl font-normal text-white">
                Gaussian Conjugate Inference
              </h4>
            </div>

            <div className="p-4 bg-comp-panel border border-comp-border space-y-2 font-mono text-xs text-[#AFCAC4]">
              <div>1 / &sigma;_post&sup2; = (1 / &sigma;_prior&sup2;) + (1 / &sigma;_obs&sup2;)</div>
              <div className="text-white text-[11px]">
                &mu;_post = &sigma;_post&sup2; &middot; [ (&mu;_prior / &sigma;_prior&sup2;) + (y_obs / &sigma;_obs&sup2;) ]
              </div>
            </div>

            {/* Industrial Schematic Prior vs Posterior */}
            <div className="space-y-3 font-mono text-xs text-muted border-t border-white/10 pt-4">
              <div className="space-y-1">
                <div className="flex justify-between text-white">
                  <span>PRIOR P(&theta;)</span>
                  <span className="tabular-nums">&mu; = 1.45 L/h &middot; &sigma; = 0.35</span>
                </div>
                <div className="text-[10px] text-muted">90% CI: [0.87 &ndash; 2.03]</div>
              </div>

              {hasObservation && (
                <div className="space-y-1 pt-2 border-t border-white/10">
                  <div className="flex justify-between text-teal-soft font-bold">
                    <span>POSTERIOR P(&theta;|y)</span>
                    <span className="tabular-nums">&mu; = 1.62 L/h &middot; &sigma; = 0.11</span>
                  </div>
                  <div className="text-[10px] text-teal-soft/80">90% CI: [1.44 &ndash; 1.80] &middot; (-68% Variance)</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
