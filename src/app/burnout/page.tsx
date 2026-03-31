'use client';

/**
 * src/app/burnout/page.tsx
 *
 * Burnout Alert Screen — steps 19, 20, 21, 22.
 *
 * Entry points:
 *   - Tapping the amber banner on the home screen
 *   - Tapping the secondary banner on the calendar screen (step 13, future)
 *   - Push notification (MVP — not POC)
 *
 * Screen sections:
 *   Step 19 — Obsidian hero with eyebrow, headline, sub-copy
 *   Step 20 — Three metric cards: 7-day avg, consecutive high days, sessions
 *   Step 21 — 7-day trend sparkline with threshold line
 *   Step 22 — "Start Recovery Session →" CTA routing to /recovery
 *
 * All data comes from the Strata store (fixture data for POC).
 */

import Link from 'next/link';
import { useStrata } from '@/lib/store';
import Sparkline from '@/components/Sparkline';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Count how many of the most recent scores exceed the threshold consecutively */
function countConsecutiveHighDays(scores: number[], threshold: number): number {
  let count = 0;
  for (let i = scores.length - 1; i >= 0; i--) {
    if (scores[i] >= threshold) {
      count++;
    } else {
      break;
    }
  }
  return count;
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
  const { scores } = useStrata();

  const latest        = scores[scores.length - 1];
  const last7         = scores.slice(-7);
  const last7Totals   = last7.map(s => s.totalScore);
  const rollingAvg    = latest?.rollingAvg7d ?? 0;
  const consecutiveDays = countConsecutiveHighDays(
    scores.map(s => s.totalScore),
    BURNOUT_THRESHOLD
  );

  // Recovery sessions this week — fixture data has none logged yet
  // Will be populated from store once recovery sessions are tracked in step 23
  const sessionsThisWeek = 0;

  // Insight line below the sparkline
  const peakScore = Math.max(...last7Totals);
  const peakDay   = last7[last7Totals.indexOf(peakScore)];
  const peakDate  = peakDay
    ? new Date(peakDay.date).toLocaleDateString('en-US', { weekday: 'long' })
    : 'Tuesday';

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* ── Step 19 — Hero section ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 bg-zinc-950 px-6 pt-12 pb-6 border-b border-zinc-800">

        {/* Back link */}
        <Link
          href="/home"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-fit"
        >
          ← Dashboard
        </Link>

        {/* Eyebrow */}
        <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          Performance Degradation Alert
        </span>

        {/* Headline */}
        <h1 className="text-xl font-bold text-white leading-snug">
          Your recovery rate hasn&#39;t kept up with load for {consecutiveDays} {consecutiveDays === 1 ? 'day' : 'days'}.
        </h1>

        {/* Sub-copy */}
        <p className="text-sm text-zinc-400 leading-relaxed">
          This is the pattern that precedes burnout. It doesn&#39;t mean you&#39;re
          there — it means the window to correct it is now.
        </p>

      </div>

      <div className="flex flex-col gap-4 px-6 py-6">

        {/* ── Step 20 — Three metric cards ───────────────────────────────── */}
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
            value={String(sessionsThisWeek)}
            sub="this week"
          />
        </div>

        {/* ── Step 21 — Trend sparkline ───────────────────────────────────── */}
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

        {/* Top load drivers */}
        <div className="flex flex-col gap-2 bg-zinc-900 rounded-2xl p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Top load drivers
          </span>
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">Work meetings</span>
              <span className="text-sm font-semibold text-orange-400">+22 pts</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 rounded-full" style={{ width: '79%' }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-zinc-300">Personal overlap</span>
              <span className="text-sm font-semibold text-indigo-400">+6 pts</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full" style={{ width: '21%' }} />
            </div>
          </div>
        </div>

        {/* ── Step 22 — CTA ───────────────────────────────────────────────── */}
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
