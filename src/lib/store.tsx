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
 * Read-only:
 *   - forecast: next 5 days of pre-computed calendar stress from FIXTURE_FORECAST
 *
 * setCheckIn(value)     — updates check-in, recalculates totalScore
 * logRecoverySession()  — increments session count and adds −6 pts
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { computeDailyScore } from './StressEngine';
import type { DailyScoreResult } from './StressEngine';
import type { User, StressScore, CalendarEvent } from './interfaces/types';
import { FIXTURE_USER, FIXTURE_SCORES, FIXTURE_EVENTS, FIXTURE_FORECAST } from './mocks';
import type { ForecastDay } from './mocks';

const RECOVERY_PTS_PER_SESSION   = 6;
const FIXTURE_COMPLETED_SESSIONS = 4;
const FIXTURE_RECOVERY_PTS       = FIXTURE_COMPLETED_SESSIONS * RECOVERY_PTS_PER_SESSION;

// ─────────────────────────────────────────────────────────────────────────────
// STORE SHAPE
// ─────────────────────────────────────────────────────────────────────────────

interface StrataState {
  user:               User;
  scores:             StressScore[];
  events:             CalendarEvent[];
  dailyResult:        DailyScoreResult;
  forecast:           ForecastDay[];
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
  const [checkInValue,      setCheckInValue]      = useState<number>(0);
  const [completedSessions, setCompletedSessions] = useState<number>(FIXTURE_COMPLETED_SESSIONS);
  const [recoveryPtsTotal,  setRecoveryPtsTotal]  = useState<number>(FIXTURE_RECOVERY_PTS);

  const scores: StressScore[] = FIXTURE_SCORES.map((s, i) => {
    if (i !== FIXTURE_SCORES.length - 1) return s;
    return {
      ...s,
      checkInValue,
      totalScore: Math.min(100, checkInValue + s.calendarPts),
    };
  });

  const dailyResult: DailyScoreResult = computeDailyScore({
    events:        FIXTURE_EVENTS,
    calendarPrefs: [
      { includeInScoring: true, contextSwitchPenalties: true, recoveryEventsReduce: true },
    ],
    checkInValue,
  });

  const setCheckIn         = (value: number) => setCheckInValue(value);
  const logRecoverySession = () => {
    setCompletedSessions(prev => prev + 1);
    setRecoveryPtsTotal(prev => prev + RECOVERY_PTS_PER_SESSION);
  };

  const state: StrataState = {
    user:   FIXTURE_USER,
    scores,
    events: FIXTURE_EVENTS,
    dailyResult,
    forecast: FIXTURE_FORECAST,
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
