'use client';

/**
 * store.tsx
 *
 * Client-side data store for the Strata POC.
 *
 * Key fix: computeDailyScore is called with only today's events (March 25)
 * not all fixture events. This ensures dailyResult.scoredEvents and
 * dailyResult.topDrivers reflect today's load only, not the whole period.
 *
 * State:
 *   - checkInValue:      mutable daily check-in (default 0 / Zero)
 *   - completedSessions: count of breathing reset sessions (pre-seeded at 4)
 *   - recoveryPtsTotal:  cumulative pts reduced (pre-seeded at 24 — 4 × −6 pts)
 *
 * Read-only:
 *   - scores:         historical score records (score_0 through score_8, Mar 17–25)
 *   - forecastScores: forecast score records (score_9 through score_11, Mar 26–28)
 *   - events:         all fixture events (all days — used by calendar screen)
 *   - todayEvents:    only March 25 events (used by dailyResult scoring)
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { computeDailyScore } from './StressEngine';
import type { DailyScoreResult } from './StressEngine';
import type { User, StressScore, CalendarEvent } from './interfaces/types';
import { FIXTURE_USER, FIXTURE_SCORES, FIXTURE_EVENTS } from './mocks';

const RECOVERY_PTS_PER_SESSION   = 6;
const FIXTURE_COMPLETED_SESSIONS = 4;
const FIXTURE_RECOVERY_PTS       = FIXTURE_COMPLETED_SESSIONS * RECOVERY_PTS_PER_SESSION;
const HISTORY_COUNT              = 9;

// Today's date for the POC
const TODAY = new Date('2025-03-25T12:00:00');

// Filter events to today only for accurate daily scoring
const TODAY_EVENTS: CalendarEvent[] = FIXTURE_EVENTS.filter(e => {
  const d = new Date(e.startAt);
  return (
    d.getFullYear() === TODAY.getFullYear() &&
    d.getMonth()    === TODAY.getMonth()    &&
    d.getDate()     === TODAY.getDate()
  );
});

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

  const historicalFixture = FIXTURE_SCORES.slice(0, HISTORY_COUNT);
  const forecastFixture   = FIXTURE_SCORES.slice(HISTORY_COUNT);

  const scores: StressScore[] = historicalFixture.map((s, i) => {
    if (i !== historicalFixture.length - 1) return s;
    return {
      ...s,
      checkInValue,
      totalScore: Math.min(100, checkInValue + s.calendarPts),
    };
  });

  // Score only today's events so topDrivers and scoredEvents reflect March 25
  const dailyResult: DailyScoreResult = computeDailyScore({
    events:        TODAY_EVENTS,
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
    forecastScores: forecastFixture,
    events:         FIXTURE_EVENTS,
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
