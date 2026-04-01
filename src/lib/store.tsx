'use client';

/**
 * store.tsx
 *
 * Client-side data store for the Strata POC.
 *
 * Wraps fixture data from mocks.ts and the StressEngine output in a React
 * context so every screen can access them via the useStrata() hook without
 * prop drilling.
 *
 * The store supports a mutable check-in value. Calling setCheckIn()
 * updates the check-in for the most recent score record and recomputes
 * totalScore immediately. This allows the home screen check-in card to
 * update the score in real time.
 *
 * Usage:
 *
 *   // 1. Wrap the root layout (src/app/layout.tsx):
 *   import { StrataProvider } from '@/lib/store';
 *   <StrataProvider>{children}</StrataProvider>
 *
 *   // 2. Use in any client component:
 *   import { useStrata } from '@/lib/store';
 *   const { user, scores, events, dailyResult, checkInValue, setCheckIn } = useStrata();
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { computeDailyScore } from './StressEngine';
import type { DailyScoreResult } from './StressEngine';
import type { User, StressScore, CalendarEvent } from './interfaces/types';
import { FIXTURE_USER, FIXTURE_SCORES, FIXTURE_EVENTS } from './mocks';

// ─────────────────────────────────────────────────────────────────────────────
// STORE SHAPE
// ─────────────────────────────────────────────────────────────────────────────

interface StrataState {
  user:         User;
  scores:       StressScore[];
  events:       CalendarEvent[];
  dailyResult:  DailyScoreResult;
  checkInValue: number;
  setCheckIn:   (value: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const StrataContext = createContext<StrataState | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function StrataProvider({ children }: { children: ReactNode }) {
  // Check-in value for the most recent day — mutable via setCheckIn
  const [checkInValue, setCheckInValue] = useState<number>(
    FIXTURE_SCORES[FIXTURE_SCORES.length - 1]?.checkInValue ?? 50
  );

  // Scores with the most recent record updated to reflect current check-in
  const scores: StressScore[] = FIXTURE_SCORES.map((s, i) => {
    if (i !== FIXTURE_SCORES.length - 1) return s;
    return {
      ...s,
      checkInValue,
      totalScore: Math.min(100, checkInValue + s.calendarPts),
    };
  });

  // Recompute daily result whenever check-in changes
  const dailyResult: DailyScoreResult = computeDailyScore({
    events:        FIXTURE_EVENTS,
    calendarPrefs: [
      { includeInScoring: true, contextSwitchPenalties: true, recoveryEventsReduce: true },
    ],
    checkInValue,
  });

  const setCheckIn = (value: number) => setCheckInValue(value);

  const state: StrataState = {
    user:   FIXTURE_USER,
    scores,
    events: FIXTURE_EVENTS,
    dailyResult,
    checkInValue,
    setCheckIn,
  };

  return (
    <StrataContext.Provider value={state}>
      {children}
    </StrataContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useStrata(): StrataState {
  const ctx = useContext(StrataContext);
  if (!ctx) throw new Error('useStrata() must be called inside <StrataProvider>');
  return ctx;
}
