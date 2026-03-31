'use client';

/**
 * Sparkline.tsx
 *
 * A small SVG line chart showing the last N stress scores.
 *
 * Renders:
 *   - A polyline path connecting each score as a data point
 *   - A filled dot on each data point
 *   - A dashed horizontal threshold line at score 70
 *
 * The line and dots are colored to match the current score:
 *   orange  (>= 75) — high load
 *   indigo  (50–74) — medium load
 *   green   (< 50)  — low load
 *
 * Usage:
 *   <Sparkline scores={last7Scores} width={320} height={64} />
 */

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  scores:    number[];   // array of totalScore values, oldest first
  width?:    number;
  height?:   number;
  threshold?: number;   // dashed line — default 70
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getLineColor(currentScore: number): string {
  if (currentScore >= 75) return '#fb923c'; // orange-400
  if (currentScore >= 50) return '#818cf8'; // indigo-400
  return '#34d399';                          // emerald-400
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Sparkline({
  scores,
  width     = 320,
  height    = 64,
  threshold = 70,
}: Props) {
  if (scores.length < 2) return null;

  const padding    = 8;
  const chartW     = width  - padding * 2;
  const chartH     = height - padding * 2;
  const minScore   = 0;
  const maxScore   = 100;
  const scoreRange = maxScore - minScore;

  // Map a score value to a Y coordinate (inverted — higher score = lower on screen)
  const toY = (score: number) =>
    padding + chartH - ((score - minScore) / scoreRange) * chartH;

  // Map an index to an X coordinate
  const toX = (i: number) =>
    padding + (i / (scores.length - 1)) * chartW;

  const points = scores.map((s, i) => ({ x: toX(i), y: toY(s) }));
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const currentScore = scores[scores.length - 1];
  const lineColor    = getLineColor(currentScore);
  const thresholdY   = toY(threshold);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      aria-hidden="true"
    >
      {/* Threshold line */}
      <line
        x1={padding}
        y1={thresholdY}
        x2={width - padding}
        y2={thresholdY}
        stroke="#52525b"
        strokeWidth={1}
        strokeDasharray="4 3"
      />

      {/* Score line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />

      {/* Data point dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 3.5 : 2}
          fill={lineColor}
          opacity={i === points.length - 1 ? 1 : 0.5}
        />
      ))}
    </svg>
  );
}
