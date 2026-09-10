'use client';

import React, { useState } from 'react';
import { Menu, X, Terminal } from 'lucide-react';

interface HeaderProps {
  onOpenTechnicalDrawer: () => void;
  onScrollToSection: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTechnicalDrawer,
  onScrollToSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'hero', label: '01 / SYSTEM' },
    { id: 'biology', label: '02 / BIOLOGY' },
    { id: 'pk-model', label: '03 / MODEL' },
    { id: 'bayesian', label: '04 / INFERENCE' },
    { id: 'workbench', label: '05 / WORKBENCH' },
    { id: 'architecture', label: '06 / ARCHITECTURE' },
    { id: 'validation', label: '07 / ROADMAP' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F5F2EB]/95 backdrop-blur-sm border-b border-[rgba(17,21,19,0.12)]">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 h-14 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-baseline gap-4">
          <button
            onClick={() => onScrollToSection('hero')}
            className="flex items-baseline gap-3 text-left group"
          >
            <span className="font-serif text-xl tracking-[0.04em] font-medium text-ink group-hover:text-teal transition-colors">
              PRIVAVEDA
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] tracking-widest text-muted uppercase">
              यथा देहः तथा चिकित्सा
            </span>
          </button>
        </div>

        {/* Center/Right: Quiet Industrial Monospace Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onScrollToSection(link.id)}
              className="text-[11px] font-mono tracking-widest text-graphite hover:text-ink transition-colors uppercase"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right: Technical Drawer Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenTechnicalDrawer}
            className="flex items-center gap-1.5 px-3 py-1 rounded border border-ink/20 text-ink hover:border-ink/60 text-[10px] font-mono tracking-widest uppercase transition-all bg-paper/60"
            title="Inspect ODE equations, derivations and parameter matrix"
          >
            <Terminal className="w-3 h-3 text-teal" />
            <span className="hidden sm:inline">Under The Model</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-ink hover:text-teal"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-ink/10 bg-canvas px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onScrollToSection(link.id);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-xs font-mono tracking-widest text-graphite hover:text-ink uppercase"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-ink/10 flex items-center justify-between text-[10px] font-mono text-muted tracking-wider">
            <span>OFFLINE &middot; PSEUDONYMIZED</span>
            <span>AUDIT ACTIVE</span>
          </div>
        </div>
      )}
    </header>
  );
};
