import React from 'react';
import { Activity } from 'lucide-react';

interface WebGLFallbackProps {
  sceneType?: string;
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = () => {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-gradient-to-b from-ivory-100 to-ivory-200 text-charcoal-800 rounded-2xl border border-ivory-400">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-teal/20 animate-ping opacity-25" />
        <div className="absolute inset-4 rounded-full border border-teal/40 animate-pulse" />
        <div className="w-24 h-24 rounded-full bg-teal/10 flex items-center justify-center text-teal-dark border border-teal/30">
          <Activity className="w-10 h-10 animate-pulse" />
        </div>
      </div>
      <div className="mt-4 text-center max-w-sm">
        <span className="text-xs font-mono tracking-widest text-teal-dark uppercase bg-teal/10 px-2 py-0.5 rounded">
          Scientific Vector View
        </span>
        <h4 className="font-serif text-lg font-medium text-charcoal-900 mt-2">
          Mechanistic Simulation Stream
        </h4>
        <p className="text-xs text-charcoal-600 mt-1">
          Deterministic ODE trajectory & Bayesian inference running in standard 2D vector mode.
        </p>
      </div>
    </div>
  );
};
