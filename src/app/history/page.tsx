'use client';

/**
 * src/app/history/page.tsx
 *
 * History & Trends screen.
 *
 * Shows:
 *   - 9-day summary card (avg score, peak day, lowest day, mini sparkline)
 *   - Cumulative load drivers across all 9 days:
 *       Work meetings    — 286 pts (pre-computed from StressEngine)
 *       Active personal  —  49 pts (pre-computed from StressEngine)
 *       Check-in total   — sum of fixture check-ins + live today check-in
 *       Recovery         — −6 pts per completed session (live from store)
 *   - Score history list (most recent first, color-coded)
 */

import { useStrata } from '@/lib/store';
import Sparkline from '@/components/Sparkline';

// ─────────────────────────────────────────────────────────────────────────────
// CUMULATIVE CATEGORY TOTALS (pre-computed from StressEngine for Mar 17–25)
// ─────────────────────────────────────────────────────────────────────────────

const CUMULATIVE_WORK_PTS     = 286;
const CUMULATIVE_PERSONAL_PTS = 49;

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

// ─────────────────────────────────────────────────────────────────────────────
// 9-DAY SUMMARY CARD
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCard({
  scores,
}: {
  scores: { date: Date; totalScore: number }[];
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
// DRIVER ROW — load (positive pts, orange/indigo/emerald bars)
// ─────────────────────────────────────────────────────────────────────────────

function LoadDriverRow({
  label,
  pts,
  maxPts,
}: {
  label:  string;
  pts:    number;
  maxPts: number;
}) {
  const pct      = maxPts > 0 ? pts / maxPts : 0;
  const color    = pct >= 0.6 ? 'text-orange-400' : pct >= 0.3 ? 'text-indigo-400' : 'text-emerald-400';
  const barColor = pct >= 0.6 ? 'bg-orange-400'  : pct >= 0.3 ? 'bg-indigo-400'  : 'bg-emerald-400';
  const barWidth = `${Math.round(pct * 100)}%`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${color}`}>+{pts} pts</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: barWidth }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOVERY ROW — reduction (negative pts, always emerald)
// ─────────────────────────────────────────────────────────────────────────────

function RecoveryDriverRow({
  sessions,
  ptsReduced,
  maxPts,
}: {
  sessions:   number;
  ptsReduced: number;
  maxPts:     number;
}) {
  const barWidth = maxPts > 0 ? `${Math.round((ptsReduced / maxPts) * 100)}%` : '0%';
  const label    = sessions === 0
    ? 'Recovery sessions'
    : `Recovery (${sessions} ${sessions === 1 ? 'session' : 'sessions'})`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-indigo-400">
          {sessions === 0 ? '—' : `−${ptsReduced} pts`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        {sessions > 0 && (
          <div className="h-full rounded-full bg-indigo-400" style={{ width: barWidth }} />
        )}
      </div>
      {sessions === 0 && (
        <span className="text-[10px] text-zinc-600">
          Complete a Breathing Reset to log recovery
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUMULATIVE LOAD DRIVERS CARD
// ─────────────────────────────────────────────────────────────────────────────

function CumulativeDriversCard({
  scores,
  checkInValue,
  completedSessions,
  recoveryPtsTotal,
}: {
  scores:            { checkInValue: number }[];
  checkInValue:      number;
  completedSessions: number;
  recoveryPtsTotal:  number;
}) {
  // Cumulative check-in: fixture values for days 0–7 + live value for today
  const totalCheckIn = scores.slice(0, -1).reduce((sum, s) => sum + s.checkInValue, 0)
    + checkInValue;

  const loadDrivers = [
    { label: 'Work meetings',   pts: CUMULATIVE_WORK_PTS     },
    { label: 'Active personal', pts: CUMULATIVE_PERSONAL_PTS },
    { label: 'Check-in total',  pts: totalCheckIn            },
  ];

  const maxLoadPts = Math.max(...loadDrivers.map(d => d.pts), recoveryPtsTotal);

  return (
    <div className="flex flex-col gap-3 bg-zinc-900 rounded-2xl p-5">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Cumulative load drivers
        </span>
        <span className="text-xs text-zinc-600">Mar 17 – Mar 25 · total pts contributed</span>
      </div>

      <div className="flex flex-col gap-3">
        {loadDrivers.map((driver, i) => (
          <LoadDriverRow
            key={i}
            label={driver.label}
            pts={driver.pts}
            maxPts={maxLoadPts}
          />
        ))}

        {/* Divider before recovery row */}
        <div className="border-t border-zinc-800 pt-1" />

        <RecoveryDriverRow
          sessions={completedSessions}
          ptsReduced={recoveryPtsTotal}
          maxPts={maxLoadPts}
        />
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
      <div className="flex flex-col min-w-[72px]">
        <span className="text-xs font-medium text-zinc-300">{formatDate(date)}</span>
        {isLatest && (
          <span className="text-[10px] text-indigo-400 font-semibold">Today</span>
        )}
      </div>
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
      <div className="flex flex-col items-end gap-0.5 min-w-[56px]">
        <span className={`text-base font-bold tabular-nums ${scoreColor}`}>{totalScore}</span>
        <span className={`text-[10px] font-medium ${scoreColor}`}>{label}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { scores, checkInValue, completedSessions, recoveryPtsTotal } = useStrata();

  const sortedScores = [...scores].reverse();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Strata
          </span>
          <span className="text-xl font-bold text-white">History</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 pb-8">

        <SummaryCard scores={scores} />

        <CumulativeDriversCard
          scores={scores}
          checkInValue={checkInValue}
          completedSessions={completedSessions}
          recoveryPtsTotal={recoveryPtsTotal}
        />

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
