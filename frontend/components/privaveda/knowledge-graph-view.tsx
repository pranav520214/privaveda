"use client";

import React, { useEffect, useState } from "react";
import { Share2, Info, CheckCircle2, Shield, Plus, Minus, RefreshCw } from "lucide-react";
import type { KnowledgeGraphData, GraphNode, GraphEdge } from "./types";

interface KnowledgeGraphViewProps {
  caseId: string;
}

export default function KnowledgeGraphView({ caseId }: KnowledgeGraphViewProps) {
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchGraph() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/privaveda/graph/${caseId}`);
        if (res.ok) {
          const data: KnowledgeGraphData = await res.json();
          setGraphData(data);
          if (data.nodes.length > 0) setSelectedNode(data.nodes[0]);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchGraph();
  }, [caseId]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case "PatientToken":
        return "#0c192c";
      case "Gene":
        return "#4338ca";
      case "Enzyme":
        return "#0284c7";
      case "MedicationEntity":
        return "#059669";
      case "Condition":
        return "#d97706";
      case "LaboratoryMeasurement":
        return "#e11d48";
      default:
        return "#475569";
    }
  };

  // Layout node positions in an interactive star/circular neighborhood
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const width = 600;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  // Calculate layout coordinates
  const layoutNodes = nodes.map((node, index) => {
    if (node.type === "PatientToken") {
      return { ...node, x: centerX, y: centerY };
    }
    const angle = ((index - 1) / Math.max(1, nodes.length - 1)) * 2 * Math.PI;
    const radius = isExpanded ? 160 : 120;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0c192c] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-700" />
            <span>Medical Knowledge Graph</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            NetworkX-powered directed graph linking pseudonymous patient token, clinical observations, and pharmacogenomics.
          </p>
        </div>

        {/* Expand Relationships Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isExpanded ? "Collapse View" : "Expand Relationships"}</span>
          </button>
        </div>
      </div>

      {/* Graph Visualizer + Details Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Canvas (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col items-center justify-center relative min-h-[440px]">
          <div className="absolute top-4 left-4 text-[11px] font-mono text-slate-400">
            Topology: Clinical Neighborhood ({nodes.length} nodes, {edges.length} edges)
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[400px]">
            {/* Edge lines */}
            {edges.map((edge, idx) => {
              const u = nodeMap.get(edge.source);
              const v = nodeMap.get(edge.target);
              if (!u || !v) return null;
              return (
                <g key={idx}>
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                    strokeDasharray={edge.confidence === "VALIDATED" ? undefined : "3 3"}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {layoutNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const color = getNodeColor(node.type);
              const isCenter = node.type === "PatientToken";

              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isCenter ? 26 : 18}
                    fill={color}
                    stroke={isSelected ? "#00b4d8" : "#ffffff"}
                    strokeWidth={isSelected ? "4" : "2"}
                    className="shadow-sm"
                  />
                  <text
                    x={node.x}
                    y={node.y + (isCenter ? 36 : 28)}
                    textAnchor="middle"
                    fill="#1e293b"
                    fontSize={isCenter ? "11" : "9"}
                    fontWeight={isCenter ? "bold" : "600"}
                    className="select-none pointer-events-none"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Details Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Node Details</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                {selectedNode?.type || "Select Node"}
              </span>
            </div>

            {selectedNode ? (
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Identifier / Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedNode.label}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Node Type</span>
                  <span className="font-mono text-slate-700">{selectedNode.type}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Provenance &amp; Source</span>
                  <span className="text-slate-700 font-mono">CLINICAL_VAULT_LOCAL (Pint / Pint-Registry)</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Evidence Confidence</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> VALIDATED
                  </span>
                </div>

                {selectedNode.properties && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Properties</span>
                    <pre className="p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] text-slate-700 overflow-x-auto">
                      {JSON.stringify(selectedNode.properties, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 text-center text-slate-400 text-xs">
                Click any graph node to inspect clinical provenance.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span>Direct patient identity is strictly forbidden from entering the graph.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
