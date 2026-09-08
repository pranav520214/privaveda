"use client";
import type { Candidate } from "@/types";
import { percent, readable } from "@/lib/api";

export default function Pareto({
  candidates,
  selected,
  onSelect,
}: {
  candidates: Candidate[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const points = candidates.filter((c) => c.scores);
  const colors: Record<string, string> = {
    PARETO_OPTIMAL: "#177c70",
    DOMINATED: "#85949d",
    EXCLUDED: "#bf5149",
    ABSTAINED: "#bd872a",
  };
  return (
    <div className="chart-wrap">
      <svg
        viewBox="0 0 540 270"
        role="group"
        aria-label="Pareto comparison: demo toxicity on the horizontal axis, demo efficacy on the vertical axis"
      >
        {[0, 25, 50, 75, 100].map((n) => (
          <g key={n}>
            <line
              x1="52"
              y1={225 - n * 1.9}
              x2="510"
              y2={225 - n * 1.9}
              stroke="#e4eae8"
              strokeDasharray="3 4"
            />
            <text x="39" y={229 - n * 1.9} textAnchor="end" className="axis">
              {n}
            </text>
            <text
              x={52 + n * 4.58}
              y="244"
              textAnchor="middle"
              className="axis"
            >
              {n}
            </text>
          </g>
        ))}
        <line x1="52" y1="225" x2="510" y2="225" stroke="#c6d2cd" />
        <text x="285" y="265" textAnchor="middle" className="axis-label">
          Toxicity / safety burden → · DEMO_SCORE
        </text>
        <text
          x="15"
          y="134"
          textAnchor="middle"
          transform="rotate(-90 15 134)"
          className="axis-label"
        >
          Efficacy →
        </text>
        {points.map((c) => (
          <g
            key={c.therapy_id}
            role="button"
            tabIndex={0}
            aria-label={`${c.name}, ${readable(c.state)}, efficacy ${percent(c.scores!.efficacy)}, toxicity ${percent(c.scores!.toxicity)}`}
            onClick={() => onSelect(c.therapy_id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(c.therapy_id);
              }
            }}
            className="plot-point"
          >
            <circle
              cx={52 + c.scores!.toxicity * 458}
              cy={225 - c.scores!.efficacy * 190}
              r={selected === c.therapy_id ? 10 : 7}
              fill={colors[c.state]}
              stroke="white"
              strokeWidth="3"
            />
            {selected === c.therapy_id && (
              <circle
                cx={52 + c.scores!.toxicity * 458}
                cy={225 - c.scores!.efficacy * 190}
                r="14"
                fill="none"
                stroke={colors[c.state]}
              />
            )}
            <text
              x={52 + c.scores!.toxicity * 458 + 12}
              y={225 - c.scores!.efficacy * 190 - 10}
              className="point-label"
            >
              {c.name.replace("DEMO ", "")}
            </text>
          </g>
        ))}
      </svg>
      <div className="chart-key">
        {Object.entries(colors).map(([label, color]) => (
          <span key={label}>
            <i style={{ background: color }} />
            {readable(label)}
          </span>
        ))}
      </div>
      <p className="caption">
        The chart shows two dimensions. Pareto status uses all five objectives;
        blocked points never enter ranking.
      </p>
    </div>
  );
}
