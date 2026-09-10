'use client';

import React from 'react';

export const TeamVisionSection: React.FC = () => {
  const nextMilestones = [
    { num: '01', title: 'Evaluate One Focused Model', desc: 'Reproduce published pharmacokinetic benchmark datasets with clinical specialist feedback.' },
    { num: '02', title: 'Document Uncertainty & Edge Cases', desc: 'Expose tail-risk vulnerabilities and establish explicit evidence-gate abstention boundaries.' },
    { num: '03', title: 'Hospital Pharmacist Co-Design', desc: 'Refine the review workbench directly alongside practicing bedside clinical pharmacists.' },
    { num: '04', title: 'Expand Through Validated Modules', desc: 'Introduce additional narrow therapeutic index medicines only as empirical validation succeeds.' },
  ];

  return (
    <section id="vision" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
              SCENE 20 &middot; TEAM &amp; VISION
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
            <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
              FOUNDATIONAL PURPOSE
            </span>
          </div>

          <h2 className="font-serif italic font-normal text-4xl sm:text-6xl lg:text-7xl text-[#111513] tracking-tight leading-[1.02]">
            Start with one medicine.<br />Prove it carefully.
          </h2>

          <div className="font-serif italic text-2xl text-[#1E6861] font-light">
            यथा देहः तथा चिकित्सा &mdash; As the body, so the medicine.
          </div>

          <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl mx-auto font-light">
            Our vision is to make patient-specific simulations easier to inspect, calibrate, and understand,
            one validated clinical use case at a time.
          </p>
        </div>

        {/* Project Leadership Card (Faithful to Deck Slide 13 & Slide 1) */}
        <div className="max-w-2xl mx-auto bg-[#EEEAE1] border border-[#111513]/14 p-8 sm:p-10 space-y-6 text-center">
          <div className="w-16 h-16 bg-[#111513] text-[#F5F2EB] flex items-center justify-center font-serif text-2xl mx-auto">
            P
          </div>

          <div className="space-y-1">
            <h3 className="font-serif italic font-normal text-3xl text-[#111513]">
              Pranav Kumar Mishra
            </h3>
            <p className="font-mono text-xs text-[#1E6861] uppercase tracking-wider font-semibold">
              Team Lead / Project Lead
            </p>
            <p className="font-sans text-xs text-[#7A817D]">
              Project Leadership &middot; Software Architecture &middot; Pharmacokinetic Simulation Design
            </p>
          </div>

          <p className="font-sans text-xs text-[#343B38] leading-relaxed max-w-lg mx-auto font-light">
            Leading the computational architecture and simulation engineering for PRIVAVEDA,
            bridging quantitative pharmacology, Bayesian parameter inference, and clinician-facing workstations.
          </p>

          <div className="pt-4 border-t border-[#111513]/10 font-mono text-[10px] text-[#7A817D] uppercase tracking-wider">
            THEME: HEALTHCARE &amp; HEALTHTECH &middot; SYSTEM v2.0
          </div>
        </div>

        {/* Engineering Roadmap Execution Grid */}
        <div className="bg-[#EEEAE1] border border-[#111513]/14 p-8 sm:p-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#111513]/10 pb-4">
            <div>
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1E6861] font-semibold">
                ROADMAP EXECUTION
              </span>
              <h4 className="font-serif italic font-normal text-2xl text-[#111513] mt-0.5">
                Where We Take This Next
              </h4>
            </div>
            <span className="font-mono text-xs text-[#7A817D]">
              Clinical Engineering Priorities
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {nextMilestones.map((m) => (
              <div key={m.num} className="space-y-2">
                <span className="font-mono text-[11px] text-[#1E6861] font-bold block">
                  {m.num}
                </span>
                <h5 className="font-serif italic font-normal text-lg text-[#111513] leading-snug">
                  {m.title}
                </h5>
                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-[#111513]/10 text-center">
            <p className="font-mono text-xs text-[#1E6861] italic">
              &ldquo;Explanations support the simulation; they do not choose the dose.&rdquo;
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
