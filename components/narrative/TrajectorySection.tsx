'use client';

import React, { useState } from 'react';

export const TrajectorySection: React.FC = () => {
  const [scrubTime, setScrubTime] = useState<number>(3.5);

  const dose = 100;
  const Vd = 43.7;
  const ka = 1.1;
  const ke = 0.034;
  const F = 0.85;

  const getConc = (t: number) => {
    return ((dose * F * ka) / (Vd * (ka - ke))) * (Math.exp(-ke * t) - Math.exp(-ka * t));
  };

  const currentConc = getConc(scrubTime);
  const p10 = currentConc * 0.78;
  const p90 = currentConc * 1.24;

  return (
    <section id="trajectory" className="w-full py-24 px-6 sm:px-10 lg:px-16 bg-canvas border-b border-[rgba(17,21,19,0.12)]">
      <div className="max-w-[1440px] mx-auto space-y-16">
        {/* Section Headline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <span className="text-[10px] font-mono tracking-widest text-muted uppercase block">
              07 / EXPOSURE TRAJECTORY
            </span>
            <div className="w-12 h-[1px] bg-ink/20 mt-2 mb-4" />
            <p className="font-mono text-xs text-graphite uppercase tracking-wide">
              Concentration Timeline
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-ink tracking-tight leading-[1.05]">
              The curve is a temporal continuum.
            </h2>
            <p className="font-sans text-sm sm:text-base text-graphite max-w-2xl leading-relaxed font-normal">
              Continuous ordinary differential equations map the journey from intake to clearance. 
              The ribbon surrounding the central median estimate represents the 90% credible envelope.
            </p>
          </div>
        </div>

        {/* Industrial Coordinate Inspector */}
        <div className="p-8 sm:p-12 border border-[rgba(17,21,19,0.14)] bg-[#F0ECE3] space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[rgba(17,21,19,0.12)]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                TEMPORAL INSPECTOR &middot; T = {scrubTime.toFixed(1)}h POST-ADMINISTRATION
              </span>
              <div className="font-serif text-3xl font-normal text-ink mt-1">
                {currentConc.toFixed(2)} mg/L <span className="text-base text-graphite font-sans font-light">(Median)</span>
              </div>
            </div>

            <div className="font-mono text-xs text-graphite flex items-center gap-6">
              <span>90% INTERVAL: <strong className="text-ink font-semibold">[{p10.toFixed(2)} &ndash; {p90.toFixed(2)} mg/L]</strong></span>
              <span>STATE: <strong className="text-teal font-semibold">{scrubTime < 3.5 ? 'ABSORPTION' : 'ELIMINATION'}</strong></span>
            </div>
          </div>

          {/* Precision Slider */}
          <div className="space-y-3">
            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={scrubTime}
              onChange={(e) => setScrubTime(parseFloat(e.target.value))}
              className="w-full accent-teal h-1.5 bg-paper rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted tracking-wider">
              <span>0.0h (DOSE)</span>
              <span>3.5h (PEAK C_MAX)</span>
              <span>12.0h (MID-INTERVAL)</span>
              <span>24.0h (TROUGH C_MIN)</span>
            </div>
          </div>

          {/* Three Industrial Telemetry Markers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[rgba(17,21,19,0.10)] text-xs">
            <div>
              <span className="text-[10px] font-mono text-muted uppercase block">THERAPEUTIC COMPLIANCE</span>
              <span className="font-mono text-ink font-semibold">Within Window (0.5 &ndash; 2.5 mg/L)</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-muted uppercase block">SAMPLING RELEVANCE</span>
              <span className="font-mono text-ink font-semibold">
                {scrubTime >= 3.0 && scrubTime <= 4.5 ? 'Optimal Peak TDM Draw Window' : (scrubTime >= 22.0 ? 'Optimal Trough Draw Window' : 'Equilibration Interval')}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-muted uppercase block">ELIMINATION CLEARANCE</span>
              <span className="font-mono text-ink font-semibold">1.48 L/h (Allometric Adjusted)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
