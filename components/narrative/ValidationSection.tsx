'use client';

import React from 'react';
import { VALIDATION_STAGES } from '@/lib/content/privavedaData';

export const ValidationSection: React.FC = () => {
  return (
    <section id="validation" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 14 &middot; VALIDATION PATHWAY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                5-STAGE ROADMAP
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              Start with one medicine. Prove it carefully.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              PRIVAVEDA adheres to strict scientific discipline. We distinguish without ambiguity
              between the current synthetic prototype, planned retrospective trials, and future platform horizons.
            </p>
          </div>

          <div className="font-mono text-xs text-[#7A817D]">
            GROUNDED IN REAL CLINICAL EVIDENCE &middot; NO FABRICATED TRIALS
          </div>
        </div>

        {/* 5-Stage Editorial Milestone Strip with 1px Hairlines */}
        <div className="grid grid-cols-1 md:grid-cols-5 border-t border-b border-[#111513]/10 divide-y md:divide-y-0 md:divide-x divide-[#111513]/10 bg-[#EEEAE1]">
          {VALIDATION_STAGES.map((s) => (
            <div
              key={s.stage}
              className="p-6 flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest text-[#7A817D] uppercase font-bold">
                    STAGE 0{s.stage}
                  </span>
                  <span className={`font-mono text-[9px] uppercase px-2 py-0.5 border tracking-wider font-medium ${
                    s.status === 'CURRENT'
                      ? 'border-[#1E6861]/40 text-[#1E6861] bg-[#1E6861]/10'
                      : s.status === 'NEXT'
                      ? 'border-[#D97706]/40 text-[#D97706] bg-[#D97706]/10'
                      : 'border-[#7A817D]/30 text-[#7A817D] bg-[#F5F2EB]'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <h4 className="font-serif italic font-normal text-xl text-[#111513] leading-snug">
                  {s.name}
                </h4>

                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  {s.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#111513]/10 font-mono text-[10px] text-[#7A817D] uppercase">
                {s.status === 'CURRENT' && 'Complete in Demo'}
                {s.status === 'NEXT' && 'Hospital TDM Datasets'}
                {s.status === 'PLANNED' && 'Pharmacy Review Loop'}
                {s.status === 'FUTURE' && 'Site Governance'}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
