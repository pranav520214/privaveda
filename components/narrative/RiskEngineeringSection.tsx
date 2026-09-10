'use client';

import React, { useState } from 'react';
import { RISK_MATRIX } from '@/lib/content/privavedaData';
import { AlertCircle, Clock, Shield, Activity, UserCheck, ChevronRight } from 'lucide-react';

const iconMap = {
  AlertCircle,
  Clock,
  Shield,
  Activity,
  UserCheck,
};

export const RiskEngineeringSection: React.FC = () => {
  const [selectedRiskId, setSelectedRiskId] = useState<string>(RISK_MATRIX[0].id);
  const activeRisk = RISK_MATRIX.find((r) => r.id === selectedRiskId) || RISK_MATRIX[0];

  return (
    <section id="risk-engineering" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 15 &middot; RISK ENGINEERING
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                FAILURE MODE &amp; EFFECTS ANALYSIS
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              Engineered responses to concrete failure modes.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              High-stakes medical systems cannot rely on optimistic assumptions.
              Every potential breakdown mode is anticipated with an explicit algorithmic and workflow mitigation.
            </p>
          </div>

          <div className="font-mono text-xs text-[#7A817D]">
            5 CORE VULNERABILITIES &middot; ZERO UNHANDLED STATES
          </div>
        </div>

        {/* Risk Grid & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Risk Selector Column */}
          <div className="lg:col-span-5 bg-[#EEEAE1] border border-[#111513]/12 divide-y divide-[#111513]/10">
            {RISK_MATRIX.map((item) => {
              const isSelected = item.id === selectedRiskId;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedRiskId(item.id)}
                  className={`w-full p-4 text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#111513] text-[#F5F2EB]'
                      : 'text-[#343B38] hover:bg-[#E5E0D5]'
                  }`}
                >
                  <div className="space-y-1">
                    <span className={`font-mono text-[9px] tracking-widest uppercase block ${
                      isSelected ? 'text-[#AFCAC4]' : 'text-[#7A817D]'
                    }`}>
                      {item.id.toUpperCase()}
                    </span>
                    <h4 className="font-serif italic text-base font-normal">
                      {item.risk}
                    </h4>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${
                    isSelected ? 'text-[#AFCAC4] translate-x-1' : 'text-[#7A817D] opacity-40'
                  }`} />
                </button>
              );
            })}
          </div>

          {/* Active Risk Breakdown Card */}
          <div className="lg:col-span-7 bg-[#EEEAE1] border border-[#111513]/14 p-8 space-y-6">
            <div className="border-b border-[#111513]/10 pb-4">
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1E6861] font-semibold block">
                FAILURE MODE SPECIFICATION
              </span>
              <h3 className="font-serif italic font-normal text-2xl text-[#111513] mt-1">
                {activeRisk.risk}
              </h3>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-[#F5F2EB] border-l-2 border-[#991B1B] space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#991B1B] font-bold block">
                  CLINICAL FAILURE MECHANISM
                </span>
                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  {activeRisk.impact}
                </p>
              </div>

              <div className="p-4 bg-[#F5F2EB] border-l-2 border-[#1E6861] space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#1E6861] font-bold block">
                  ARCHITECTURAL SAFEGUARD &amp; MITIGATION
                </span>
                <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                  {activeRisk.mitigation}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#111513]/10 flex items-center justify-between font-mono text-[11px] text-[#7A817D]">
              <span>VERIFICATION: DETERMINISTIC TEST HARNESS</span>
              <span className="text-[#1E6861]">CONTINUOUS INTEGRATION ASSERTION</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
