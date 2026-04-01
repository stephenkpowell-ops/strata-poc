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
 * totalScore immediately.
 *
 * Default check-in is 0 (Zero) — the user must explicitly log their
 * check-in each day. This reflects the intended UX where the check-in
 * is a deliberate daily input, not pre-filled.
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
  // Default check-in is 0 (Zero) — user must explicitly log each day
  const [checkInValue, setCheckInValue] = useState<number>(0);

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
