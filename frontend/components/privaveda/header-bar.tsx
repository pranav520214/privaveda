"use client";

import React from "react";
import {
  Shield,
  WifiOff,
  UserCheck,
  Lock,
  History,
  RotateCcw,
  Play,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import type { ApplicationMode, Role } from "./types";

interface HeaderBarProps {
  mode: ApplicationMode;
  role: Role;
  onRoleChange: (r: Role) => void;
  onSwitchMode: () => void;
  onLockSession: () => void;
  onResetDemo: () => void;
  onStartGuidedDemo: () => void;
}

export default function HeaderBar({
  mode,
  role,
  onRoleChange,
  onSwitchMode,
  onLockSession,
  onResetDemo,
  onStartGuidedDemo,
}: HeaderBarProps) {
  const isDemo = mode === "DEMO";

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between z-30 sticky top-0 shadow-xs">
      {/* Brand & Mode Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onSwitchMode}>
          <div className="w-8 h-8 rounded-lg bg-[#0c192c] text-white flex items-center justify-center font-bold text-sm tracking-wider">
            P
          </div>
          <div>
            <div className="text-xs font-black tracking-widest text-[#0c192c]">PRIVAVEDA</div>
            <div className="text-[9px] font-bold text-cyan-700 leading-none">यथा देहः तथा चिकित्सा</div>
          </div>
        </div>

        {/* Operational Mode Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase border shadow-2xs ${
            isDemo
              ? "bg-cyan-50 text-cyan-800 border-cyan-300"
              : "bg-indigo-50 text-indigo-900 border-indigo-300"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isDemo ? "bg-cyan-500 animate-pulse" : "bg-indigo-600"}`} />
          <span>{isDemo ? "SAFE DEMO MODE · SYNTHETIC" : "LOCAL RESEARCH MODE · REAL DATA"}</span>
        </div>

        {/* Permanent Privacy & Security Indicators */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-medium text-slate-600 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            <WifiOff className="w-3 h-3 text-slate-500" />
            <span>NETWORK: OFFLINE</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            <UserCheck className="w-3 h-3 text-cyan-700" />
            <span>IDENTITY: PSEUDONYMIZED</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            <Lock className="w-3 h-3 text-emerald-700" />
            <span>STORAGE: ENCRYPTED</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            <History className="w-3 h-3 text-blue-700" />
            <span>AUDIT: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {isDemo ? (
          <>
            <button
              onClick={onResetDemo}
              title="Reset demonstration fixtures and deterministic seeds"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset Demo</span>
            </button>

            <button
              onClick={onStartGuidedDemo}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-cyan-900 bg-cyan-100 hover:bg-cyan-200 border border-cyan-300 rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-cyan-800 text-cyan-800" />
              <span>Guided Demo</span>
            </button>
          </>
        ) : (
          <div className="hidden sm:block text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            NOT AN AUTONOMOUS PRESCRIBER
          </div>
        )}

        {/* Role Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-xs">
          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as Role)}
            className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="CLINICIAN">Clinician Reviewer</option>
            <option value="RESEARCHER">Researcher</option>
            <option value="ADMIN">Security Admin</option>
          </select>
        </div>

        {/* Lock Session / Mode Switch Button */}
        <button
          onClick={onLockSession}
          title="Lock session and clear memory"
          className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
