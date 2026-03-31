'use client';

/**
 * src/app/recovery/session/page.tsx
 *
 * Breathing Reset session screen — Step 24.
 *
 * Box breathing: 4-count inhale, 4-count hold, 4-count exhale, 4-count hold.
 * 4 rounds total. Each count is 1 second.
 *
 * The animated ring expands on inhale and contracts on exhale using
 * CSS transitions driven by phase state. No animation library needed.
 *
 * After round 4 completes, automatically routes to /recovery/complete.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PHASES = [
  { label: 'Inhale',  duration: 4, expand: true  },
  { label: 'Hold',    duration: 4, expand: true  },
  { label: 'Exhale',  duration: 4, expand: false },
  { label: 'Hold',    duration: 4, expand: false },
];

const TOTAL_ROUNDS = 4;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function SessionPage() {
  const router = useRouter();

  const [round,      setRound]      = useState(1);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [count,      setCount]      = useState<number>(PHASES[0].duration);
  const [started,    setStarted]    = useState(false);
  const [completed,  setCompleted]  = useState(false);

  const phase = PHASES[phaseIndex];

  // Advance through phases and rounds
  const tick = useCallback(() => {
    setCount(prev => {
      if (prev > 1) return prev - 1;

      // This count is done — move to next phase
      const nextPhaseIndex = (phaseIndex + 1) % PHASES.length;
      const isLastPhase    = phaseIndex === PHASES.length - 1;

      if (isLastPhase) {
        if (round >= TOTAL_ROUNDS) {
          // All rounds complete
          setCompleted(true);
          return 0;
        }
        setRound(r => r + 1);
      }

      setPhaseIndex(nextPhaseIndex);
      return PHASES[nextPhaseIndex].duration;
    });
  }, [phaseIndex, round]);

  // Timer — runs every second once started
  useEffect(() => {
    if (!started || completed) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [started, completed, tick]);

  // Navigate to complete screen when done
  useEffect(() => {
    if (completed) {
      const id = setTimeout(() => router.push('/recovery/complete'), 800);
      return () => clearTimeout(id);
    }
  }, [completed, router]);

  const ringExpanded = phase.expand;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white items-center justify-between py-16 px-6">

      {/* Round indicator */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Breathing Reset
        </span>
        <div className="flex gap-2 mt-2">
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${
                i < round - 1
                  ? 'bg-indigo-400'
                  : i === round - 1
                    ? 'bg-indigo-600'
                    : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-zinc-600 mt-1">
          Round {round} of {TOTAL_ROUNDS}
        </span>
      </div>

      {/* Animated breathing ring */}
      <div className="flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div
            className={`rounded-full border-2 border-indigo-500 opacity-20 transition-all duration-[4000ms] ease-in-out ${
              ringExpanded ? 'w-72 h-72' : 'w-44 h-44'
            }`}
          />
          {/* Inner ring */}
          <div
            className={`absolute rounded-full border-2 border-indigo-400 transition-all duration-[4000ms] ease-in-out ${
              ringExpanded ? 'w-56 h-56' : 'w-36 h-36'
            }`}
          />
          {/* Center content */}
          <div className="absolute flex flex-col items-center gap-1">
            {!started ? (
              <span className="text-zinc-400 text-sm">Ready</span>
            ) : completed ? (
              <span className="text-emerald-400 text-sm font-semibold">Done</span>
            ) : (
              <>
                <span className="text-3xl font-bold tabular-nums text-white">
                  {count}
                </span>
                <span className="text-sm font-medium text-indigo-300">
                  {phase.label}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Phase guide */}
        {started && !completed && (
          <div className="flex gap-4">
            {PHASES.map((p, i) => (
              <span
                key={i}
                className={`text-xs transition-colors ${
                  i === phaseIndex ? 'text-indigo-300 font-semibold' : 'text-zinc-700'
                }`}
              >
                {p.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Start / cancel */}
      <div className="flex flex-col items-center gap-3 w-full">
        {!started ? (
          <button
            onClick={() => setStarted(true)}
            className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-2xl py-4 transition-colors"
          >
            Begin
          </button>
        ) : (
          <button
            onClick={() => router.push('/recovery')}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Cancel session
          </button>
        )}
      </div>

    </div>
  );
}
