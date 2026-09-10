'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#06100E] text-[#F5F2EB] border-t border-white/10 pt-24 pb-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Cinematic Final Frame Statement */}
        <div className="border-b border-white/10 pb-16 space-y-6">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#7A817D] block">
            CONCLUSION &middot; PRINCIPLE
          </span>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <h3 className="font-serif italic font-normal text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.08] max-w-3xl">
              Start with one medicine.<br />
              Prove it carefully.
            </h3>
            <div className="font-mono text-xs text-[#AFCAC4] tracking-widest uppercase">
              PRIVAVEDA
            </div>
          </div>
        </div>

        {/* 4-Column Quiet Ledger */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-xs font-mono">
          
          {/* Col 1: System Purpose */}
          <div className="space-y-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A817D] block">
              SYSTEM PHILOSOPHY
            </span>
            <p className="font-sans text-xs text-[#AFCAC4]/80 leading-relaxed font-light">
              Patient-specific pharmacokinetic simulation and clinician-led review platform.
              Coupling mechanistic ODE solvers with Monte Carlo uncertainty.
            </p>
            <div className="text-[11px] text-[#AFCAC4] italic font-serif">
              यथा देहः तथा चिकित्सा &mdash; As the body, so the medicine.
            </div>
          </div>

          {/* Col 2: Project Leadership */}
          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A817D] block">
              PROJECT LEADERSHIP
            </span>
            <div className="text-sm">
              <p className="text-white font-medium">Pranav Kumar Mishra</p>
              <p className="text-xs text-[#7A817D] mt-0.5">Team Lead / Project Lead</p>
              <p className="text-[11px] text-[#7A817D]">Software Architecture &amp; Simulation</p>
            </div>
            <div className="pt-1 text-[10px] text-[#AFCAC4]">
              Theme: Healthcare &amp; HealthTech
            </div>
          </div>

          {/* Col 3: UN SDG Alignment */}
          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A817D] block">
              SUSTAINABLE DEVELOPMENT
            </span>
            <div className="space-y-2 text-[11px] text-[#AFCAC4]/90">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-[#4C9F38] text-white flex items-center justify-center font-bold text-[10px]">
                  3
                </span>
                <span>Good Health &amp; Well-Being</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-[#FD6925] text-white flex items-center justify-center font-bold text-[10px]">
                  9
                </span>
                <span>Industry, Innovation &amp; Infrastructure</span>
              </div>
            </div>
          </div>

          {/* Col 4: Top Navigation & Security */}
          <div className="space-y-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7A817D] block">
              ARCHITECTURE
            </span>
            <p className="text-[11px] text-[#7A817D] leading-relaxed">
              AIR-GAPPED ON-PREMISE CONTAINER DEPLOYMENT &middot; ZERO EXTERNAL TELEMETRY
            </p>
            <div>
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-2 text-xs text-[#AFCAC4] hover:text-white transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Return to Top</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Baseline Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono text-[#7A817D]">
          <p>
            &copy; {new Date().getFullYear()} PRIVAVEDA RESEARCH &middot; ALL SIMULATED METRICS SYNTHETIC FOR DEMONSTRATION
          </p>
          <p className="tracking-widest uppercase text-[#AFCAC4]">
            &ldquo;THE MODEL SIMULATES. THE CLINICIAN DECIDES.&rdquo;
          </p>
        </div>

      </div>
    </footer>
  );
};
