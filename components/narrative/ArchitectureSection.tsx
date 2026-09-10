'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Layers, ArrowRight } from 'lucide-react';
import { WebGLFallback } from '@/three/canvas/WebGLFallback';
import { SYSTEM_LAYERS } from '@/lib/content/privavedaData';

const MainCanvas = dynamic(
  () => import('@/three/canvas/MainCanvas').then((mod) => mod.MainCanvas),
  { ssr: false, loading: () => <WebGLFallback /> }
);
const ArchitectureStackScene = dynamic(
  () => import('@/three/scenes/ArchitectureStackScene').then((mod) => mod.ArchitectureStackScene),
  { ssr: false }
);

export const ArchitectureSection: React.FC = () => {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(0);
  const activeLayer = SYSTEM_LAYERS[selectedLayerIndex] || SYSTEM_LAYERS[0];

  return (
    <section id="architecture" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 13 &middot; SYSTEM ARCHITECTURE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                DECOUPLED VERIFICATION STACK
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              Nine decoupled architectural tiers.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              Monolithic algorithms conceal points of failure. PRIVAVEDA is engineered as nine discrete,
              auditable layers&mdash;from biological patient covariates to immutable cryptographic sign-off.
            </p>
          </div>

          <div className="font-mono text-xs text-[#7A817D]">
            INTERACTION: <strong>SELECT LAYER TO ISOLATE WAFER</strong>
          </div>
        </div>

        {/* 3D Exploded Stack & Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* 3D Canvas Column */}
          <div className="lg:col-span-6 bg-[#06100E] border border-[#111513]/20 relative min-h-[500px] flex flex-col justify-between p-6">
            <div className="flex items-center justify-between text-xs font-mono text-[#AFCAC4]/80 z-10 border-b border-white/10 pb-3">
              <span className="tracking-widest uppercase text-[10px]">EXPLODED MOVEMENT &middot; 9 LAYERS</span>
              <span className="text-[10px] text-[#7A817D]">ORBIT TO INSPECT</span>
            </div>

            <div className="absolute inset-0 pointer-events-none">
              <MainCanvas cameraPosition={[0, 0, 4.6]}>
                <ArchitectureStackScene
                  selectedLayerIndex={selectedLayerIndex}
                  onSelectLayer={(idx) => setSelectedLayerIndex(idx)}
                />
              </MainCanvas>
            </div>

            <div className="z-10 bg-[#06100E]/90 border border-white/10 p-3 flex items-center justify-between font-mono text-xs text-[#AFCAC4]">
              <span className="text-[#7A817D]">ACTIVE WAFER</span>
              <span className="text-white font-semibold">{activeLayer.name}</span>
            </div>
          </div>

          {/* Right Column: Layer Inspector & Vertical Ledger */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            
            {/* Active Highlight Card */}
            <div className="bg-[#EEEAE1] border border-[#1E6861] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#1E6861] font-semibold">
                  TIER 0{activeLayer.id} / 09 &middot; ARCHITECTURE
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#1E6861]/10 text-[#1E6861] uppercase">
                  {activeLayer.subtitle}
                </span>
              </div>
              <h4 className="font-serif italic font-normal text-2xl text-[#111513]">
                {activeLayer.name}
              </h4>
              <p className="font-sans text-xs text-[#343B38] leading-relaxed font-light">
                {activeLayer.desc}
              </p>
            </div>

            {/* Quick Select Ledger */}
            <div className="bg-[#EEEAE1] border border-[#111513]/12 divide-y divide-[#111513]/10">
              {SYSTEM_LAYERS.map((layer, idx) => {
                const isSelected = selectedLayerIndex === idx;
                return (
                  <button
                    key={layer.id}
                    onClick={() => setSelectedLayerIndex(idx)}
                    className={`w-full p-3 text-left flex items-center justify-between font-mono text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#111513] text-[#F5F2EB]'
                        : 'text-[#343B38] hover:bg-[#E5E0D5]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] tabular-nums ${isSelected ? 'text-[#AFCAC4]' : 'text-[#7A817D]'}`}>
                        0{layer.id}
                      </span>
                      <span className="font-sans text-xs font-normal">
                        {layer.name}
                      </span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-[#AFCAC4] translate-x-1' : 'text-[#7A817D] opacity-40'}`} />
                  </button>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
