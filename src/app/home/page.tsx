'use client';

/**
 * src/app/home/page.tsx
 *
 * Home screen — hero stress score, trial progress bar, burnout alert banner.
 *
 * Current state (Steps 15, 16, 17):
 *   Step 15 — ScoreCard with sparkline and rolling average
 *   Step 16 — Trial progress bar showing days remaining from FIXTURE_USER
 *   Step 17 — Burnout alert banner when rollingAvg7d > 70
 *
 * Step still to come:
 *   Step 18 — Navigation tab bar
 */

import { useStrata } from '@/lib/store';
import ScoreCard from '@/components/ScoreCard';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function daysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const ms  = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function trialProgressPercent(
  trialStartedAt: Date | null,
  trialEndsAt:   Date | null,
  totalDays = 7
): number {
  if (!trialStartedAt || !trialEndsAt) return 0;
  const elapsed = Date.now() - new Date(trialStartedAt).getTime();
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

      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Free Trial
        </span>
        <span className="text-xs font-medium text-zinc-400">
          {remaining} {remaining === 1 ? 'day' : 'days'} remaining
        </span>
      </div>

      {/* Progress track */}
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Sub-label */}
      <span className="text-xs text-zinc-600">
        Keep your data — continue after day 7
      </span>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BURNOUT ALERT BANNER
// ─────────────────────────────────────────────────────────────────────────────

function BurnoutAlertBanner({ rollingAvg }: { rollingAvg: number }) {
  // Only render when rolling average exceeds threshold
  if (rollingAvg <= 70) return null;

  return (
    <div className="flex items-start gap-3 bg-amber-950 border border-amber-800 rounded-2xl p-4">

      {/* Pulsing dot */}
      <div className="relative flex-shrink-0 mt-0.5">
        <span className="flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
          Performance Degradation Alert
        </span>
        <span className="text-sm text-amber-200 leading-snug">
          Your recovery rate hasn&#39;t kept up with load. The window to correct it is now.
        </span>
        <span className="text-xs text-amber-600 mt-0.5">
          7-day avg {rollingAvg} · threshold 70
        </span>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { scores, user } = useStrata();

  // Most recent score record
  const latest = scores[scores.length - 1];

  // Last 7 scores for the sparkline, oldest first
  const last7 = scores.slice(-7).map(s => s.totalScore);

  if (!latest) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-zinc-950 text-zinc-600 text-sm">
        No score data available
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* Page header */}
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

        {/* Step 15 — Score card */}
        <ScoreCard
          currentScore={latest.totalScore}
          rollingAvg={latest.rollingAvg7d}
          recentScores={last7}
        />

        {/* Step 17 — Burnout alert banner (above trial bar — higher urgency) */}
        <BurnoutAlertBanner rollingAvg={latest.rollingAvg7d} />

        {/* Step 16 — Trial progress bar */}
        <TrialProgressBar
          trialStartedAt={user.trialStartedAt}
          trialEndsAt={user.trialEndsAt}
        />

      </div>

    </div>
  );
}
