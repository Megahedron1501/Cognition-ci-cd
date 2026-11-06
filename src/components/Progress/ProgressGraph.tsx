import React, { useState } from 'react';

// Standard ABA line graph: one point per session, 0-100%, with dashed phase
// change lines that the data path never crosses, and an optional mastery line.

export interface GraphPoint {
  session: number; // 1-based position on the x-axis
  percent: number;
  independent: number;
  total: number;
  date: string;
}

export interface GraphPhaseLine {
  afterSession: number; // drawn between this session and the next; 0 is before the first
  number: number; // matches the numbered list under the graph
}

interface ProgressGraphProps {
  points: GraphPoint[];
  phaseLines: GraphPhaseLine[];
  criterionPercent?: number;
}

const WIDTH = 720;
const HEIGHT = 300;
const MARGIN = { top: 24, right: 20, bottom: 44, left: 52 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_TICKS = [0, 25, 50, 75, 100];
const LINE_COLOR = '#1976D2';
const MAX_X_LABELS = 15;

const ProgressGraph: React.FC<ProgressGraphProps> = ({ points, phaseLines, criterionPercent }) => {
  const [activeSession, setActiveSession] = useState<number | null>(null);

  const xStep = PLOT_W / points.length;
  const x = (session: number) => MARGIN.left + (session - 0.5) * xStep;
  const y = (percent: number) => MARGIN.top + (1 - percent / 100) * PLOT_H;

  // The data path breaks at every phase line, so a change in conditions is
  // never drawn as if it were one continuous trend.
  const breaks = new Set(phaseLines.map(p => p.afterSession));
  const segments: GraphPoint[][] = [];
  points.forEach(point => {
    if (segments.length === 0 || breaks.has(point.session - 1)) segments.push([]);
    segments[segments.length - 1].push(point);
  });

  const labelEvery = Math.ceil(points.length / MAX_X_LABELS);
  const active = points.find(p => p.session === activeSession);

  return (
    <div className="progress-graph" onMouseLeave={() => setActiveSession(null)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Percent independent correct across ${points.length} sessions. The table below lists every value.`}
      >
        {Y_TICKS.map(tick => (
          <g key={tick}>
            <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(tick)} y2={y(tick)} stroke="#E5E7EB" strokeWidth={1} />
            <text x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end" className="graph-tick">{tick}%</text>
          </g>
        ))}
        {points.map(p => (p.session - 1) % labelEvery === 0 && (
          <text key={p.session} x={x(p.session)} y={HEIGHT - MARGIN.bottom + 18} textAnchor="middle" className="graph-tick">
            {p.session}
          </text>
        ))}
        <text x={MARGIN.left + PLOT_W / 2} y={HEIGHT - 6} textAnchor="middle" className="graph-axis-title">Session</text>
        <text
          transform={`translate(14 ${MARGIN.top + PLOT_H / 2}) rotate(-90)`}
          textAnchor="middle"
          className="graph-axis-title"
        >
          Independent correct
        </text>

        {criterionPercent !== undefined && (
          <g>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={y(criterionPercent)}
              y2={y(criterionPercent)}
              stroke="#6B7280"
              strokeWidth={1.5}
              strokeDasharray="2 4"
            />
            <text x={WIDTH - MARGIN.right} y={y(criterionPercent) - 6} textAnchor="end" className="graph-tick">
              Mastery {criterionPercent}%
            </text>
          </g>
        )}

        {phaseLines.map(line => {
          const lineX = MARGIN.left + line.afterSession * xStep;
          return (
            <g key={line.number}>
              <line x1={lineX} x2={lineX} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke="#374151" strokeWidth={1.5} strokeDasharray="6 4" />
              <text x={lineX} y={MARGIN.top - 8} textAnchor="middle" className="graph-phase-number">{line.number}</text>
            </g>
          );
        })}

        {active && (
          <line x1={x(active.session)} x2={x(active.session)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} stroke="#9CA3AF" strokeWidth={1} />
        )}

        {segments.map((segment, i) => (
          <polyline
            key={i}
            points={segment.map(p => `${x(p.session)},${y(p.percent)}`).join(' ')}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}

        {points.map(p => (
          <circle key={p.session} cx={x(p.session)} cy={y(p.percent)} r={5} fill={LINE_COLOR} stroke="white" strokeWidth={2} />
        ))}

        {/* Full-height columns, so a point is easy to hit with a mouse or a finger. */}
        {points.map(p => (
          <rect
            key={p.session}
            x={x(p.session) - xStep / 2}
            y={MARGIN.top}
            width={xStep}
            height={PLOT_H}
            fill="transparent"
            onMouseEnter={() => setActiveSession(p.session)}
            onClick={() => setActiveSession(p.session)}
          />
        ))}
      </svg>

      {active && (
        <div
          className="graph-tooltip"
          style={{
            left: `${(x(active.session) / WIDTH) * 100}%`,
            top: `${(y(active.percent) / HEIGHT) * 100}%`,
            transform: `translate(${active.session > points.length / 2 ? 'calc(-100% - 12px)' : '12px'}, -50%)`,
          }}
        >
          <strong>Session {active.session}: {active.percent}%</strong>
          <div>{active.independent}/{active.total} independent</div>
          <div>{active.date}</div>
        </div>
      )}
    </div>
  );
};

export default ProgressGraph;
