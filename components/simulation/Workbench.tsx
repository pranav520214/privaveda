'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Activity,
  Sliders,
  Plus,
  RotateCcw,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronDown
} from 'lucide-react';
import { PATIENT_CASES, PatientCase } from '@/lib/content/privavedaData';
import {
  runSimulation,
  RegimenParameters,
  ObservedTdmPoint,
  SimulationResult
} from '@/lib/simulation/pk';
import { evaluateEvidenceGate, GateEvaluationResult } from '@/lib/simulation/evidenceGate';
import { AddTdmModal } from './AddTdmModal';

export const Workbench: React.FC = () => {
  // Active Case selection
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case-1');
  const activeCase: PatientCase = useMemo(() => {
    return PATIENT_CASES.find((c) => c.id === selectedCaseId) || PATIENT_CASES[0];
  }, [selectedCaseId]);

  // Regimen State
  const [doseMg, setDoseMg] = useState<number>(activeCase.defaultDoseMg);
  const [route, setRoute] = useState<'Oral' | 'IV_Bolus'>(activeCase.defaultRoute);
  const [architecture, setArchitecture] = useState<'1-Compartment' | '2-Compartment'>('1-Compartment');
  const [fidelity, setFidelity] = useState<'QUICK' | 'STANDARD' | 'RESEARCH'>('STANDARD');
  const [overlayScenarioB, setOverlayScenarioB] = useState<boolean>(false);

  // Observed TDM Data Points
  const [observedPoints, setObservedPoints] = useState<ObservedTdmPoint[]>([
    { id: 'obs-1', timeHours: 3.5, concentrationMgL: 1.85, sampleAgeHours: 3.5, notes: 'Peak serum draw' },
    { id: 'obs-2', timeHours: 10.0, concentrationMgL: 0.92, sampleAgeHours: 10.0, notes: 'Mid-interval clearance' },
  ]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Hover Time Scrubber
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);

  // Run Primary Simulation
  const regimen: RegimenParameters = useMemo(() => ({
    doseMg,
    route,
    intervalHours: 24,
    numDoses: 1,
    modelArchitecture: architecture,
  }), [doseMg, route, architecture]);

  const patientCovariates = useMemo(() => ({
    weightKg: activeCase.weightKg,
    eGFR: activeCase.eGFR,
    cyp2d6Score: activeCase.cyp2d6Score,
    age: activeCase.age,
    isMale: activeCase.isMale,
  }), [activeCase]);

  const simResult: SimulationResult = useMemo(() => {
    return runSimulation(patientCovariates, regimen, observedPoints, fidelity);
  }, [patientCovariates, regimen, observedPoints, fidelity]);

  // Run Secondary Scenario B Simulation (e.g. Divided Dose 50% BID)
  const simResultScenarioB: SimulationResult = useMemo(() => {
    const regB: RegimenParameters = {
      ...regimen,
      doseMg: Math.round(doseMg * 0.5),
    };
    return runSimulation(patientCovariates, regB, observedPoints, fidelity);
  }, [patientCovariates, regimen, doseMg, observedPoints, fidelity]);

  // Evaluate Evidence Gate
  const gateResult: GateEvaluationResult = useMemo(() => {
    return evaluateEvidenceGate(
      activeCase.eGFR,
      doseMg,
      activeCase.sampleAgeHours,
      observedPoints.length,
      activeCase.cyp2d6Score
    );
  }, [activeCase, doseMg, observedPoints.length]);

  // Handle Case Change
  const handleCaseSelect = (caseId: string) => {
    const c = PATIENT_CASES.find((item) => item.id === caseId);
    if (c) {
      setSelectedCaseId(c.id);
      setDoseMg(c.defaultDoseMg);
      setRoute(c.defaultRoute);
    }
  };

  const handleAddPoint = (newPoint: ObservedTdmPoint) => {
    setObservedPoints((prev) => [...prev, newPoint]);
  };

  const handleResetPoints = () => {
    setObservedPoints([]);
  };

  // Find hovered trajectory details
  const hoveredPoint = useMemo(() => {
    if (hoveredTime === null) return null;
    return (
      simResult.timeline.find((pt) => Math.abs(pt.timeHours - hoveredTime) < 0.25) ||
      simResult.timeline[0]
    );
  }, [hoveredTime, simResult]);

  // SVG Chart Geometry
  const chartWidth = 640;
  const chartHeight = 260;
  const padding = { top: 25, right: 30, bottom: 40, left: 45 };
  const graphW = chartWidth - padding.left - padding.right;
  const graphH = chartHeight - padding.top - padding.bottom;

  const maxC = 3.0; // mg/L ceiling
  const maxT = 24.0; // Hours horizon

  const scaleX = React.useCallback(
    (t: number) => padding.left + (t / maxT) * graphW,
    [graphW, padding.left, maxT]
  );
  const scaleY = React.useCallback(
    (c: number) => padding.top + graphH - (Math.min(c, maxC) / maxC) * graphH,
    [graphH, padding.top, maxC]
  );

  // Generate SVG path for median and uncertainty band
  const medianPath = useMemo(() => {
    return simResult.timeline.reduce((acc, pt, i) => {
      const x = scaleX(pt.timeHours);
      const y = scaleY(pt.concentrationMedian);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [simResult, scaleX, scaleY]);

  const uncertaintyBandPath = useMemo(() => {
    const topPoints = simResult.timeline.map((pt) => `${scaleX(pt.timeHours)} ${scaleY(pt.concentrationP90)}`);
    const bottomPoints = [...simResult.timeline]
      .reverse()
      .map((pt) => `${scaleX(pt.timeHours)} ${scaleY(pt.concentrationP10)}`);
    return `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
  }, [simResult, scaleX, scaleY]);

  const scenarioBPath = useMemo(() => {
    return simResultScenarioB.timeline.reduce((acc, pt, i) => {
      const x = scaleX(pt.timeHours);
      const y = scaleY(pt.concentrationMedian);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [simResultScenarioB, scaleX, scaleY]);

  return (
    <section id="workbench" className="relative w-full py-32 px-6 lg:px-12 bg-[#F5F2EB] text-[#111513] border-t border-[#111513]/10">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-[#111513]/10">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#7A817D]">
                SCENE 11 &middot; INTERACTIVE DEMONSTRATION
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6861]" />
              <span className="font-mono text-[10px] tracking-widest text-[#1E6861] uppercase">
                MECHANISTIC SIMULATION WORKBENCH
              </span>
            </div>
            
            <h2 className="font-serif italic font-normal text-4xl sm:text-5xl lg:text-6xl text-[#111513] leading-[1.05] tracking-tight">
              Clinical simulation workbench.
            </h2>
            
            <p className="font-sans text-base text-[#343B38] leading-relaxed max-w-2xl font-light">
              Direct implementation of the working clinical console architecture.
              Couples ODE solvers with Monte Carlo parameter variance and empirical TDM Bayesian conditioning.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1E6861] text-white hover:bg-[#0B332F] text-xs font-mono tracking-wider uppercase transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Observed TDM</span>
            </button>
            <button
              onClick={() => alert('Synthetic Export: Simulation report compiled with audit hash: ' + gateResult.auditHash)}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#111513]/14 bg-[#EEEAE1] hover:bg-[#E5E0D5] text-[#111513] text-xs font-mono tracking-wider uppercase transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#7A817D]" />
              <span>Export Audit</span>
            </button>
          </div>
        </div>

        {/* Console Container (Faithful to prototype image1.jpeg with high-end editorial craft) */}
        <div className="bg-[#EEEAE1] border border-[#111513]/14 overflow-hidden">
          
          {/* Top Industrial Telemetry Bar */}
          <div className="px-6 py-3 bg-[#111513] text-[#F5F2EB] flex flex-wrap items-center justify-between gap-4 text-xs font-mono border-b border-white/10">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#1E6861]/25 text-[#AFCAC4] border border-[#1E6861]/40 text-[10px] tracking-widest uppercase font-semibold">
                <ShieldCheck className="w-3 h-3 text-[#AFCAC4]" />
                <span>SAFE DEMO MODE &middot; SYNTHETIC</span>
              </div>
              <span className="text-white/20">|</span>
              <span className="text-[#7A817D]">NETWORK: <strong className="text-white">AIR-GAPPED</strong></span>
              <span className="text-[#7A817D]">IDENTITY: <strong className="text-white">PSEUDONYMIZED</strong></span>
              <span className="text-[#7A817D]">PROVENANCE: <strong className="text-[#AFCAC4]">AUDITED</strong></span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[11px] text-[#7A817D]">
                SOLVER: <strong className="text-[#AFCAC4]">SciPy solve_ivp</strong>
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] tracking-wider uppercase font-bold">
                ONLINE
              </span>
            </div>
          </div>

          {/* Active Case Selector Ribbon */}
          <div className="px-6 py-3 bg-[#E5E0D5]/70 border-b border-[#111513]/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#7A817D]">
                PATIENT RECORD:
              </label>
              <div className="relative">
                <select
                  value={selectedCaseId}
                  onChange={(e) => handleCaseSelect(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1 bg-[#F5F2EB] border border-[#111513]/14 text-[#111513] text-xs font-mono focus:outline-none cursor-pointer"
                >
                  {PATIENT_CASES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#7A817D] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono text-[#7A817D]">
              <span>Weight: <strong className="text-[#111513]">{activeCase.weightKg} kg</strong></span>
              <span>eGFR: <strong className="text-[#111513]">{activeCase.eGFR} mL/min</strong></span>
              <span>CYP2D6: <strong className="text-[#111513]">{activeCase.cyp2d6Status}</strong></span>
            </div>
          </div>

          {/* Main 3-Column Studio Layout */}
          <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#F5F2EB]">
            
            {/* Column 1: TARGET CASE (Left, 3 cols) */}
            <div className="lg:col-span-3 bg-[#EEEAE1] border border-[#111513]/12 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="border-b border-[#111513]/10 pb-3">
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#7A817D] block">
                    TARGET CASE CONTEXT
                  </span>
                  <div className="font-mono text-sm font-bold text-[#111513] mt-0.5">
                    {activeCase.id}
                  </div>
                  <p className="font-sans text-xs text-[#343B38] mt-1 font-light">
                    {activeCase.condition}
                  </p>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#7A817D]">Patient Age:</span>
                    <span className="font-medium text-[#111513]">{activeCase.age} yrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A817D]">Weight:</span>
                    <span className="font-medium text-[#111513]">{activeCase.weightKg} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A817D]">Renal (eGFR):</span>
                    <span className="font-medium text-[#111513]">{activeCase.eGFR} mL/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A817D]">CYP2D6 Activity:</span>
                    <span className="font-medium text-[#111513]">{activeCase.cyp2d6Score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7A817D]">Allometric ODE:</span>
                    <span className="font-medium text-[#1E6861]">CL &prop; W^0.75</span>
                  </div>
                </div>

                {/* Concomitant Regimens */}
                <div className="pt-3 border-t border-[#111513]/10 space-y-1.5">
                  <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#7A817D] block">
                    CONCOMITANT REGIMENS
                  </span>
                  <div className="space-y-1">
                    {activeCase.concomitantMeds.map((med, i) => (
                      <div key={i} className="text-[11px] font-mono text-[#343B38] bg-[#F5F2EB] px-2 py-1 border border-[#111513]/10">
                        &bull; {med}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deterministic Pre-Flight Badge */}
              <div className="pt-4 border-t border-[#111513]/10 space-y-2">
                <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-[#7A817D] block">
                  DETERMINISTIC EVALUATION
                </span>
                {gateResult.overallStatus === 'REVIEWABLE_ZERO_BLOCKS' ? (
                  <div className="p-2.5 bg-[#F5F2EB] border border-[#1E6861]/30 flex items-center gap-2 text-xs font-mono text-[#1E6861]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Reviewable &middot; Zero Blocks</span>
                  </div>
                ) : gateResult.overallStatus === 'CAUTION_FLAGS_PRESENT' ? (
                  <div className="p-2.5 bg-[#F5F2EB] border border-[#D97706]/30 flex items-center gap-2 text-xs font-mono text-[#D97706]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Caution Flags &middot; Inspect Curve</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#F5F2EB] border border-[#991B1B]/30 flex items-center gap-2 text-xs font-mono text-[#991B1B]">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Simulation Abstained</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: PLASMA EXPOSURE TRAJECTORY (Center, 6 cols) */}
            <div className="lg:col-span-6 bg-[#EEEAE1] border border-[#111513]/12 p-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-[#111513]/10 pb-3">
                  <div>
                    <h4 className="font-serif italic text-lg text-[#111513]">
                      Plasma Drug Concentration Trajectory
                    </h4>
                    <p className="text-xs text-[#7A817D] font-mono mt-0.5">
                      Predicted concentration vs time (24h horizon)
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#343B38]">
                    <input
                      type="checkbox"
                      checked={overlayScenarioB}
                      onChange={(e) => setOverlayScenarioB(e.target.checked)}
                      className="accent-[#1E6861] cursor-pointer"
                    />
                    <span>Overlay Scenario B (Divided)</span>
                  </label>
                </div>

                {/* SVG Graph Canvas */}
                <div className="relative mt-6 w-full aspect-[640/260] bg-[#F5F2EB] border border-[#111513]/10 overflow-hidden">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-full select-none"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const mouseX = e.clientX - rect.left;
                      const relX = (mouseX / rect.width) * chartWidth;
                      if (relX >= padding.left && relX <= padding.left + graphW) {
                        const t = ((relX - padding.left) / graphW) * maxT;
                        setHoveredTime(Number(t.toFixed(1)));
                      }
                    }}
                    onMouseLeave={() => setHoveredTime(null)}
                  >
                    {/* Horizontal Concentration Grid lines */}
                    {[0, 1.0, 2.0, 3.0].map((c) => {
                      const y = scaleY(c);
                      return (
                        <g key={c}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={padding.left + graphW}
                            y2={y}
                            stroke="#111513"
                            strokeOpacity="0.08"
                            strokeDasharray={c === 0 ? undefined : '2 3'}
                          />
                          <text
                            x={padding.left - 8}
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

                    {/* Vertical Time Grid lines */}
                    {[0, 6, 12, 18, 24].map((t) => {
                      const x = scaleX(t);
                      return (
                        <g key={t}>
                          <line
                            x1={x}
                            y1={padding.top}
                            x2={x}
                            y2={padding.top + graphH}
                            stroke="#111513"
                            strokeOpacity="0.08"
                            strokeDasharray="2 3"
                          />
                          <text
                            x={x}
                            y={padding.top + graphH + 16}
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

                    {/* Shaded Monte Carlo 90% Uncertainty Band */}
                    <path
                      d={uncertaintyBandPath}
                      fill="#1E6861"
                      fillOpacity="0.18"
                    />

                    {/* Secondary Scenario B (Dashed Amber line) */}
                    {overlayScenarioB && (
                      <path
                        d={scenarioBPath}
                        fill="none"
                        stroke="#D97706"
                        strokeWidth="1.75"
                        strokeDasharray="4 3"
                      />
                    )}

                    {/* Primary Median Trajectory Curve (Mineral Teal line) */}
                    <path
                      d={medianPath}
                      fill="none"
                      stroke="#1E6861"
                      strokeWidth="2"
                    />

                    {/* Observed TDM markers (Red Dots with Whisker bounds) */}
                    {observedPoints.map((obs) => {
                      const cx = scaleX(obs.timeHours);
                      const cy = scaleY(obs.concentrationMgL);
                      return (
                        <g key={obs.id}>
                          {/* Whisker bounds */}
                          <line
                            x1={cx}
                            y1={cy - 7}
                            x2={cx}
                            y2={cy + 7}
                            stroke="#991B1B"
                            strokeWidth="1.25"
                          />
                          <line
                            x1={cx - 3}
                            y1={cy - 7}
                            x2={cx + 3}
                            y2={cy - 7}
                            stroke="#991B1B"
                            strokeWidth="1"
                          />
                          <line
                            x1={cx - 3}
                            y1={cy + 7}
                            x2={cx + 3}
                            y2={cy + 7}
                            stroke="#991B1B"
                            strokeWidth="1"
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r="4"
                            fill="#991B1B"
                            stroke="#F5F2EB"
                            strokeWidth="1.25"
                          />
                        </g>
                      );
                    })}

                    {/* Interactive Scrubber Needle */}
                    {hoveredTime !== null && (
                      <line
                        x1={scaleX(hoveredTime)}
                        y1={padding.top}
                        x2={scaleX(hoveredTime)}
                        y2={padding.top + graphH}
                        stroke="#111513"
                        strokeWidth="1"
                        strokeDasharray="1 3"
                      />
                    )}
                  </svg>

                  {/* Scrubber Tooltip */}
                  {hoveredPoint && (
                    <div className="absolute top-2 right-2 p-2 bg-[#111513] text-[#F5F2EB] text-[10px] font-mono border border-white/10 pointer-events-none">
                      <div>t = {hoveredPoint.timeHours} h</div>
                      <div className="text-[#AFCAC4]">
                        Median: {hoveredPoint.concentrationMedian} mg/L
                      </div>
                      <div className="text-[#7A817D]">
                        90% CI: [{hoveredPoint.concentrationP10} &ndash; {hoveredPoint.concentrationP90}]
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Metrics Row (C_MAX, T_MAX, AUC_0-24, HALF-LIFE) */}
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-[#111513]/10 text-center font-mono">
                <div className="p-3 bg-[#F5F2EB] border border-[#111513]/10">
                  <span className="text-[9px] text-[#7A817D] uppercase tracking-wider block">C_MAX</span>
                  <span className="font-medium text-[#111513] text-sm tabular-nums">
                    {simResult.cMax} <span className="text-[10px] text-[#7A817D]">mg/L</span>
                  </span>
                </div>
                <div className="p-3 bg-[#F5F2EB] border border-[#111513]/10">
                  <span className="text-[9px] text-[#7A817D] uppercase tracking-wider block">T_MAX</span>
                  <span className="font-medium text-[#111513] text-sm tabular-nums">
                    {simResult.tMax} <span className="text-[10px] text-[#7A817D]">h</span>
                  </span>
                </div>
                <div className="p-3 bg-[#F5F2EB] border border-[#111513]/10">
                  <span className="text-[9px] text-[#7A817D] uppercase tracking-wider block">AUC_0-24</span>
                  <span className="font-medium text-[#111513] text-sm tabular-nums">
                    {simResult.auc024} <span className="text-[10px] text-[#7A817D]">mg*h/L</span>
                  </span>
                </div>
                <div className="p-3 bg-[#F5F2EB] border border-[#111513]/10">
                  <span className="text-[9px] text-[#7A817D] uppercase tracking-wider block">HALF-LIFE</span>
                  <span className="font-medium text-[#111513] text-sm tabular-nums">
                    {simResult.halfLifeHours} <span className="text-[10px] text-[#7A817D]">h</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Column 3: REGIMEN CONTROLS (Right, 3 cols) */}
            <div className="lg:col-span-3 bg-[#EEEAE1] border border-[#111513]/12 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#111513]/10 pb-3">
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#7A817D]">
                    REGIMEN PARAMETERS
                  </span>
                  <span className="font-mono text-[10px] text-[#1E6861] uppercase">ACTIVE SOLVER</span>
                </div>

                {/* Model Architecture Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[#7A817D] uppercase tracking-wider block">
                    Architecture:
                  </label>
                  <select
                    value={architecture}
                    onChange={(e) => setArchitecture(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-[#F5F2EB] border border-[#111513]/14 text-xs font-mono text-[#111513]"
                  >
                    <option value="1-Compartment">1-Compartment (Gut &rarr; Central)</option>
                    <option value="2-Compartment">2-Compartment (Central + Peripheral)</option>
                  </select>
                </div>

                {/* Administered Dose Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#7A817D]">Administered Dose:</span>
                    <span className="font-bold text-[#111513] tabular-nums">{doseMg} mg</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="250"
                    step="25"
                    value={doseMg}
                    onChange={(e) => setDoseMg(parseInt(e.target.value))}
                    className="w-full accent-[#1E6861] cursor-pointer"
                  />
                </div>

                {/* Route of Administration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[#7A817D] uppercase tracking-wider block">
                    Route of Administration:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRoute('Oral')}
                      className={`py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
                        route === 'Oral'
                          ? 'bg-[#1E6861] text-white border-[#1E6861]'
                          : 'bg-[#F5F2EB] border-[#111513]/14 text-[#343B38] hover:bg-[#E5E0D5]'
                      }`}
                    >
                      Oral
                    </button>
                    <button
                      onClick={() => setRoute('IV_Bolus')}
                      className={`py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
                        route === 'IV_Bolus'
                          ? 'bg-[#1E6861] text-white border-[#1E6861]'
                          : 'bg-[#F5F2EB] border-[#111513]/14 text-[#343B38] hover:bg-[#E5E0D5]'
                      }`}
                    >
                      IV Bolus
                    </button>
                  </div>
                </div>

                {/* Compute Fidelity */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[#7A817D] uppercase tracking-wider block">
                    Compute Fidelity:
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['QUICK', 'STANDARD', 'RESEARCH'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFidelity(f)}
                        className={`py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                          fidelity === f
                            ? 'bg-[#111513] text-[#F5F2EB] border-[#111513]'
                            : 'bg-[#F5F2EB] border-[#111513]/14 text-[#7A817D] hover:bg-[#E5E0D5]'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monte Carlo Uncertainty count */}
                <div className="p-3 bg-[#F5F2EB] border border-[#111513]/10 flex justify-between items-center text-xs font-mono">
                  <span className="text-[#7A817D]">Monte Carlo:</span>
                  <span className="font-semibold text-[#1E6861] tabular-nums">
                    {simResult.samplesCount} samples
                  </span>
                </div>
              </div>

              {/* Observed Points Management */}
              <div className="pt-3 border-t border-[#111513]/10 flex items-center justify-between text-xs font-mono">
                <span className="text-[#7A817D]">
                  TDM Draws: <strong className="text-[#111513]">{observedPoints.length}</strong>
                </span>
                {observedPoints.length > 0 && (
                  <button
                    onClick={handleResetPoints}
                    className="flex items-center gap-1 text-[#7A817D] hover:text-[#991B1B] transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear TDM
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal for adding synthetic observation points */}
        <AddTdmModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddPoint={handleAddPoint}
        />
      </div>
    </section>
  );
};
