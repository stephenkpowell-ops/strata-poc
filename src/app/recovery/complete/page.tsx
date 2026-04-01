'use client';

/**
 * src/app/recovery/complete/page.tsx
 *
 * Session complete screen — Step 25.
 *
 * Logs the completed recovery session to the store automatically
 * when the page loads (via useEffect on mount). This increments
 * completedSessions and adds −6 pts to recoveryPtsTotal in the store,
 * which flows through to the history page cumulative drivers.
 *
 * Uses a ref to ensure the session is only logged once even if the
 * component re-renders.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStrata } from '@/lib/store';

export default function CompletePage() {
  const { logRecoverySession, completedSessions } = useStrata();
  const logged = useRef(false);

  // Log the session once on mount
  useEffect(() => {
    if (!logged.current) {
      logged.current = true;
      logRecoverySession();
    }
  }, [logRecoverySession]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white items-center justify-center px-6 gap-8">

      {/* Check mark */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-950 border border-emerald-700">
        <svg
          width="36" height="36" viewBox="0 0 24 24"
          fill="none" stroke="#34d399"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
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
        {completedSessions > 1 && (
          <span className="text-xs text-emerald-600 mt-1">
            {completedSessions} sessions today · −{completedSessions * 6} pts total
          </span>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3 w-full">
        <Link
          href="/home"
          className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-2xl py-4 transition-colors"
        >
          Return to Dashboard
        </Link>
        <Link
          href="/recovery"
          className="w-full flex items-center justify-center border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-medium text-sm rounded-2xl py-3.5 transition-colors"
        >
          Start another session
        </Link>
      </div>

    </div>
  );
}
