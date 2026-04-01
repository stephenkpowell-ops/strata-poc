'use client';

/**
 * store.tsx
 *
 * Client-side data store for the Strata POC.
 *
 * Recovery session tracking has two separate counters:
 *   todaySessions    — sessions completed today (Mar 25), starts at 0
 *   todayRecoveryPts — pts reduced today (6 per session), starts at 0
 *   completedSessions  — total sessions across all 9 days (pre-seeded at 4
 *                        for Mar 17–24, increments with today's sessions)
 *   recoveryPtsTotal   — total pts reduced across all 9 days (pre-seeded
 *                        at 24, increments with today's sessions)
 *
 * The burnout page uses todaySessions / todayRecoveryPts.
 * The history page uses completedSessions / recoveryPtsTotal.
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { computeDailyScore } from './StressEngine';
import type { DailyScoreResult } from './StressEngine';
import type { User, StressScore, CalendarEvent } from './interfaces/types';
import { FIXTURE_USER, FIXTURE_SCORES, FIXTURE_EVENTS } from './mocks';

const RECOVERY_PTS_PER_SESSION    = 6;
const FIXTURE_COMPLETED_SESSIONS  = 4;   // pre-seeded for Mar 17–24
const FIXTURE_RECOVERY_PTS        = FIXTURE_COMPLETED_SESSIONS * RECOVERY_PTS_PER_SESSION;
const HISTORY_COUNT               = 9;

const TODAY = new Date('2025-03-25T12:00:00');

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
  // Today only (Mar 25) — used by burnout page
  todaySessions:      number;
  todayRecoveryPts:   number;
  // All-time cumulative — used by history page
  completedSessions:  number;
  recoveryPtsTotal:   number;
  todaySessions:      number;
  todayRecoveryPts:   number;
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
  // Today's sessions start at 0
  const [todaySessions,     setTodaySessions]     = useState<number>(0);
  const [todayRecoveryPts,  setTodayRecoveryPts]  = useState<number>(0);
  // Historical total pre-seeded at 4 sessions / 24 pts
  const [completedSessions, setCompletedSessions] = useState<number>(FIXTURE_COMPLETED_SESSIONS);
  const [recoveryPtsTotal,  setRecoveryPtsTotal]  = useState<number>(FIXTURE_RECOVERY_PTS);

  const historicalFixture = FIXTURE_SCORES.slice(0, HISTORY_COUNT);
  const forecastFixture   = FIXTURE_SCORES.slice(HISTORY_COUNT);

  const dailyResult: DailyScoreResult = computeDailyScore({
    events:        TODAY_EVENTS,
    calendarPrefs: [
      { includeInScoring: true, contextSwitchPenalties: true, recoveryEventsReduce: true },
    ],
    checkInValue,
  });

  const scores: StressScore[] = historicalFixture.map((s, i) => {
    if (i !== historicalFixture.length - 1) return s;
    return {
      ...s,
      checkInValue,
      totalScore: dailyResult.totalScore,
    };
  });

  const setCheckIn = (value: number) => setCheckInValue(value);

  const logRecoverySession = () => {
    setTodaySessions(prev => prev + 1);
    setTodayRecoveryPts(prev => prev + RECOVERY_PTS_PER_SESSION);
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
    todaySessions,
    todayRecoveryPts,
    completedSessions,
    recoveryPtsTotal,
    todaySessions,
    todayRecoveryPts,
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
