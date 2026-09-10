'use client';

import React from 'react';
import Image from 'next/image';

export const MetricsSdgSection: React.FC = () => {
  const metrics = [
    {
      name: 'Prediction Error (MAPE / RMSE)',
      category: 'PHARMACOKINETIC ACCURACY',
      status: 'TO BE VALIDATED',
      desc: 'Mean Absolute Percentage Error between Bayesian simulated concentration and observed serum TDM levels across patient cohorts.',
      benchmark: 'Target: < 15% MAPE in validation cohort',
    },
    {
      name: 'Interval Calibration',
      category: 'UNCERTAINTY RELIABILITY',
      status: 'TO BE VALIDATED',
      desc: 'Empirical coverage of the 90% credible envelope. 90% of observed serum levels should fall within the simulated boundaries.',
      benchmark: 'Target: 88% - 92% empirical coverage',
    },
    {
      name: 'Safety-Gate Behavior',
      category: 'ABSTENTION FIDELITY',
      status: 'TO BE VALIDATED',
      desc: 'Proportion of stale or pathophysiologically out-of-boundary inputs correctly intercepted and abstained by deterministic rules.',
      benchmark: 'Target: 100% interception of critical violations',
    },
    {
      name: 'Clinical Review Time',
      category: 'WORKFLOW EFFICIENCY',
      status: 'TO BE VALIDATED',
      desc: 'Time required for clinical pharmacists to evaluate, adjust, and document a personalized dosing regimen vs manual nomograms.',
      benchmark: 'Target: < 3 minutes per complex case review',
    },
  ];

  return (
    <section id="metrics" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 17 &middot; IMPACT &amp; OUTCOMES
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                SCIENTIFIC INTEGRITY
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              Measurable validation without fabricated claims.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              We decline to claim premature clinical trial results. Every target metric is framed
              as an empirical hypothesis with explicit validation targets to be measured in hospital partnership trials.
            </p>
          </div>

          <div className="font-mono text-xs text-[#7A817D]">
            ALL TRIAL METRICS LABELED: <strong>TO BE VALIDATED</strong>
          </div>
        </div>

        {/* 4 Validation Metrics Grid with 1px hairlines */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-b border-[#111513]/10 divide-y md:divide-y-0 md:divide-x divide-[#111513]/10 bg-[#EEEAE1]">
          {metrics.map((m) => (
            <div
              key={m.name}
              className="p-6 flex flex-col justify-between space-y-8"
            >
              <div className="space-y-3">
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#7A817D] block">
                  {m.category}
                </span>
                <h4 className="font-serif italic font-normal text-xl text-[#111513]">
                  {m.name}
                </h4>
                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  {m.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#111513]/10 space-y-1.5 font-mono">
                <span className="inline-block text-[9px] uppercase px-2 py-0.5 border border-[#D97706]/40 text-[#D97706] bg-[#D97706]/10 font-bold tracking-wider">
                  {m.status}
                </span>
                <p className="text-[11px] text-[#7A817D]">
                  {m.benchmark}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* UN Sustainable Development Goals (SDG 3 & 9) from Deck Slide 9 */}
        <div className="bg-[#EEEAE1] border border-[#111513]/14 p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#111513]/10 pb-4">
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1E6861] font-semibold">
                GLOBAL IMPACT ALIGNMENT
              </span>
              <h3 className="font-serif italic font-normal text-2xl text-[#111513] mt-0.5">
                United Nations Sustainable Development Goals
              </h3>
            </div>
            <span className="font-mono text-xs text-[#7A817D]">
              UN SDG Agenda 2030 &middot; Slide 9 Alignment
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* SDG 3 */}
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-[#4C9F38] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                <span className="font-serif font-bold text-2xl leading-none">3</span>
                <span className="text-[8px] font-mono uppercase tracking-widest">SDG</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-serif italic font-normal text-xl text-[#111513]">
                  Good Health &amp; Well-Being
                </h4>
                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  Aims to reduce avoidable adverse drug events (ADEs), subtherapeutic antibiotic failures,
                  and nephrotoxicity by making individual biological clearance and tail-risk transparent to bedside clinicians.
                </p>
              </div>
            </div>

            {/* SDG 9 */}
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-[#FD6925] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                <span className="font-serif font-bold text-2xl leading-none">9</span>
                <span className="text-[8px] font-mono uppercase tracking-widest">SDG</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-serif italic font-normal text-xl text-[#111513]">
                  Industry, Innovation &amp; Infrastructure
                </h4>
                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  Advances resilient clinical health-tech infrastructure through inspectable, air-gapped,
                  on-premise simulation software that guarantees patient privacy and institutional sovereignty.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
