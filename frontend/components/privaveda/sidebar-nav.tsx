"use client";

import React from "react";
import {
  LayoutDashboard,
  User,
  Clock,
  Share2,
  Cpu,
  Activity,
  Columns,
  HelpCircle,
  BarChart3,
  Fingerprint,
  ShieldCheck,
  Server,
  Play,
  UploadCloud,
} from "lucide-react";
import type { ActiveView, ApplicationMode } from "./types";

interface SidebarNavProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  mode: ApplicationMode;
  onOpenImportWizard?: () => void;
}

export default function SidebarNav({
  activeView,
  onSelectView,
  mode,
  onOpenImportWizard,
}: SidebarNavProps) {
  const isDemo = mode === "DEMO";

  const navItems = [
    { id: "OVERVIEW" as ActiveView, label: "Overview", icon: LayoutDashboard },
    { id: "PATIENT_DATA" as ActiveView, label: "Patient Data", icon: User },
    { id: "TIMELINE" as ActiveView, label: "Clinical Timeline", icon: Clock },
    { id: "KNOWLEDGE_GRAPH" as ActiveView, label: "Knowledge Graph", icon: Share2 },
    { id: "DIGITAL_TWIN" as ActiveView, label: "Digital Twin", icon: Cpu },
    { id: "SIMULATION" as ActiveView, label: "Simulation Workbench", icon: Activity },
    { id: "SCENARIOS" as ActiveView, label: "Scenario Comparison", icon: Columns },
    { id: "UNCERTAINTY" as ActiveView, label: "Uncertainty & Sensitivity", icon: HelpCircle },
    { id: "VALIDATION" as ActiveView, label: "Model Validation", icon: BarChart3 },
    { id: "AUDIT" as ActiveView, label: "Audit & Provenance", icon: Fingerprint },
    { id: "SECURITY" as ActiveView, label: "Security & Privacy", icon: ShieldCheck },
    { id: "SYSTEM" as ActiveView, label: "System & AI Status", icon: Server },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-1 overflow-y-auto">
        {/* Special Guided Demo Banner in Demo Mode */}
        {isDemo && (
          <button
            onClick={() => onSelectView("GUIDED_DEMO")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all mb-3 cursor-pointer ${
              activeView === "GUIDED_DEMO"
                ? "bg-cyan-600 text-white shadow-sm"
                : "bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200"
            }`}
          >
            <Play className={`w-4 h-4 ${activeView === "GUIDED_DEMO" ? "fill-white" : "fill-cyan-700 text-cyan-700"}`} />
            <span>Autopilot Guided Demo</span>
          </button>
        )}

        {/* Import Case Wizard Button in Research Mode */}
        {!isDemo && onOpenImportWizard && (
          <button
            onClick={onOpenImportWizard}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-all mb-3 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-indigo-700" />
            <span>Import Clinical Case</span>
          </button>
        )}

        {/* Navigation Items */}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? "bg-[#0c192c] text-white font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
        <div className="font-bold text-slate-700">PRIVAVEDA v2.0</div>
        <div className="flex items-center justify-between text-[10px]">
          <span>Engine: SciPy solve_ivp</span>
          <span className="text-emerald-700 font-bold">READY</span>
        </div>
        <div className="text-[10px] text-slate-400">Simulation Before Suggestion</div>
      </div>
    </aside>
  );
}
