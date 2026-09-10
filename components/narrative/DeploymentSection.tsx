'use client';

import React from 'react';
import { Server, HardDrive, Lock, FileCheck } from 'lucide-react';

export const DeploymentSection: React.FC = () => {
  const pillars = [
    {
      title: 'Hospital Site License',
      desc: 'Institution-level deployment model pairing localized software instances with dedicated clinical implementation engineering.',
      icon: Server,
    },
    {
      title: 'Local On-Premise Execution',
      desc: 'Runs entirely within the hospital intranet firewall. Zero patient biometric or health information ever leaves the physical perimeter.',
      icon: HardDrive,
    },
    {
      title: 'Pseudonymized Patient Context',
      desc: 'All EHR record identifiers are stripped and replaced with ephemeral session hashes before feeding numerical ODE solvers.',
      icon: Lock,
    },
    {
      title: 'Validated Drug Modules',
      desc: 'Each drug model is deployed as a verified containerized module with predefined analytical and physiological boundary limits.',
      icon: FileCheck,
    },
  ];

  return (
    <section id="deployment" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 18 &middot; DEPLOYMENT &amp; GOVERNANCE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                INSTITUTIONAL SOVEREIGNTY
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              A hospital-centered model with strict local boundaries.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              Healthcare institutions cannot compromise patient confidentiality for external cloud compute.
              PRIVAVEDA operates air-gapped on site, providing auditable clinical simulation within institutional firewalls.
            </p>
          </div>

          <div className="font-mono text-xs text-[#7A817D]">
            LOCAL ON-PREMISE CONTAINER DEPLOYMENT
          </div>
        </div>

        {/* 4 Pillars Grid with 1px Hairlines */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-t border-b border-[#111513]/10 divide-y md:divide-y-0 md:divide-x divide-[#111513]/10 bg-[#EEEAE1]">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#F5F2EB] border border-[#111513]/10 text-[#1E6861]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif italic font-normal text-xl text-[#111513]">
                    {p.title}
                  </h4>
                  <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lifecycle Ribbon */}
        <div className="bg-[#EEEAE1] border border-[#111513]/14 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1E6861] font-semibold">
              INSTITUTIONAL LIFECYCLE
            </span>
            <div className="font-serif italic text-lg text-[#111513]">
              Hospital Site License &rarr; Air-Gapped Integration &rarr; Validated Modules &rarr; Calibration Audit
            </div>
          </div>

          <div className="shrink-0 font-mono text-[11px] text-[#7A817D] border border-[#111513]/14 px-4 py-2 bg-[#F5F2EB]">
            HIPAA &middot; GDPR &middot; ISO 27001 AUDIT READY
          </div>
        </div>

      </div>
    </section>
  );
};
