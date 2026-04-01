'use client';

/**
 * src/app/history/page.tsx
 *
 * History & Trends screen.
 *
 * Shows:
 *   - 9-day summary card (avg score, peak day, lowest day, mini sparkline)
 *   - Top load drivers — cumulative totals across all 9 days including check-in
 *   - Score history list (most recent first, color-coded)
 *     March 25 shows the live check-in value from the store.
 *     All other days show their fixture check-in values.
 */

import { useStrata } from '@/lib/store';
import Sparkline from '@/components/Sparkline';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-orange-400';
  if (score >= 50) return 'text-indigo-400';
  return 'text-emerald-400';
}

function getScoreLabel(score: number): string {
  if (score >= 75) return 'High Load';
  if (score >= 50) return 'Elevated';
  return 'Managing';
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
  });
}

function getCheckInLabel(value: number): string {
  switch (value) {
    case 0:   return 'Zero';
    case 25:  return 'Low';
    case 50:  return 'Moderate';
    case 75:  return 'High';
    case 100: return 'Critical';
    default:  return `${value}`;
  }
}

function getDriverColor(pts: number): string {
  if (pts >= 150) return 'text-orange-400';
  if (pts >= 75)  return 'text-indigo-400';
  return 'text-emerald-400';
}

function getDriverBarColor(pts: number): string {
  if (pts >= 150) return 'bg-orange-400';
  if (pts >= 75)  return 'bg-indigo-400';
  return 'bg-emerald-400';
}

// ─────────────────────────────────────────────────────────────────────────────
// 9-DAY SUMMARY CARD
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCard({
  scores,
}: {
  scores: { date: Date; totalScore: number; calendarPts: number }[];
}) {
  const totals   = scores.map(s => s.totalScore);
  const avg      = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
  const peak     = scores.reduce((a, b) => a.totalScore > b.totalScore ? a : b);
  const lowest   = scores.reduce((a, b) => a.totalScore < b.totalScore ? a : b);
  const avgColor = getScoreColor(avg);

  return (
    <div className="flex flex-col gap-4 bg-zinc-900 rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            9-day summary
          </span>
          <span className="text-xs text-zinc-600">Mar 17 – Mar 25</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-zinc-500">Period avg</span>
          <span className={`text-2xl font-bold tabular-nums ${avgColor}`}>{avg}</span>
        </div>
      </div>

      <Sparkline scores={totals} height={48} threshold={70} />

      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-800">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-600">Peak day</span>
          <span className="text-xs font-medium text-orange-400">{formatDate(peak.date)}</span>
          <span className="text-sm font-bold text-orange-400 tabular-nums">{peak.totalScore}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-zinc-600">Lowest day</span>
          <span className="text-xs font-medium text-emerald-400">{formatDate(lowest.date)}</span>
          <span className="text-sm font-bold text-emerald-400 tabular-nums">{lowest.totalScore}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER ROW
// ─────────────────────────────────────────────────────────────────────────────

function DriverRow({
  label,
  pts,
  maxPts,
}: {
  label:  string;
  pts:    number;
  maxPts: number;
}) {
  const barWidth = maxPts > 0
    ? `${Math.round((pts / maxPts) * 100)}%`
    : '0%';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300 capitalize">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${getDriverColor(pts)}`}>
          +{pts} pts
        </span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${getDriverBarColor(pts)}`}
          style={{ width: barWidth }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP LOAD DRIVERS CARD — cumulative across all 9 days
// ─────────────────────────────────────────────────────────────────────────────

function TopDriversCard({
  scores,
  checkInValue,
}: {
  scores:       { checkInValue: number; calendarPts: number }[];
  checkInValue: number;
}) {
  // Cumulative calendar pts per category across all days
  // Work meetings = sum of all calendarPts (simplified — full breakdown
  // would require per-day StressEngine output which is out of scope for POC)
  const totalCalPts = scores.reduce((sum, s) => sum + s.calendarPts, 0);

  // Cumulative check-in: sum of fixture values for days 0-7,
  // plus the live check-in for the most recent day (index 8)
  const totalCheckIn = scores.slice(0, -1).reduce((sum, s) => sum + s.checkInValue, 0)
    + checkInValue;

  const allDrivers = [
    { label: 'Work meetings',  pts: totalCalPts   },
    { label: 'Check-in total', pts: totalCheckIn  },
  ];

  const maxPts = Math.max(...allDrivers.map(d => d.pts));

  return (
    <div className="flex flex-col gap-3 bg-zinc-900 rounded-2xl p-5">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Cumulative load drivers
        </span>
        <span className="text-xs text-zinc-600">Mar 17 – Mar 25 · total pts contributed</span>
      </div>
      <div className="flex flex-col gap-3">
        {allDrivers.map((driver, i) => (
          <DriverRow
            key={i}
            label={driver.label}
            pts={driver.pts}
            maxPts={maxPts}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE ROW
// ─────────────────────────────────────────────────────────────────────────────

function ScoreRow({
  date,
  totalScore,
  calendarPts,
  checkInValue,
  isLatest,
}: {
  date:         Date;
  totalScore:   number;
  calendarPts:  number;
  checkInValue: number;
  isLatest:     boolean;
}) {
  const scoreColor = getScoreColor(totalScore);
  const label      = getScoreLabel(totalScore);
  const checkLabel = getCheckInLabel(checkInValue);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
      isLatest ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900 border-zinc-800'
    }`}>

      {/* Date */}
      <div className="flex flex-col min-w-[72px]">
        <span className="text-xs font-medium text-zinc-300">
          {formatDate(date)}
        </span>
        {isLatest && (
          <span className="text-[10px] text-indigo-400 font-semibold">Today</span>
        )}
      </div>

      {/* Bar */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              totalScore >= 75 ? 'bg-orange-400' :
              totalScore >= 50 ? 'bg-indigo-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${totalScore}%` }}
          />
        </div>
        <div className="flex gap-3">
          <span className="text-[10px] text-zinc-600">Cal {calendarPts} pts</span>
          <span className="text-[10px] text-zinc-600">Check-in {checkLabel}</span>
        </div>
      </div>

      {/* Score + label */}
      <div className="flex flex-col items-end gap-0.5 min-w-[56px]">
        <span className={`text-base font-bold tabular-nums ${scoreColor}`}>
          {totalScore}
        </span>
        <span className={`text-[10px] font-medium ${scoreColor}`}>
          {label}
        </span>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { scores, checkInValue } = useStrata();

  const sortedScores = [...scores].reverse();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Strata
          </span>
          <span className="text-xl font-bold text-white">
            History
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 pb-8">

        {/* 9-day summary */}
        <SummaryCard scores={scores} />

        {/* Cumulative load drivers */}
        <TopDriversCard
          scores={scores}
          checkInValue={checkInValue}
        />

        {/* Score history list */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1">
            Score history
          </span>
          {sortedScores.map((score, i) => {
            const isLatest       = i === 0;
            const displayCheckIn = isLatest ? checkInValue : score.checkInValue;
            const displayTotal   = isLatest
              ? Math.min(100, checkInValue + score.calendarPts)
              : score.totalScore;

            return (
              <ScoreRow
                key={score.id}
                date={score.date}
                totalScore={displayTotal}
                calendarPts={score.calendarPts}
                checkInValue={displayCheckIn}
                isLatest={isLatest}
              />
            );
          })}
        </div>

      </div>

    </div>
  );
}
