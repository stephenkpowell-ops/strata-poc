'use client';

/**
 * src/app/recovery/complete/page.tsx
 *
 * Session complete screen — Step 25.
 *
 * Shown after all 4 rounds of the Breathing Reset complete.
 * Displays the estimated score reduction (−6 pts) and a
 * "Return to Dashboard" button back to /home.
 */

import Link from 'next/link';

export default function CompletePage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white items-center justify-center px-6 gap-8">

      {/* Check mark */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-950 border border-emerald-700">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      {/* Message */}
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Session Complete
        </span>
        <h1 className="text-2xl font-bold text-white">
          Breathing Reset done.
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
          Your nervous system has had a chance to regulate. The effect builds over consistent sessions.
        </p>
      </div>

      {/* Score reduction estimate */}
      <div className="flex flex-col items-center gap-1 bg-emerald-950 border border-emerald-800 rounded-2xl px-8 py-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Estimated impact
        </span>
        <span className="text-3xl font-bold text-emerald-400 tabular-nums">
          −6 pts
        </span>
        <span className="text-xs text-emerald-700">
          reduction in tomorrow&#39;s baseline load
        </span>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 w-full">
        <Link
          href="/home"
          className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-2xl py-4 transition-colors"
        >
          Return to Dashboard
        </Link>
        <Link
          href="/recovery"
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Start another session
        </Link>
      </div>

    </div>
  );
}
