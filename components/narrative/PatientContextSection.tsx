'use client';

import React, { useState } from 'react';

export const PatientContextSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const contextData = [
    {
      num: '01',
      title: 'Laboratory Telemetry',
      subtitle: 'ORGAN FILTRATION & DEGRADATION',
      items: [
        { name: 'Serum Creatinine', val: '1.82 mg/dL', effect: 'CL_renal reduced by 48%' },
        { name: 'eGFR (CKD-EPI)', val: '38 mL/min', effect: 'Stages renal reserve at CKD 3b' },
        { name: 'Serum Albumin', val: '3.4 g/dL', effect: 'Modulates unbound free fraction f_u' },
      ],
      annotation: 'A reduced filtration rate directly impairs tubular excretion, extending systemic elimination half-life from 6.2h to 20.7h.',
    },
    {
      num: '02',
      title: 'Concomitant Regimens',
      subtitle: 'PHARMACODYNAMIC INTERACTIONS',
      items: [
        { name: 'Lisinopril 20mg QD', val: 'ACE Inhibitor', effect: 'Alters intraglomerular pressure' },
        { name: 'Atorvastatin 40mg', val: 'CYP3A4 Substrate', effect: 'Competes for metabolic pathways' },
        { name: 'Metformin', val: 'Held Pre-procedure', effect: 'Mitigates contrast nephropathy' },
      ],
      annotation: 'Co-administered medications compete for hepatic cytochrome enzymes and renal transporters, shifting apparent distribution volume.',
    },
    {
      num: '03',
      title: 'Patient Characteristics',
      subtitle: 'BIOMETRICS & PHARMACOGENOMICS',
      items: [
        { name: 'Total Body Weight', val: '68 kg', effect: 'Allometric scaling: (68/70)^0.75' },
        { name: 'CYP2D6 Genotype', val: '*1/*4 (Score: 0.5)', effect: 'Intermediate metabolizer rate' },
        { name: 'Chronological Age', val: '64 Years', effect: 'Reduces physiological clearance reserve' },
      ],
      annotation: 'Genetic variation in cytochrome P450 enzymes reduces metabolic breakdown, causing standard population doses to accumulate.',
    },
  ];

  return (
    <section id="patient-context" className="w-full py-24 px-6 sm:px-10 lg:px-16 bg-canvas border-b border-[rgba(17,21,19,0.12)]">
      <div className="max-w-[1440px] mx-auto space-y-16">
        {/* Section Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <span className="text-[10px] font-mono tracking-widest text-muted uppercase block">
              02 / PATIENT CONTEXT
            </span>
            <div className="w-12 h-[1px] bg-ink/20 mt-2 mb-4" />
            <p className="font-mono text-xs text-graphite uppercase tracking-wide">
              Context Shapes Review
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-ink tracking-tight leading-[1.05]">
              The same medicine can require a different conversation.
            </h2>
            <p className="font-sans text-sm sm:text-base text-graphite max-w-2xl leading-relaxed font-normal">
              A standard dose creates widely disparate circulating concentrations across individuals. 
              The clinician must connect changing laboratories, concurrent therapies, and metabolic genetics 
              with model predictions.
            </p>
          </div>
        </div>

        {/* 3 Columns Separated by Crisp Hairlines — No Generic Box Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-[rgba(17,21,19,0.14)] pt-8">
          {contextData.map((col, idx) => (
            <div
              key={col.num}
              className={`p-6 sm:p-8 space-y-6 ${
                idx !== 0 ? 'md:border-l md:border-[rgba(17,21,19,0.14)]' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="text-[10px] font-mono tracking-widest text-teal font-semibold uppercase">
                  &mdash;&mdash; {col.num} / {col.subtitle}
                </div>
                <h3 className="font-serif text-2xl font-normal text-ink">
                  {col.title}
                </h3>
              </div>

              {/* Items List */}
              <div className="space-y-4 pt-2">
                {col.items.map((it, i) => (
                  <div key={i} className="space-y-0.5 border-b border-[rgba(17,21,19,0.08)] pb-3">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-sans text-ink font-medium">{it.name}</span>
                      <span className="font-mono text-graphite font-semibold tabular-nums">{it.val}</span>
                    </div>
                    <p className="text-[11px] font-sans text-muted">
                      {it.effect}
                    </p>
                  </div>
                ))}
              </div>

              {/* Schematic Annotation */}
              <div className="pt-2 text-xs font-sans text-graphite leading-relaxed">
                <p className="text-[11px] text-muted italic">
                  {col.annotation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
