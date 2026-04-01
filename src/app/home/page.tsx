'use client';

/**
 * src/app/home/page.tsx
 *
 * Home screen.
 *
 * Burnout banner fires when the PEAK rolling avg in the last 7 days
 * exceeds 70 — not just today's rolling avg. This ensures the banner
 * stays visible during the recovery period after a high-load week.
 */

import Link from 'next/link';
import { useStrata } from '@/lib/store';
import ScoreCard from '@/components/ScoreCard';
import CheckInCard from '@/components/CheckInCard';
import ForecastCard from '@/components/ForecastCard';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BURNOUT_THRESHOLD = 70;

// POC anchor date — avoids Date.now() hydration mismatches
const POC_NOW = new Date('2025-03-25T12:00:00').getTime();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function daysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - POC_NOW;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function trialProgressPercent(
  trialStartedAt: Date | null,
  trialEndsAt:    Date | null,
): number {
  if (!trialStartedAt || !trialEndsAt) return 0;
  const elapsed = POC_NOW - new Date(trialStartedAt).getTime();
  const total   = new Date(trialEndsAt).getTime() - new Date(trialStartedAt).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIAL PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

function TrialProgressBar({
  trialStartedAt,
  trialEndsAt,
}: {
  trialStartedAt: Date | null;
  trialEndsAt:    Date | null;
}) {
  const remaining = daysRemaining(trialEndsAt);
  const progress  = trialProgressPercent(trialStartedAt, trialEndsAt);

  return (
    <div className="flex flex-col gap-2 bg-zinc-900 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Free Trial
        </span>
        <span className="text-xs font-medium text-zinc-400">
          {remaining} {remaining === 1 ? 'day' : 'days'} remaining
        </span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-zinc-600">
        Keep your data — continue after day 7
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BURNOUT ALERT BANNER
// Fires when the PEAK rolling avg in the last 7 scores exceeds threshold.
// This keeps the banner visible during recovery after a high-load week.
// ─────────────────────────────────────────────────────────────────────────────

function BurnoutAlertBanner({
  peakRollingAvg,
  currentRollingAvg,
}: {
  peakRollingAvg:    number;
  currentRollingAvg: number;
}) {
  if (peakRollingAvg <= BURNOUT_THRESHOLD) return null;

  const isRecovering = currentRollingAvg <= BURNOUT_THRESHOLD;

  return (
    <Link
      href="/burnout"
      className={`flex items-start gap-3 border rounded-2xl p-4 transition-colors ${
        isRecovering
          ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800'
          : 'bg-amber-950 border-amber-800 hover:bg-amber-900'
      }`}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <span className="flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isRecovering ? 'bg-zinc-400' : 'bg-amber-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isRecovering ? 'bg-zinc-400' : 'bg-amber-400'
          }`} />
        </span>
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <span className={`text-xs font-semibold uppercase tracking-wider ${
          isRecovering ? 'text-zinc-400' : 'text-amber-400'
        }`}>
          {isRecovering ? 'Recovery In Progress' : 'Performance Degradation Alert'}
        </span>
        <span className={`text-sm leading-snug ${
          isRecovering ? 'text-zinc-300' : 'text-amber-200'
        }`}>
          {isRecovering
            ? 'Your rolling average is recovering. Keep the recovery sessions going.'
            : "Your recovery rate hasn\u2019t kept up with load. The window to correct it is now."
          }
        </span>
        <span className={`text-xs mt-0.5 ${
          isRecovering ? 'text-zinc-600' : 'text-amber-600'
        }`}>
          Peak 7-day avg {peakRollingAvg} · current {currentRollingAvg} · threshold {BURNOUT_THRESHOLD} · Tap for details →
        </span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { scores, user, checkInValue, setCheckIn, forecastScores } = useStrata();

  const latest = scores[scores.length - 1];
  const last7  = scores.slice(-7).map(s => s.totalScore);

  if (!latest) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-zinc-950 text-zinc-600 text-sm">
        No score data available
      </div>
    );
  }

  // Peak rolling avg across last 7 score records
  const peakRollingAvg    = Math.max(...scores.slice(-7).map(s => s.rollingAvg7d));
  const currentRollingAvg = latest.rollingAvg7d;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Strata
          </span>
          <span className="text-xl font-bold text-white">
            Your Performance
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 pb-8">

        <ScoreCard
          currentScore={latest.totalScore}
          calendarPts={latest.calendarPts}
          checkInValue={checkInValue}
          rollingAvg={latest.rollingAvg7d}
          recentScores={last7}
        />

        <CheckInCard
          currentValue={checkInValue}
          onSelect={setCheckIn}
        />

        <ForecastCard forecastScores={forecastScores} />

        <BurnoutAlertBanner
          peakRollingAvg={peakRollingAvg}
          currentRollingAvg={currentRollingAvg}
        />

        <TrialProgressBar
          trialStartedAt={user.trialStartedAt}
          trialEndsAt={user.trialEndsAt}
        />

      </div>

    </div>
  );
}
