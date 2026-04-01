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
 *   - scores:         historical score records (score_0 through score_8, Mar 17–25)
 *   - forecastScores: forecast score records (score_9 through score_11, Mar 26–28)
 *                     These have checkInValue: 0 and totalScore = calendarPts
 *                     since they are future days with no check-in yet.
 *
 * setCheckIn(value)     — updates check-in, recalculates totalScore for today
 * logRecoverySession()  — increments session count and adds −6 pts
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { computeDailyScore } from './StressEngine';
import type { DailyScoreResult } from './StressEngine';
import type { User, StressScore, CalendarEvent } from './interfaces/types';
import { FIXTURE_USER, FIXTURE_SCORES, FIXTURE_EVENTS } from './mocks';

const RECOVERY_PTS_PER_SESSION   = 6;
const FIXTURE_COMPLETED_SESSIONS = 4;
const FIXTURE_RECOVERY_PTS       = FIXTURE_COMPLETED_SESSIONS * RECOVERY_PTS_PER_SESSION;

// Historical scores end at score_8 (March 25)
// Forecast scores start at score_9 (March 26)
const HISTORY_COUNT = 9;

// ─────────────────────────────────────────────────────────────────────────────
// STORE SHAPE
// ─────────────────────────────────────────────────────────────────────────────

interface StrataState {
  user:               User;
  scores:             StressScore[];
  forecastScores:     StressScore[];
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
  const [checkInValue,      setCheckInValue]      = useState<number>(0);
  const [completedSessions, setCompletedSessions] = useState<number>(FIXTURE_COMPLETED_SESSIONS);
  const [recoveryPtsTotal,  setRecoveryPtsTotal]  = useState<number>(FIXTURE_RECOVERY_PTS);

  // Split fixture scores into historical and forecast
  const historicalFixture = FIXTURE_SCORES.slice(0, HISTORY_COUNT);
  const forecastFixture   = FIXTURE_SCORES.slice(HISTORY_COUNT);

  // Historical scores — most recent day gets live check-in
  const scores: StressScore[] = historicalFixture.map((s, i) => {
    if (i !== historicalFixture.length - 1) return s;
    return {
      ...s,
      checkInValue,
      totalScore: Math.min(100, checkInValue + s.calendarPts),
    };
  });

  // Forecast scores — unchanged (future days, no check-in)
  const forecastScores: StressScore[] = forecastFixture;

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
    user: FIXTURE_USER,
    scores,
    forecastScores,
    events:       FIXTURE_EVENTS,
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
