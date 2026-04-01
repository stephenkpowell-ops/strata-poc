'use client';

/**
 * ScoreCard.tsx
 *
 * The hero stress score card on the home screen.
 *
 * Displays:
 *   - Large total score number, color-coded by severity
 *   - Status label (Managing · Elevated · High Load · Critical)
 *   - Score breakdown: Calendar pts + Check-in = Total
 *     When checkInValue + calendarPts > 100, the total displays in red
 *     (matching the Critical check-in option border color) to signal
 *     the score has been capped at 100.
 *   - 7-day sparkline with threshold line
 *   - Rolling 7-day average
 *
 * Color coding by totalScore:
 *   green  (< 50)  — Managing
 *   indigo (50–74) — Elevated
 *   orange (>= 75) — High Load
 *   red    (capped) — score would exceed 100
 *
 * Usage:
 *   <ScoreCard
 *     currentScore={86}
 *     calendarPts={28}
 *     checkInValue={58}
 *     rollingAvg={71}
 *     recentScores={last7}
 *   />
 */

import Sparkline from './Sparkline';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  currentScore:  number;
  calendarPts:   number;
  checkInValue:  number;
  rollingAvg:    number;
  recentScores:  number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getScoreColor(score: number, capped: boolean): string {
  if (capped)       return 'text-red-500';
  if (score >= 75)  return 'text-orange-400';
  if (score >= 50)  return 'text-indigo-400';
  return 'text-emerald-400';
}

function getStatusLabel(score: number, capped: boolean): string {
  if (capped)       return 'Critical';
  if (score >= 75)  return 'High Load';
  if (score >= 50)  return 'Elevated';
  return 'Managing';
}

function getStatusBadgeStyle(score: number, capped: boolean): string {
  if (capped)       return 'bg-red-950 text-red-500 border border-red-500';
  if (score >= 75)  return 'bg-orange-950 text-orange-400 border border-orange-800';
  if (score >= 50)  return 'bg-indigo-950 text-indigo-400 border border-indigo-800';
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

export default function ScoreCard({
  currentScore,
  calendarPts,
  checkInValue,
  rollingAvg,
  recentScores,
}: Props) {
  // Cap detection — true when the raw sum exceeds 100
  const isCapped    = checkInValue + calendarPts > 100;

  const scoreColor  = getScoreColor(currentScore, isCapped);
  const statusLabel = getStatusLabel(currentScore, isCapped);
  const statusBadge = getStatusBadgeStyle(currentScore, isCapped);
  const avgColor    = getAvgColor(rollingAvg);

  return (
    <div className="flex flex-col gap-4 bg-zinc-900 rounded-2xl p-6">

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Daily Stress Load
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

      {/* Score breakdown */}
      <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-3">

        {/* Calendar pts */}
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-zinc-500">Calendar</span>
          <span className="text-base font-bold text-indigo-400 tabular-nums">
            {calendarPts}
          </span>
        </div>

        <span className="text-zinc-600 text-lg font-light">+</span>

        {/* Check-in */}
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-zinc-500">Check-in</span>
          <span className="text-base font-bold text-indigo-400 tabular-nums">
            {checkInValue}
          </span>
        </div>

        <span className="text-zinc-600 text-lg font-light">=</span>

        {/* Total — red when capped */}
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-zinc-500">
            Total{isCapped ? ' (capped)' : ''}
          </span>
          <span className={`text-base font-bold tabular-nums ${scoreColor}`}>
            {currentScore}
          </span>
        </div>

      </div>

      {/* Capped notice */}
      {isCapped && (
        <p className="text-xs text-red-500 text-center -mt-1">
          Raw score {checkInValue + calendarPts} — capped at 100
        </p>
      )}

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
