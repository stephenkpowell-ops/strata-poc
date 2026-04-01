'use client';

/**
 * src/app/burnout/page.tsx
 *
 * Burnout Alert Screen — steps 19, 20, 21, 22.
 *
 * Updates:
 *   - "Sessions" metric card reads from store.completedSessions (last 7 days total)
 *   - Recovery row in load drivers reads from store.todayRecoveryPts (today only, starts at 0)
 *   - "TOP LOAD DRIVERS" renamed to "TODAY'S LOAD DRIVERS"
 *   - Check-in row added to load drivers showing today's check-in value
 */

import Link from 'next/link';
import { useStrata } from '@/lib/store';
import Sparkline from '@/components/Sparkline';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function countHighDaysInWindow(scores: number[], threshold: number, windowSize = 7): number {
  return scores
    .slice(-windowSize)
    .filter(s => s > threshold)
    .length;
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
  const { scores, completedSessions, todaySessions, todayRecoveryPts, checkInValue, dailyResult } = useStrata();

  const latest              = scores[scores.length - 1];
  const calendarPtsToday    = latest?.calendarPts ?? 0;
  // Check-in contribution under the half-weight model
  // calendarPts=0 → full check-in; calendarPts>0 → half check-in
  const checkInContribution = calendarPtsToday === 0
    ? checkInValue
    : Math.round(checkInValue * 0.5);
  const todayTotal          = Math.min(100, calendarPtsToday + checkInContribution);
  const last7       = scores.slice(-7);
  const last7Totals = last7.map(s => s.totalScore);
  const rollingAvg  = latest?.rollingAvg7d ?? 0;

  const consecutiveDays = countHighDaysInWindow(
    scores.map(s => s.totalScore),
    BURNOUT_THRESHOLD
  );

  // dailyResult is now scoped to today's events only (see store.tsx)
  // topDrivers uses 'Work meetings' as the key for work events (see StressEngine.ts)
  const workDriver     = dailyResult.topDrivers.find(d => d.category === 'Work meetings');
  const personalDriver = dailyResult.topDrivers.find(d => d.category === 'active_personal');
  const personalPts    = personalDriver?.totalPts ?? 0;
  // workPts = calendar total minus personal pts (avoids relying on the key lookup fallback)
  const workPts        = Math.max(0, calendarPtsToday - personalPts);

  // Peak day label for sparkline insight
  const peakScore = Math.max(...last7Totals);
  const peakDay   = last7[last7Totals.indexOf(peakScore)];
  const peakDate  = peakDay
    ? new Date(peakDay.date).toLocaleDateString('en-US', { weekday: 'long' })
    : 'Wednesday';

  // Load driver bar widths — max across all three drivers
  const maxDriver = Math.max(workPts, personalPts, checkInContribution, todayTotal, 1);

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
            sub="last 7 days"
            highlight={consecutiveDays >= 3}
          />
          <MetricCard
            label="Sessions"
            value={String(completedSessions)}
            sub="last 7 days"
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
                <span className="text-sm font-semibold text-indigo-400">
                  +{workPts} pts
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full"
                  style={{ width: `${Math.round((workPts / maxDriver) * 100)}%` }}
                />
              </div>
            </div>

            {/* Active personal */}
            {personalPts > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Active personal</span>
                  <span className="text-sm font-semibold text-indigo-400">
                    +{personalPts} pts
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${Math.round((personalPts / maxDriver) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Check-in contribution */}
            {checkInContribution > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">
                    Check-in
                    <span className="text-zinc-600 text-xs ml-1.5">(×0.5 weight)</span>
                  </span>
                  <span className="text-sm font-semibold text-zinc-400">
                    +{checkInContribution} pts
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-500 rounded-full"
                    style={{ width: `${Math.round((checkInContribution / maxDriver) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {checkInContribution === 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Check-in</span>
                <span className="text-xs text-zinc-600">— not logged</span>
              </div>
            )}

            {/* Recovery — today's sessions */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300">
                  Recovery
                  {todaySessions > 0 && (
                    <span className="text-zinc-600 text-xs ml-1.5">({todaySessions} {todaySessions === 1 ? 'session' : 'sessions'} today)</span>
                  )}
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  {todayRecoveryPts > 0 ? `−${todayRecoveryPts} pts` : '—'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                {todayRecoveryPts > 0 && (
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${Math.round((todayRecoveryPts / maxDriver) * 100)}%` }}
                  />
                )}
              </div>
              {todayRecoveryPts === 0 && (
                <span className="text-[10px] text-zinc-600">
                  Complete a Breathing Reset to reduce today&#39;s load
                </span>
              )}
            </div>

            {/* Total stress for today */}
            <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-200">Total today</span>
                <span className={`text-sm font-bold tabular-nums ${
                  todayTotal >= 75 ? 'text-orange-400' :
                  todayTotal >= 50 ? 'text-indigo-400' : 'text-emerald-400'
                }`}>
                  {todayTotal} pts
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    todayTotal >= 75 ? 'bg-orange-400' :
                    todayTotal >= 50 ? 'bg-indigo-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.round((todayTotal / maxDriver) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-600">
                {workPts} work + {personalPts} personal + {checkInContribution} check-in − {todayRecoveryPts} recovery = {Math.max(0, todayTotal - todayRecoveryPts)} pts
              </p>
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
