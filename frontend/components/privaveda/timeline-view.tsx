"use client";

import React, { useEffect, useState } from "react";
import { Clock, Activity, FileText, FlaskConical, Dna, Cpu, Calendar } from "lucide-react";
import type { TimelineEvent } from "./types";

interface TimelineViewProps {
  caseId: string;
}

export default function TimelineView({ caseId }: TimelineViewProps) {
  const [zoom, setZoom] = useState<"day" | "week" | "month">("week");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTimeline() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/privaveda/timeline/${caseId}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadTimeline();
  }, [caseId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "LAB_MEASUREMENT":
        return <FlaskConical className="w-4 h-4 text-amber-600" />;
      case "GENOMIC_REPORT":
        return <Dna className="w-4 h-4 text-indigo-600" />;
      case "DIGITAL_TWIN_INIT":
        return <Cpu className="w-4 h-4 text-cyan-600" />;
      case "SIMULATION_RUN":
        return <Activity className="w-4 h-4 text-blue-600" />;
      case "TDM_OBSERVATION":
        return <Activity className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header & Zoom Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0c192c] flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-700" />
            <span>Clinical Data Timeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological log of clinical observations, digital twin initializations, and Bayesian model recalibrations.
          </p>
        </div>

        {/* Zoom Selector (Day / Week / Month) */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setZoom("day")}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              zoom === "day" ? "bg-[#0c192c] text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setZoom("week")}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              zoom === "week" ? "bg-[#0c192c] text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setZoom("month")}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              zoom === "month" ? "bg-[#0c192c] text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Events Timeline Container */}
      <div className="relative pl-6 border-l-2 border-cyan-100 space-y-6 my-8">
        {events.map((evt, idx) => (
          <div key={evt.id || idx} className="relative group">
            {/* Timeline Bullet */}
            <div className="absolute -left-[31px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-cyan-500 flex items-center justify-center shadow-xs">
              <div className="w-2 h-2 rounded-full bg-cyan-600" />
            </div>

            {/* Event Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="font-mono text-slate-500">{new Date(evt.timestamp).toLocaleString()}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                  {evt.source}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getCategoryIcon(evt.category)}
                <h3 className="text-sm font-bold text-slate-900">{evt.title}</h3>
              </div>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {evt.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
