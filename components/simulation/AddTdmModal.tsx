'use client';

import React, { useState } from 'react';
import { X, Plus, Activity } from 'lucide-react';
import { ObservedTdmPoint } from '@/lib/simulation/pk';

interface AddTdmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPoint: (point: ObservedTdmPoint) => void;
}

export const AddTdmModal: React.FC<AddTdmModalProps> = ({
  isOpen,
  onClose,
  onAddPoint,
}) => {
  const [timeHours, setTimeHours] = useState(3.5);
  const [concentration, setConcentration] = useState(1.75);
  const [notes, setNotes] = useState('Routine TDM sample 4h post morning dose');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPoint({
      id: 'tdm-' + Date.now(),
      timeHours: Number(timeHours),
      concentrationMgL: Number(concentration),
      sampleAgeHours: 1.5,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06100E]/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-[#F5F2EB] border border-[#111513]/20 shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#111513]/10 pb-4">
          <div className="space-y-1">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#7A817D] block">
              EMPIRICAL OBSERVATION ENTRY
            </span>
            <h4 className="font-serif italic text-xl text-[#111513]">
              Record Observed TDM Level
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7A817D] hover:text-[#111513] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-mono">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-[#7A817D] uppercase tracking-wider">
                Sampling Time (Post-Dose):
              </label>
              <span className="font-bold text-[#111513] tabular-nums">{timeHours} h</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="24"
              step="0.5"
              value={timeHours}
              onChange={(e) => setTimeHours(parseFloat(e.target.value))}
              className="w-full accent-[#1E6861] cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-[#7A817D] uppercase tracking-wider">
                Serum Concentration (mg/L):
              </label>
              <span className="font-bold text-[#111513] tabular-nums">{concentration} mg/L</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="15.0"
              step="0.1"
              value={concentration}
              onChange={(e) => setConcentration(parseFloat(e.target.value))}
              className="w-full accent-[#1E6861] cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#7A817D] uppercase tracking-wider block">
              Specimen Verification Notes:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#EEEAE1] border border-[#111513]/14 text-[#111513] font-sans text-xs focus:outline-none"
            />
          </div>

          <div className="p-3.5 bg-[#EEEAE1] border-l-2 border-[#1E6861] space-y-1 text-xs">
            <div className="font-mono text-[10px] tracking-wider uppercase text-[#1E6861] font-semibold">
              BAYESIAN CONDITIONING TRIGGER
            </div>
            <p className="font-sans text-[11px] text-[#343B38] leading-relaxed font-light">
              Submitting this measured serum level updates the prior parameter distribution P(&theta;).
              The ODE solver immediately re-integrates the patient-specific curve with collapsed variance.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#111513]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#111513]/14 text-[#343B38] hover:bg-[#EEEAE1] text-xs font-mono uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1E6861] text-white hover:bg-[#0B332F] text-xs font-mono uppercase tracking-wider transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record &amp; Condition</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
