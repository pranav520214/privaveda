'use client';

import React from 'react';
import { TARGET_USERS } from '@/lib/content/privavedaData';

export const TargetUsersSection: React.FC = () => {
  const workflowSteps = [
    { num: '01', title: 'New Clinical Input', desc: 'Labs, concomitant medications, and measured TDM serum draws arrive.' },
    { num: '02', title: 'Updated Simulation', desc: 'ODE solvers compute patient trajectory with contracted Bayesian uncertainty.' },
    { num: '03', title: 'Scenario Review', desc: 'Clinician compares alternative exposure curves (e.g. QD vs BID divided regimens).' },
    { num: '04', title: 'Recorded Decision', desc: 'Clinician orders regimen in hospital EHR; immutable cryptographic audit logged.' },
  ];

  return (
    <section id="target-users" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 16 &middot; TARGET USERS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                CLINICAL SPECIALIST WORKFLOWS
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              Designed for the clinicians who review complex dosing.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              PRIVAVEDA avoids stock headshots and generic personas. The interface is engineered
              specifically for the cognitive and regulatory workflows of clinical pharmacy, nephrology, and hospital governance.
            </p>
          </div>

          <div className="font-mono text-xs text-[#7A817D]">
            NON-AUTONOMOUS &middot; DECISION-SUPPORT WORKSTATION
          </div>
        </div>

        {/* 3 Workstation Columns separated by 1px Hairlines */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-b border-[#111513]/10 divide-y md:divide-y-0 md:divide-x divide-[#111513]/10 bg-[#EEEAE1]">
          {TARGET_USERS.map((user, idx) => (
            <div
              key={user.title}
              className="p-8 flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest text-[#7A817D] uppercase font-bold">
                    WORKSTATION 0{idx + 1}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#1E6861] px-2 py-0.5 bg-[#1E6861]/10">
                    {user.focus}
                  </span>
                </div>

                <h3 className="font-serif italic font-normal text-2xl text-[#111513]">
                  {user.title}
                </h3>

                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  {user.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#111513]/10 font-mono text-[11px] text-[#1E6861]">
                &rarr; {user.roleBenefit}
              </div>
            </div>
          ))}
        </div>

        {/* 4-Stage Clinical Action Loop (Slide 8 from presentation) */}
        <div className="bg-[#EEEAE1] border border-[#111513]/14 p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#111513]/10 pb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#7A817D]">
              CONTINUOUS CLINICAL DECISION LOOP
            </span>
            <span className="font-mono text-xs text-[#1E6861]">
              INTEGRATED WORKFLOW
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step) => (
              <div key={step.num} className="space-y-2">
                <span className="font-mono text-[10px] text-[#1E6861] font-bold block">
                  STAGE {step.num}
                </span>
                <h5 className="font-serif italic font-normal text-lg text-[#111513]">
                  {step.title}
                </h5>
                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
