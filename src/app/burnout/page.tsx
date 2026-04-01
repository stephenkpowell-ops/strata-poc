'use client';

/**
 * src/app/burnout/page.tsx
 *
 * Burnout Alert Screen — steps 19, 20, 21, 22.
 *
 * Updates:
 *   - "Sessions this week" reads from store.completedSessions (live)
 *   - "TOP LOAD DRIVERS" renamed to "TODAY'S LOAD DRIVERS"
 *   - Check-in row added to load drivers showing today's check-in value
 */

import Link from 'next/link';
import { useStrata } from '@/lib/store';
import Sparkline from '@/components/Sparkline';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function countConsecutiveHighDays(scores: number[], threshold: number): number {
  let count = 0;
  for (let i = scores.length - 1; i >= 0; i--) {
    if (scores[i] >= threshold) count++;
    else break;
  }
  return count;
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
// METRIC CARD
// ─────────────────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label:      string;
  value:      string;
  sub:        string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl p-4 ${
      highlight ? 'bg-amber-950 border border-amber-800' : 'bg-zinc-800'
    }`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span className={`text-2xl font-bold tabular-nums ${
        highlight ? 'text-amber-400' : 'text-white'
      }`}>
        {value}
      </span>
      <span className="text-xs text-zinc-500">{sub}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const BURNOUT_THRESHOLD = 70;

export default function BurnoutPage() {
  const { scores, completedSessions, checkInValue } = useStrata();

  const latest      = scores[scores.length - 1];
  const last7       = scores.slice(-7);
  const last7Totals = last7.map(s => s.totalScore);
  const rollingAvg  = latest?.rollingAvg7d ?? 0;

  const consecutiveDays = countConsecutiveHighDays(
    scores.map(s => s.totalScore),
    BURNOUT_THRESHOLD
  );

  // Today's calendar pts (March 25)
  const calendarPtsToday = latest?.calendarPts ?? 0;

  // Peak day label for sparkline insight
  const peakScore = Math.max(...last7Totals);
  const peakDay   = last7[last7Totals.indexOf(peakScore)];
  const peakDate  = peakDay
    ? new Date(peakDay.date).toLocaleDateString('en-US', { weekday: 'long' })
    : 'Wednesday';

  // Load driver bar widths — max across all three drivers
  const maxDriver = Math.max(calendarPtsToday, checkInValue, 1);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* ── Hero section ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 bg-zinc-950 px-6 pt-12 pb-6 border-b border-zinc-800">
        <Link
          href="/home"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-fit"
        >
          ← Dashboard
        </Link>
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Performance Degradation Alert
        </span>
        <h1 className="text-xl font-bold text-white leading-snug">
          Your recovery rate hasn&#39;t kept up with load for {consecutiveDays} {consecutiveDays === 1 ? 'day' : 'days'}.
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          This is the pattern that precedes burnout. It doesn&#39;t mean you&#39;re
          there — it means the window to correct it is now.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-6 py-6">

        {/* ── Three metric cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label="7-day avg"
            value={String(rollingAvg)}
            sub={`threshold ${BURNOUT_THRESHOLD}`}
            highlight={rollingAvg > BURNOUT_THRESHOLD}
          />
          <MetricCard
            label="High days"
            value={String(consecutiveDays)}
            sub="consecutive"
            highlight={consecutiveDays >= 3}
          />
          <MetricCard
            label="Sessions"
            value={String(completedSessions)}
            sub="this week"
          />
        </div>

        {/* ── Trend sparkline ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 bg-zinc-900 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              7-day trend
            </span>
            <span className="text-xs text-zinc-600">
              — threshold {BURNOUT_THRESHOLD}
            </span>
          </div>
          <Sparkline scores={last7Totals} height={72} threshold={BURNOUT_THRESHOLD} />
          <p className="text-xs text-zinc-400 leading-relaxed pt-1">
            {peakDate} was the peak. Back-to-back meetings with no buffer added significant load in a single morning.
          </p>
        </div>

        {/* ── Today's load drivers ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 bg-zinc-900 rounded-2xl p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Today&#39;s Load Drivers
          </span>
          <div className="flex flex-col gap-3 pt-1">

            {/* Work meetings */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">Work meetings</span>
                <span className="text-sm font-semibold text-orange-400">
                  +{calendarPtsToday} pts
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full"
                  style={{ width: `${Math.round((calendarPtsToday / maxDriver) * 100)}%` }}
                />
              </div>
            </div>

            {/* Check-in */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">
                  Check-in
                  <span className="text-zinc-600 text-xs ml-1.5">
                    ({getCheckInLabel(checkInValue)})
                  </span>
                </span>
                <span className={`text-sm font-semibold ${
                  checkInValue === 0 ? 'text-zinc-600' : 'text-indigo-400'
                }`}>
                  {checkInValue === 0 ? '—' : `+${checkInValue} pts`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full"
                  style={{ width: `${Math.round((checkInValue / maxDriver) * 100)}%` }}
                />
              </div>
              {checkInValue === 0 && (
                <span className="text-[10px] text-zinc-600">
                  Log your check-in on the dashboard
                </span>
              )}
            </div>

          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <Link
          href="/recovery"
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-2xl py-4 transition-colors"
        >
          Start Recovery Session →
        </Link>

        <p className="text-xs text-zinc-600 text-center">
          A 5-minute reset now reduces tomorrow&#39;s baseline load.
        </p>

      </div>

    </div>
  );
}
