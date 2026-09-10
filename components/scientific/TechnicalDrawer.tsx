'use client';

import React from 'react';
import { X, BookOpen, Layers, Code, Activity, ShieldAlert } from 'lucide-react';

interface TechnicalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalDrawer: React.FC<TechnicalDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal-900/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-2xl bg-ivory-50 h-full overflow-y-auto shadow-2xl border-l border-ivory-400 p-6 sm:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ivory-300">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-teal" />
            <div>
              <h3 className="font-serif text-xl font-bold text-charcoal-900">
                Under The Model
              </h3>
              <p className="text-xs text-charcoal-500 font-mono">
                Mathematical Foundations, ODE Specifications &amp; Quality Boundaries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ivory-200 text-charcoal-500 hover:text-charcoal-800 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Pharmacokinetic Differential Equations */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-teal font-semibold">
            01 / Pharmacokinetic Differential Equations
          </span>
          <h4 className="font-serif text-base font-semibold text-charcoal-900">
            One-Compartment Open Disposition with First-Order Absorption
          </h4>
          <p className="text-xs text-charcoal-700 leading-relaxed font-sans">
            In standard oral administration, the mass balance governing drug transit from the GI lumen into the central plasma distribution volume V_d is modeled via coupled first-order linear ODEs:
          </p>
          <div className="p-4 rounded-xl bg-charcoal-900 text-ivory-100 font-mono text-xs space-y-2 border border-charcoal-700">
            <div className="text-teal-light">
              dA_gut/dt = -k_a * A_gut(t)
            </div>
            <div className="text-teal-light">
              dC_plasma/dt = (k_a * F * A_gut(t)) / V_d - k_e * C_plasma(t)
            </div>
            <div className="text-charcoal-400 text-[11px] pt-1">
              Analytical integrated form (k_a != k_e):
            </div>
            <div className="text-amber-300 text-[11px]">
              C(t) = [ (Dose * F * k_a) / (V_d * (k_a - k_e)) ] * [ exp(-k_e * t) - exp(-k_a * t) ]
            </div>
          </div>
        </div>

        {/* Section 2: Allometric Covariate Scaling */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-teal font-semibold">
            02 / Allometric Covariate Scaling
          </span>
          <h4 className="font-serif text-base font-semibold text-charcoal-900">
            Patient-Specific Physiological Scaling
          </h4>
          <p className="text-xs text-charcoal-700 leading-relaxed font-sans">
            Individual clearance (CL) is modulated allometrically by total body mass (W^0.75 metabolic scaling), glomerular filtration rate (eGFR), and cytochrome P450 enzyme genotype activity (CYP2D6):
          </p>
          <div className="p-4 rounded-xl bg-charcoal-900 text-ivory-100 font-mono text-xs space-y-2 border border-charcoal-700">
            <div className="text-emerald-400">
              CL = CL_pop * (Weight / 70)^0.75 * (eGFR / 90)^0.85 * f(CYP2D6)
            </div>
            <div className="text-emerald-400">
              V_d = V_pop * (Weight / 70)^1.00
            </div>
            <div className="text-emerald-400">
              k_e = CL / V_d
            </div>
            <div className="text-emerald-400">
              t_half = ln(2) / k_e = 0.693 / k_e
            </div>
          </div>
        </div>

        {/* Section 3: Bayesian Conjugate Inference */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-teal font-semibold">
            03 / Bayesian Conjugate Inference
          </span>
          <h4 className="font-serif text-base font-semibold text-charcoal-900">
            Conditioning on Observed Therapeutic Drug Monitoring (TDM)
          </h4>
          <p className="text-xs text-charcoal-700 leading-relaxed font-sans">
            When observed plasma concentration samples y_obs are acquired, PRIVAVEDA performs Maximum A Posteriori (MAP) conjugate updates, shrinking parameter variance:
          </p>
          <div className="p-4 rounded-xl bg-charcoal-900 text-ivory-100 font-mono text-xs space-y-2 border border-charcoal-700">
            <div className="text-sky-300">
              1 / sigma_post^2 = (1 / sigma_prior^2) + sum( 1 / sigma_obs^2 )
            </div>
            <div className="text-sky-300">
              mu_post = sigma_post^2 * [ (mu_prior / sigma_prior^2) + sum( y_i / sigma_obs^2 ) ]
            </div>
            <div className="text-charcoal-400 text-[11px] pt-1">
              90% Credible Interval: [ mu_post - 1.645 * sigma_post, mu_post + 1.645 * sigma_post ]
            </div>
          </div>
        </div>

        {/* Section 4: Deterministic Evidence Gate & Safety Rules */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-teal font-semibold">
            04 / Deterministic Evidence Gate
          </span>
          <h4 className="font-serif text-base font-semibold text-charcoal-900">
            Explicit Model Abstention Boundaries
          </h4>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              <span className="font-bold font-mono">Renal Failure Abstention:</span> eGFR &lt; 15 mL/min (ESRD) halts simulated outputs and flags required clinical specialist consultation.
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <span className="font-bold font-mono">Specimen Staleness Flag:</span> Labs &gt; 24h old trigger warning; labs &gt; 48h old trigger simulation lock.
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="font-bold font-mono">Deterministic Safety Evaluation:</span> Status is marked &ldquo;Reviewable &middot; Zero Blocks&rdquo; only when all boundaries and input freshness constraints pass.
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-ivory-300 text-xs text-charcoal-500 font-sans">
          <p className="font-mono text-[11px]">
            &ldquo;Explanations support the simulation; they do not choose the dose.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
};
