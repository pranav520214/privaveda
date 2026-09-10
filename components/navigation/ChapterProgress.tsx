'use client';

import React, { useEffect, useState } from 'react';

const chapters = [
  { id: 'hero', label: 'Twin' },
  { id: 'patient-context', label: 'Context' },
  { id: 'biology', label: 'Biology' },
  { id: 'pk-model', label: 'Model' },
  { id: 'bayesian', label: 'Bayesian' },
  { id: 'uncertainty', label: 'Uncertainty' },
  { id: 'evidence-gate', label: 'Evidence' },
  { id: 'workbench', label: 'Workbench' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'validation', label: 'Validation' },
  { id: 'vision', label: 'Vision' },
];

export const ChapterProgress: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 240;
      for (const ch of chapters) {
        const el = document.getElementById(ch.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveId(ch.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-2 pointer-events-auto">
      <div className="p-2 rounded-2xl bg-white/80 backdrop-blur-md border border-ivory-400 shadow-md space-y-1.5 text-right">
        {chapters.map((ch, idx) => {
          const isActive = activeId === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => scrollTo(ch.id)}
              className="group flex items-center gap-2 text-right transition-all"
            >
              <span
                className={`text-[10px] font-mono transition-opacity ${
                  isActive
                    ? 'opacity-100 font-bold text-teal-dark'
                    : 'opacity-0 group-hover:opacity-100 text-charcoal-500'
                }`}
              >
                {ch.label}
              </span>
              <span
                className={`rounded-full transition-all ${
                  isActive
                    ? 'w-2.5 h-2.5 bg-teal ring-2 ring-teal/30'
                    : 'w-1.5 h-1.5 bg-charcoal-300 group-hover:bg-charcoal-500'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
