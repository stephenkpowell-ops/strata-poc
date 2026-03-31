'use client';

/**
 * src/app/home/page.tsx
 *
 * Home screen — hero stress score with sparkline.
 *
 * Current state (Step 15 — stress score card):
 *   - ScoreCard renders the current score, status label, sparkline,
 *     and 7-day rolling average from fixture data
 *   - Most recent score (score_13, totalScore: 100) is displayed
 *   - Last 7 scores feed the sparkline
 *
 * Steps still to come:
 *   Step 16 — Trial progress bar
 *   Step 17 — Burnout alert banner
 *   Step 18 — Navigation
 */

import { useStrata } from '@/lib/store';
import ScoreCard from '@/components/ScoreCard';

export default function HomePage() {
  const { scores } = useStrata();

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

      {/* Score card — step 15 */}
      <div className="px-6">
        <ScoreCard
          currentScore={latest.totalScore}
          rollingAvg={latest.rollingAvg7d}
          recentScores={last7}
        />
      </div>

      {/* Placeholder for trial progress bar — step 16 */}
      <div className="px-6 mt-4">
        <div className="h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
          <span className="text-xs text-zinc-600">Trial progress bar — step 16</span>
        </div>
      </div>

      {/* Placeholder for burnout alert banner — step 17 */}
      <div className="px-6 mt-4">
        <div className="h-12 rounded-xl bg-zinc-900 flex items-center justify-center">
          <span className="text-xs text-zinc-600">Burnout alert banner — step 17</span>
        </div>
      </div>

    </div>
  );
}
