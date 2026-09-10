'use client';

import React from 'react';

export const DataToModelSection: React.FC = () => {
  const pipeline = [
    {
      step: '01',
      title: 'RAW CLINICAL INPUTS',
      type: 'Structured Telemetry',
      items: ['Creatinine: 1.82 mg/dL', 'eGFR: 38 mL/min', 'CYP2D6: *1/*4 (Score: 0.5)', 'Weight: 68.0 kg'],
      math: 'x_raw = [1.82, 38, 0.5, 68]',
    },
    {
      step: '02',
      title: 'PRE-FLIGHT GATING',
      type: 'Boundary Check & Staleness',
      items: ['Specimen Latency < 24h: PASS', 'Renal Bounds >= 15: PASS', 'Quality Score: 94/100'],
      math: 'q(x) = product_i I(x_i in Omega_safe)',
    },
    {
      step: '03',
      title: 'ALLOMETRIC PARAMETERS',
      type: 'Mechanistic Coefficients',
      items: ['CL = 1.48 L/h', 'V_d = 43.7 L', 'k_a = 1.10 h⁻¹', 'k_e = 0.034 h⁻¹'],
      math: 'theta = { CL, V_d, k_a, k_e }',
    },
    {
      step: '04',
      title: 'STOCHASTIC STATE SPACE',
      type: 'Monte Carlo Parameter Draws',
      items: ['Prior Covariance Sigma_theta', 'N = 80 Empirical Ensembles', 'Credible Trajectory Envelope'],
      math: 'p(C(t) | theta_sample)',
    },
  ];

  return (
    <section id="data-to-model" className="w-full py-28 px-6 sm:px-10 lg:px-16 bg-comp-bg text-[#EEEAE1] border-b border-comp-border">
      <div className="max-w-[1440px] mx-auto space-y-20">
        {/* Dark Computational Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <span className="text-[10px] font-mono tracking-widest text-teal-soft uppercase block">
              05 / COMPUTATIONAL STATE SPACE
            </span>
            <div className="w-12 h-[1px] bg-white/20 mt-2 mb-4" />
            <p className="font-mono text-xs text-muted uppercase tracking-wide">
              Data &rarr; Parameter Transformation
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.05]">
              Entering the computational model space.
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#AFCAC4] max-w-2xl leading-relaxed font-normal">
              Readable clinical numbers dissolve into vectors, probability distributions, 
              and stiff ordinary differential equations. The system transitions from clinical observation 
              into predictive mathematics.
            </p>
          </div>
        </div>

        {/* 4 Architectural Pipeline Stages Separated by Hairlines */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-t border-comp-border pt-10">
          {pipeline.map((p, idx) => (
            <div
              key={p.step}
              className={`p-6 sm:p-8 space-y-6 ${
                idx !== 0 ? 'md:border-l md:border-comp-border' : ''
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-teal-soft uppercase">
                  &mdash;&mdash; STAGE {p.step}
                </span>
                <h3 className="font-mono text-xs font-bold tracking-wider text-white uppercase">
                  {p.title}
                </h3>
                <p className="text-[11px] font-sans text-muted">
                  {p.type}
                </p>
              </div>

              {/* Data Items */}
              <div className="space-y-2 pt-2 border-t border-white/10 font-mono text-xs">
                {p.items.map((it, i) => (
                  <div key={i} className="text-[#AFCAC4] text-[11px] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-teal-soft/60" />
                    <span>{it}</span>
                  </div>
                ))}
              </div>

              {/* Mathematical Formulation */}
              <div className="pt-4 border-t border-white/10 font-mono text-[11px] text-muted">
                <code>{p.math}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
