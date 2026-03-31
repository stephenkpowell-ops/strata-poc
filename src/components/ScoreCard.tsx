'use client';

/**
 * ScoreCard.tsx
 *
 * The hero stress score card on the home screen.
 *
 * Displays:
 *   - Large score number, color-coded by severity
 *   - Status label (Managing · Elevated · High Load)
 *   - "7-day trend" label above the sparkline
 *   - Sparkline showing the last 7 scores with threshold line
 *   - Rolling 7-day average below the sparkline
 *
 * Color coding by totalScore:
 *   green  (< 50)  — Managing
 *   amber  (50–74) — Elevated
 *   orange (>= 75) — High Load
 *
 * Usage:
 *   <ScoreCard currentScore={86} rollingAvg={76} recentScores={last7} />
 */

import Sparkline from './Sparkline';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  currentScore:  number;
  rollingAvg:    number;
  recentScores:  number[];  // last 7 totalScore values, oldest first
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-orange-400';
  if (score >= 50) return 'text-indigo-400';
  return 'text-emerald-400';
}

function getStatusLabel(score: number): string {
  if (score >= 75) return 'High Load';
  if (score >= 50) return 'Elevated';
  return 'Managing';
}

function getStatusBadgeStyle(score: number): string {
  if (score >= 75) return 'bg-orange-950 text-orange-400 border border-orange-800';
  if (score >= 50) return 'bg-indigo-950 text-indigo-400 border border-indigo-800';
  return 'bg-emerald-950 text-emerald-400 border border-emerald-800';
}

function getAvgColor(avg: number): string {
  if (avg >= 75) return 'text-orange-400';
  if (avg >= 50) return 'text-indigo-400';
  return 'text-emerald-400';
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ScoreCard({ currentScore, rollingAvg, recentScores }: Props) {
  const scoreColor      = getScoreColor(currentScore);
  const statusLabel     = getStatusLabel(currentScore);
  const statusBadge     = getStatusBadgeStyle(currentScore);
  const avgColor        = getAvgColor(rollingAvg);

  return (
    <div className="flex flex-col gap-4 bg-zinc-900 rounded-2xl p-6">

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Stress Load
          </span>
          <span className="text-xs text-zinc-500">
            Today
          </span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge}`}>
          {statusLabel}
        </span>
      </div>

      {/* Score number */}
      <div className="flex items-end gap-2">
        <span className={`text-7xl font-bold tabular-nums leading-none ${scoreColor}`}>
          {currentScore}
        </span>
        <span className="text-zinc-500 text-sm mb-2">/ 100</span>
      </div>

      {/* Sparkline */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">7-day trend</span>
        <Sparkline scores={recentScores} height={56} />
      </div>

      {/* Rolling average */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <span className="text-xs text-zinc-500">7-day rolling avg</span>
        <span className={`text-sm font-semibold tabular-nums ${avgColor}`}>
          {rollingAvg}
        </span>
      </div>

    </div>
  );
}
