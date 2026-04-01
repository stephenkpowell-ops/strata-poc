'use client';

/**
 * store.tsx
 *
 * Client-side data store for the Strata POC.
 *
 * State:
 *   - checkInValue:      mutable daily check-in (default 0 / Zero)
 *   - completedSessions: count of breathing reset sessions (pre-seeded at 4)
 *   - recoveryPtsTotal:  cumulative pts reduced (pre-seeded at 24 — 4 × −6 pts)
 *
 * Pre-seeded recovery data represents 4 sessions completed across the
 * 9-day fixture period (Mar 17–24), giving the history screen a realistic
 * baseline before the user completes any additional sessions.
 *
 * setCheckIn(value)     — updates check-in, recalculates totalScore
 * logRecoverySession()  — increments session count and adds −6 pts
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { computeDailyScore } from './StressEngine';
import type { DailyScoreResult } from './StressEngine';
import type { User, StressScore, CalendarEvent } from './interfaces/types';
import { FIXTURE_USER, FIXTURE_SCORES, FIXTURE_EVENTS } from './mocks';

const RECOVERY_PTS_PER_SESSION    = 6;
const FIXTURE_COMPLETED_SESSIONS  = 4;
const FIXTURE_RECOVERY_PTS        = FIXTURE_COMPLETED_SESSIONS * RECOVERY_PTS_PER_SESSION; // 24

// ─────────────────────────────────────────────────────────────────────────────
// STORE SHAPE
// ─────────────────────────────────────────────────────────────────────────────

interface StrataState {
  user:               User;
  scores:             StressScore[];
  events:             CalendarEvent[];
  dailyResult:        DailyScoreResult;
  checkInValue:       number;
  setCheckIn:         (value: number) => void;
  completedSessions:  number;
  recoveryPtsTotal:   number;
  logRecoverySession: () => void;
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
  const [checkInValue,      setCheckInValue]      = useState<number>(0);

  // Pre-seeded with 4 fixture sessions (−24 pts) representing sessions
  // completed across Mar 17–24. New sessions add on top of this baseline.
  const [completedSessions, setCompletedSessions] = useState<number>(FIXTURE_COMPLETED_SESSIONS);
  const [recoveryPtsTotal,  setRecoveryPtsTotal]  = useState<number>(FIXTURE_RECOVERY_PTS);

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

  const logRecoverySession = () => {
    setCompletedSessions(prev => prev + 1);
    setRecoveryPtsTotal(prev => prev + RECOVERY_PTS_PER_SESSION);
  };

  const state: StrataState = {
    user: FIXTURE_USER,
    scores,
    events: FIXTURE_EVENTS,
    dailyResult,
    checkInValue,
    setCheckIn,
    completedSessions,
    recoveryPtsTotal,
    logRecoverySession,
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
