'use client';

import React from 'react';

export const FuturePlatformSection: React.FC = () => {
  const branches = [
    {
      name: 'Vancomycin / Aminoglycosides',
      specialty: 'Infectious Disease & Critical Care',
      status: 'INDEX VALIDATED MODULE',
      desc: 'Narrow therapeutic index antibiotics with high acute kidney injury (AKI) risk and mandatory AUC-guided TDM monitoring.',
      isCore: true,
    },
    {
      name: 'Tacrolimus / Cyclosporine',
      specialty: 'Transplant Nephrology & Immunology',
      status: 'PLANNED EXPANSION',
      desc: 'Allograft rejection prevention requiring strict trough concentration bounds under changing hematocrit and CYP3A5 genotypes.',
      isCore: false,
    },
    {
      name: 'Methotrexate / High-Dose Chemo',
      specialty: 'Medical Oncology & Hematology',
      status: 'FUTURE DIRECTION',
      desc: 'Toxic clearance kinetics coupled with leucovorin rescue protocols and non-linear renal tubular saturation.',
      isCore: false,
    },
    {
      name: 'Biologics & Monoclonals',
      specialty: 'Rheumatology & Autoimmune',
      status: 'RESEARCH HORIZON',
      desc: 'Target-mediated drug disposition (TMDD) and anti-drug antibody clearance mechanisms across multi-week horizons.',
      isCore: false,
    },
  ];

  return (
    <section id="future-platform" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 19 &middot; FUTURE PLATFORM
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                MODULAR EXTENSION
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              One validated use case expanding into a multi-specialty platform.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              Rather than attempting to model thousands of medicines generically, PRIVAVEDA scales
              through rigorous module validation. Each therapeutic class is mathematically parameterized and benchmarked before introduction.
            </p>
          </div>

          <div className="font-mono text-xs text-[#7A817D]">
            DISCRETE VALIDATED CONTAINERS
          </div>
        </div>

        {/* 4 Therapeutic Class Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-t border-b border-[#111513]/10 divide-y md:divide-y-0 md:divide-x divide-[#111513]/10 bg-[#EEEAE1]">
          {branches.map((b) => (
            <div
              key={b.name}
              className="p-6 flex flex-col justify-between space-y-8"
            >
              <div className="space-y-3">
                <span className={`font-mono text-[9px] uppercase px-2 py-0.5 border font-semibold tracking-wider inline-block ${
                  b.isCore
                    ? 'border-[#1E6861]/40 text-[#1E6861] bg-[#1E6861]/10'
                    : 'border-[#7A817D]/30 text-[#7A817D] bg-[#F5F2EB]'
                }`}>
                  {b.status}
                </span>

                <h4 className="font-serif italic font-normal text-xl text-[#111513]">
                  {b.name}
                </h4>

                <span className="font-mono text-[11px] text-[#1E6861] block">
                  {b.specialty}
                </span>

                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  {b.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#111513]/10 font-mono text-[10px] text-[#7A817D] uppercase">
                {b.isCore ? 'Active Demonstration' : 'Roadmap Module'}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
