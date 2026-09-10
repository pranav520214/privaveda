'use client';

import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronRight, Eye, EyeOff } from 'lucide-react';

export const UncertaintySection: React.FC = () => {
  const [showEnvelope, setShowEnvelope] = useState<boolean>(true);
  const [hoveredX, setHoveredX] = useState<number | null>(null);

  // Coordinate math for 24h simulation horizon (0 - 24h, 0 - 3.0 mg/L)
  const width = 720;
  const height = 280;
  const pad = { top: 30, right: 30, bottom: 40, left: 50 };
  const graphW = width - pad.left - pad.right;
  const graphH = height - pad.top - pad.bottom;

  const toX = (t: number) => pad.left + (t / 24) * graphW;
  const toY = (c: number) => pad.top + graphH - (c / 3.0) * graphH;

  // Key sample points for median, P10, and P90 curves
  const timePoints = [0, 0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24];

  // Mathematical PK shape: Oral absorption + clearance
  const getConcentrations = (t: number) => {
    if (t <= 0) return { median: 0, p10: 0, p90: 0 };
    const ka = 1.1;
    const keMedian = 0.085;
    const keP10 = 0.12; // fast clearance
    const keP90 = 0.055; // impaired clearance

    const baseMed = 2.4 * (Math.exp(-keMedian * t) - Math.exp(-ka * t));
    const baseP10 = 1.7 * (Math.exp(-keP10 * t) - Math.exp(-ka * t));
    const baseP90 = 3.3 * (Math.exp(-keP90 * t) - Math.exp(-ka * t));

    return {
      median: Math.max(0, baseMed),
      p10: Math.max(0, baseP10),
      p90: Math.max(0, baseP90),
    };
  };

  const curveData = timePoints.map((t) => ({
    t,
    ...getConcentrations(t),
  }));

  const medianPath = curveData.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${toX(pt.t).toFixed(1)} ${toY(pt.median).toFixed(1)}`,
    ''
  );

  const topPoints = curveData.map((pt) => `${toX(pt.t).toFixed(1)} ${toY(pt.p90).toFixed(1)}`);
  const bottomPoints = [...curveData].reverse().map((pt) => `${toX(pt.t).toFixed(1)} ${toY(pt.p10).toFixed(1)}`);
  const ribbonPath = `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;

  // Toxic ceiling (2.5 mg/L) and Subtherapeutic floor (0.5 mg/L)
  const yToxic = toY(2.5);
  const ySub = toY(0.5);

  return (
    <section id="uncertainty" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header with Quiet Editorial Discipline */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 09 &middot; UNCERTAINTY REPRESENTATION
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                POSTERIOR PREDICTIVE INTERVAL
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              A prediction is a range.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              Conventional software collapses complex biological variance into a single deterministic line.
              In clinical pharmacology, that artificial certainty is hazardous. PRIVAVEDA treats uncertainty
              as a first-class mathematical object.
            </p>
          </div>

          {/* Interactive Industrial Toggle */}
          <div className="shrink-0 flex items-center p-1 bg-[#EEEAE1] border border-[#111513]/14 rounded-none">
            <button
              onClick={() => setShowEnvelope(false)}
              className={`px-4 py-2 text-[11px] font-mono tracking-wider transition-colors uppercase ${
                !showEnvelope
                  ? 'bg-[#111513] text-[#F5F2EB]'
                  : 'text-[#7A817D] hover:text-[#111513]'
              }`}
            >
              Point Estimate Only
            </button>
            <button
              onClick={() => setShowEnvelope(true)}
              className={`px-4 py-2 text-[11px] font-mono tracking-wider transition-colors uppercase ${
                showEnvelope
                  ? 'bg-[#1E6861] text-white'
                  : 'text-[#7A817D] hover:text-[#111513]'
              }`}
            >
              90% Credible Ribbon
            </button>
          </div>
        </div>

        {/* Visual Architectural Coordinate Canvas */}
        <div className="bg-[#EEEAE1] border border-[#111513]/12 p-6 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#7A817D] border-b border-[#111513]/10 pb-4">
            <div className="flex items-center gap-4">
              <span>TARGET: <strong>VANCOMYCIN / 24H HORIZON</strong></span>
              <span>COVARIATES: <strong>eGFR 38 mL/min &middot; CYP2D6 0.5</strong></span>
            </div>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#1E6861]" />
                <span className="text-[#111513]">MEDIAN TRAJECTORY</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-2 bg-[#1E6861]/25 border border-[#1E6861]/40" />
                <span className="text-[#111513]">P10 &ndash; P90 CREDIBLE ENVELOPE</span>
              </span>
            </div>
          </div>

          {/* SVG Graph */}
          <div className="relative w-full aspect-[720/280] bg-[#F5F2EB] border border-[#111513]/10 overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full select-none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const relX = (mouseX / rect.width) * width;
                if (relX >= pad.left && relX <= pad.left + graphW) {
                  const t = ((relX - pad.left) / graphW) * 24;
                  setHoveredX(Number(t.toFixed(1)));
                }
              }}
              onMouseLeave={() => setHoveredX(null)}
            >
              {/* Subtle Hairline Grid */}
              {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((c) => {
                const y = toY(c);
                return (
                  <g key={c}>
                    <line
                      x1={pad.left}
                      y1={y}
                      x2={pad.left + graphW}
                      y2={y}
                      stroke="#111513"
                      strokeOpacity="0.08"
                      strokeDasharray={c === 2.5 || c === 0.5 ? undefined : '2 4'}
                    />
                    <text
                      x={pad.left - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="9"
                      fontFamily="monospace"
                      fill="#7A817D"
                    >
                      {c.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {[0, 4, 8, 12, 16, 20, 24].map((t) => {
                const x = toX(t);
                return (
                  <g key={t}>
                    <line
                      x1={x}
                      y1={pad.top}
                      x2={x}
                      y2={pad.top + graphH}
                      stroke="#111513"
                      strokeOpacity="0.08"
                      strokeDasharray="2 4"
                    />
                    <text
                      x={x}
                      y={pad.top + graphH + 18}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="monospace"
                      fill="#7A817D"
                    >
                      {t}h
                    </text>
                  </g>
                );
              })}

              {/* Toxic Ceiling Line (2.5 mg/L) */}
              <line
                x1={pad.left}
                y1={yToxic}
                x2={pad.left + graphW}
                y2={yToxic}
                stroke="#C2410C"
                strokeWidth="1.25"
                strokeDasharray="4 3"
              />
              <text
                x={pad.left + graphW - 8}
                y={yToxic - 6}
                textAnchor="end"
                fontSize="9"
                fontFamily="monospace"
                fill="#C2410C"
                letterSpacing="0.1em"
              >
                TOXICITY THRESHOLD &middot; 2.5 mg/L
              </text>

              {/* Subtherapeutic Floor Line (0.5 mg/L) */}
              <line
                x1={pad.left}
                y1={ySub}
                x2={pad.left + graphW}
                y2={ySub}
                stroke="#475569"
                strokeWidth="1.25"
                strokeDasharray="4 3"
              />
              <text
                x={pad.left + graphW - 8}
                y={ySub + 14}
                textAnchor="end"
                fontSize="9"
                fontFamily="monospace"
                fill="#64748B"
                letterSpacing="0.1em"
              >
                SUBTHERAPEUTIC BOUND &middot; 0.5 mg/L
              </text>

              {/* Shaded Monte Carlo 90% Uncertainty Envelope */}
              {showEnvelope && (
                <path
                  d={ribbonPath}
                  fill="#1E6861"
                  fillOpacity="0.18"
                />
              )}

              {/* Quantile Contour Lines when envelope is shown */}
              {showEnvelope && (
                <>
                  <path
                    d={curveData.reduce(
                      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${toX(pt.t).toFixed(1)} ${toY(pt.p90).toFixed(1)}`,
                      ''
                    )}
                    fill="none"
                    stroke="#1E6861"
                    strokeWidth="0.75"
                    strokeDasharray="2 2"
                    strokeOpacity="0.6"
                  />
                  <path
                    d={curveData.reduce(
                      (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${toX(pt.t).toFixed(1)} ${toY(pt.p10).toFixed(1)}`,
                      ''
                    )}
                    fill="none"
                    stroke="#1E6861"
                    strokeWidth="0.75"
                    strokeDasharray="2 2"
                    strokeOpacity="0.6"
                  />
                </>
              )}

              {/* Central Median Trajectory */}
              <path
                d={medianPath}
                fill="none"
                stroke={showEnvelope ? '#1E6861' : '#991B1B'}
                strokeWidth="2"
              />

              {/* Visual Breach Annotation */}
              {showEnvelope ? (
                <g>
                  {/* Mark upper P90 crest breaching threshold */}
                  <circle cx={toX(2.8)} cy={toY(2.65)} r="4" fill="#C2410C" />
                  <line
                    x1={toX(2.8)}
                    y1={toY(2.65)}
                    x2={toX(2.8) + 35}
                    y2={toY(2.65) - 25}
                    stroke="#C2410C"
                    strokeWidth="1"
                  />
                  <rect
                    x={toX(2.8) + 40}
                    y={toY(2.65) - 37}
                    width="210"
                    height="24"
                    fill="#F5F2EB"
                    stroke="#C2410C"
                    strokeWidth="1"
                  />
                  <text
                    x={toX(2.8) + 48}
                    y={toY(2.65) - 21}
                    fontSize="9"
                    fontFamily="monospace"
                    fill="#9A3412"
                    letterSpacing="0.05em"
                  >
                    P90 BREACHES TOXIC CEILING (2.65 mg/L)
                  </text>
                </g>
              ) : (
                <g>
                  {/* Point estimate peak misleadingly appears safe */}
                  <circle cx={toX(3.0)} cy={toY(1.92)} r="4" fill="#991B1B" />
                  <rect
                    x={toX(3.0) + 20}
                    y={toY(1.92) - 12}
                    width="235"
                    height="24"
                    fill="#F5F2EB"
                    stroke="#991B1B"
                    strokeWidth="1"
                  />
                  <text
                    x={toX(3.0) + 28}
                    y={toY(1.92) + 4}
                    fontSize="9"
                    fontFamily="monospace"
                    fill="#7F1D1D"
                    letterSpacing="0.05em"
                  >
                    FALSE SAFETY: MEDIAN APPEARS SAFE (1.92 mg/L)
                  </text>
                </g>
              )}

              {/* Interactive Scrubber Needle */}
              {hoveredX !== null && (
                <g>
                  <line
                    x1={toX(hoveredX)}
                    y1={pad.top}
                    x2={toX(hoveredX)}
                    y2={pad.top + graphH}
                    stroke="#111513"
                    strokeWidth="1"
                    strokeDasharray="1 3"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Hover Time Coordinate Readout */}
          {hoveredX !== null && (
            <div className="flex items-center justify-between p-3 bg-[#F5F2EB] border border-[#111513]/10 font-mono text-xs">
              <span className="text-[#7A817D]">INSPECTED COORDINATE: <strong>t = {hoveredX} h</strong></span>
              <span className="text-[#1E6861]">MEDIAN: <strong>{getConcentrations(hoveredX).median.toFixed(2)} mg/L</strong></span>
              <span className="text-[#7A817D]">90% CI: <strong>[{getConcentrations(hoveredX).p10.toFixed(2)} &ndash; {getConcentrations(hoveredX).p90.toFixed(2)} mg/L]</strong></span>
            </div>
          )}
        </div>

        {/* Quiet Editorial Two-Column Comparative Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
          <div className="space-y-4 pr-0 md:pr-8 border-b md:border-b-0 md:border-r border-[#111513]/10 pb-8 md:pb-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#991B1B]" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#991B1B] font-semibold">
                THE HAZARD OF POINT ESTIMATES
              </span>
            </div>
            <h3 className="font-serif italic font-normal text-2xl text-[#111513]">
              The illusion of false security.
            </h3>
            <p className="font-sans text-sm text-[#343B38] leading-relaxed font-light">
              When a software tool displays only a single mean trajectory, a clinician evaluating this case
              might note the peak concentration at 1.92 mg/L&mdash;comfortably below the 2.5 mg/L toxic ceiling.
              The single line conceals that in patient cohorts with reduced allometric clearance or intermediate
              CYP2D6 metabolism, 10% to 20% of cases breach nephrotoxic thresholds.
            </p>
          </div>

          <div className="space-y-4 pl-0 md:pl-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1E6861] font-semibold">
                THE PRIVAVEDA METHOD
              </span>
            </div>
            <h3 className="font-serif italic font-normal text-2xl text-[#111513]">
              Empowering clinical vigilance.
            </h3>
            <p className="font-sans text-sm text-[#343B38] leading-relaxed font-light">
              By presenting Monte Carlo uncertainty as an explicit geometric volume, the clinical pharmacist
              instantly observes the tail-risk exposure. Rather than authorizing a standard once-daily dose,
              they can select an adjusted interval (e.g. 50mg divided BID) and order an empirical serum TDM draw
              at 4 hours to collapse the Bayesian uncertainty envelope before toxicity develops.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
