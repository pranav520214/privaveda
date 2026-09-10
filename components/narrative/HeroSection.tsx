'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ArrowRight } from 'lucide-react';
import { WebGLFallback } from '@/three/canvas/WebGLFallback';

const MainCanvas = dynamic(
  () => import('@/three/canvas/MainCanvas').then((mod) => mod.MainCanvas),
  { ssr: false, loading: () => <WebGLFallback /> }
);
const HumanTwinScene = dynamic(
  () => import('@/three/scenes/HumanTwinScene').then((mod) => mod.HumanTwinScene),
  { ssr: false }
);

interface HeroSectionProps {
  onExplore: () => void;
  onSeeHowItWorks: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExplore,
  onSeeHowItWorks,
}) => {
  return (
    <section id="hero" className="relative w-full min-h-[92vh] flex flex-col justify-between px-6 sm:px-10 lg:px-16 pt-8 pb-16 bg-canvas border-b border-[rgba(17,21,19,0.12)]">
      {/* Subtle top metadata strip */}
      <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between text-[11px] font-mono tracking-widest text-muted uppercase">
        <span>01 / PHARMACOKINETIC SYSTEM</span>
        <span>YATHA DEHAḤ TATHĀ CHIKITSĀ</span>
      </div>

      {/* Main Campaign Grid */}
      <div className="max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto">
        {/* Left Column: Massive Editorial Typography */}
        <div className="lg:col-span-6 space-y-8 z-10">
          <div className="space-y-4">
            <h1 className="font-serif text-6xl sm:text-7xl lg:text-[88px] xl:text-[104px] font-normal tracking-[-0.03em] leading-[0.92] text-ink">
              Patient-specific<br />
              <span className="italic font-light text-graphite">simulation.</span>
            </h1>

            <p className="font-serif text-2xl sm:text-3xl text-graphite italic font-light tracking-tight pt-2">
              Clearer clinical review.
            </p>
          </div>

          <p className="font-sans text-sm sm:text-base text-graphite max-w-md leading-relaxed font-normal">
            Every patient metabolizes medication through distinct organ kinetics. 
            PRIVAVEDA connects mechanistic differential equations with Bayesian updating 
            and explicit uncertainty intervals.
          </p>

          {/* Industrial Schematic Rule Line */}
          <div className="pt-2">
            <div className="text-[10px] font-mono tracking-widest text-muted uppercase flex items-center gap-3">
              <span className="w-12 h-[1px] bg-ink/20 inline-block" />
              <span>PRINCIPLE &middot; AUDITABLE CLINICIAN DECISION</span>
            </div>
            <p className="font-mono text-xs text-ink font-semibold mt-1">
              &ldquo;The model simulates. The clinician decides.&rdquo;
            </p>
          </div>

          {/* Quiet, Confident CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onExplore}
              className="flex items-center gap-2 px-6 py-3 rounded bg-ink text-canvas hover:bg-teal font-sans text-xs tracking-wider uppercase font-medium transition-all"
            >
              <span>Explore The Simulation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onSeeHowItWorks}
              className="px-5 py-3 rounded border border-ink/20 text-ink hover:border-ink text-xs font-sans tracking-wider uppercase transition-all bg-paper/40"
            >
              See How It Works
            </button>
          </div>
        </div>

        {/* Right 55–60%: Studio 3D Composition */}
        <div className="lg:col-span-6 h-[500px] sm:h-[580px] lg:h-[640px] w-full relative flex items-center justify-center">
          <div className="w-full h-full relative">
            <MainCanvas cameraPosition={[0, 0, 4.0]}>
              <HumanTwinScene />
            </MainCanvas>

            {/* Industrial Schematic Overlay Callouts */}
            <div className="absolute top-8 right-4 text-right hidden sm:block">
              <div className="text-[10px] font-mono tracking-widest text-muted uppercase">
                OPTICAL FLUID CHAMBER &middot; V₁
              </div>
              <div className="text-xs font-mono text-ink">
                Central Plasma Distribution
              </div>
              <div className="w-24 h-[1px] bg-ink/20 ml-auto mt-1" />
            </div>

            <div className="absolute bottom-8 left-4 text-left hidden sm:block">
              <div className="w-24 h-[1px] bg-ink/20 mb-1" />
              <div className="text-[10px] font-mono tracking-widest text-muted uppercase">
                LIGAND COVARIATE MAPPING
              </div>
              <div className="text-xs font-mono text-ink">
                Allometric Scaling CL &prop; W^0.75
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="max-w-[1440px] w-full mx-auto pt-6 border-t border-[rgba(17,21,19,0.10)] grid grid-cols-2 md:grid-cols-4 gap-6 text-xs font-mono text-muted">
        <div>
          <span className="block text-[9px] uppercase tracking-widest text-muted/80">PARADIGM</span>
          <span className="text-graphite font-medium">Mechanistic ODE Solvers</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase tracking-widest text-muted/80">INFERENCE</span>
          <span className="text-graphite font-medium">Conjugate Bayesian MAP</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase tracking-widest text-muted/80">UNCERTAINTY</span>
          <span className="text-graphite font-medium">10th&ndash;90th Percentile Range</span>
        </div>
        <div>
          <span className="block text-[9px] uppercase tracking-widest text-muted/80">GOVERNANCE</span>
          <span className="text-teal font-medium">Deterministic Safety Gate</span>
        </div>
      </div>
    </section>
  );
};
