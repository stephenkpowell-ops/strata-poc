'use client';

/**
 * src/app/history/page.tsx
 *
 * History & Trends screen.
 *
 * Cumulative Load Drivers shows calendar-based drivers only:
 *   Work meetings   — 286 pts (pre-computed)
 *   Active personal —  49 pts (pre-computed)
 *   Recovery        — live from store (emerald, reduction)
 *
 * Check-in is shown only on the daily burnout screen where it has
 * direct context alongside today's calendar load.
 */

import { useStrata } from '@/lib/store';
import Sparkline from '@/components/Sparkline';

// ─────────────────────────────────────────────────────────────────────────────
// CUMULATIVE CATEGORY TOTALS (pre-computed from StressEngine for Mar 17–25)
// ─────────────────────────────────────────────────────────────────────────────

const CUMULATIVE_WORK_PTS     = 286;
const CUMULATIVE_PERSONAL_PTS = 58;   // updated: includes Mar 22 personal events (+9 pts)
// Check-in contribution = actual pts added per day under half-weight model
// Work days: round(checkIn × 0.5), Rest days: full checkIn value
const CUMULATIVE_CHECK_IN_PTS = 227;

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
// DRIVER ROW
// ─────────────────────────────────────────────────────────────────────────────

function LoadDriverRow({
  label,
  pts,
  maxPts,
  fixedColor,
}: {
  label:       string;
  pts:         number;
  maxPts:      number;
  fixedColor?: 'indigo' | 'zinc';
}) {
  const pct      = maxPts > 0 ? pts / maxPts : 0;
  const color    = fixedColor === 'indigo' ? 'text-indigo-400'
    : fixedColor === 'zinc'   ? 'text-zinc-400'
    : pct >= 0.6 ? 'text-orange-400' : pct >= 0.3 ? 'text-indigo-400' : 'text-emerald-400';
  const barColor = fixedColor === 'indigo' ? 'bg-indigo-400'
    : fixedColor === 'zinc'   ? 'bg-zinc-500'
    : pct >= 0.6 ? 'bg-orange-400'  : pct >= 0.3 ? 'bg-indigo-400'  : 'bg-emerald-400';
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

function RecoveryRow({
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
        <span className="text-sm font-semibold tabular-nums text-emerald-400">
          {sessions === 0 ? '—' : `−${ptsReduced} pts`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        {sessions > 0 && (
          <div className="h-full rounded-full bg-emerald-400" style={{ width: barWidth }} />
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
  completedSessions,
  recoveryPtsTotal,
  cumulativeTotalStress,
}: {
  completedSessions:     number;
  recoveryPtsTotal:      number;
  cumulativeTotalStress: number;
}) {
  const loadDrivers = [
    { label: 'Work meetings',   pts: CUMULATIVE_WORK_PTS,     fixedColor: undefined          },
    { label: 'Active personal', pts: CUMULATIVE_PERSONAL_PTS, fixedColor: 'indigo' as const  },
    { label: 'Check-in',        pts: CUMULATIVE_CHECK_IN_PTS, fixedColor: 'zinc'   as const  },
  ];

  const maxPts = Math.max(...loadDrivers.map(d => d.pts), recoveryPtsTotal, cumulativeTotalStress);

  return (
    <div className="flex flex-col gap-3 bg-zinc-900 rounded-2xl p-5">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Cumulative load drivers
        </span>
        <span className="text-xs text-zinc-600">Mar 17 – Mar 25 · actual pts contributed</span>
      </div>

      <div className="flex flex-col gap-3">
        {loadDrivers.map((driver, i) => (
          <LoadDriverRow
            key={i}
            label={driver.label}
            pts={driver.pts}
            maxPts={maxPts}
            fixedColor={driver.fixedColor}
          />
        ))}

        <div className="border-t border-zinc-800 pt-1" />

        <RecoveryRow
          sessions={completedSessions}
          ptsReduced={recoveryPtsTotal}
          maxPts={maxPts}
        />

        {/* Cumulative total — with recovery note */}
        <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-200">Total stress load</span>
            <span className={`text-sm font-bold tabular-nums ${
              cumulativeTotalStress >= 600 ? 'text-orange-400' :
              cumulativeTotalStress >= 400 ? 'text-indigo-400' : 'text-emerald-400'
            }`}>
              {cumulativeTotalStress} pts
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                cumulativeTotalStress >= 600 ? 'bg-orange-400' :
                cumulativeTotalStress >= 400 ? 'bg-indigo-400' : 'bg-emerald-400'
              }`}
              style={{ width: '100%' }}
            />
          </div>
          {recoveryPtsTotal > 0 && (
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              Recovery sessions reduced your total by {recoveryPtsTotal} pts.
              Without recovery: {cumulativeTotalStress + recoveryPtsTotal} pts.
            </p>
          )}
          {recoveryPtsTotal === 0 && (
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              Complete a Breathing Reset to reduce your cumulative total.
            </p>
          )}
        </div>
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
          completedSessions={completedSessions}
          recoveryPtsTotal={recoveryPtsTotal}
          cumulativeTotalStress={Math.max(0, scores.reduce((sum, s) => sum + s.totalScore, 0) - recoveryPtsTotal)}
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1">
            Score history
          </span>
          {sortedScores.map((score, i) => {
            const isLatest       = i === 0;
            const displayCheckIn = isLatest ? checkInValue : score.checkInValue;
            const displayTotal   = isLatest
              ? Math.min(100, score.calendarPts + Math.round(checkInValue * 0.5))
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
