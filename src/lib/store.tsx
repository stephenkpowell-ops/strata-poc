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
 * This is the only data source for the POC — no database, no API calls.
 * When the MVP backend is ready, this file is replaced by real data fetching.
 * Nothing else in the app needs to change.
 *
 * Usage:
 *
 *   // 1. Wrap the root layout (src/app/layout.tsx):
 *   import { StrataProvider } from '@/lib/store';
 *   <StrataProvider>{children}</StrataProvider>
 *
 *   // 2. Use in any client component:
 *   import { useStrata } from '@/lib/store';
 *   const { user, scores, events, dailyResult } = useStrata();
 */

import { createContext, useContext, ReactNode } from 'react';
import { computeDailyScore } from './StressEngine';
import type { DailyScoreResult } from './StressEngine';
import type { User, StressScore, CalendarEvent } from './interfaces/types';
import { FIXTURE_USER, FIXTURE_SCORES, FIXTURE_EVENTS } from './mocks';

// ─────────────────────────────────────────────────────────────────────────────
// STORE SHAPE
// ─────────────────────────────────────────────────────────────────────────────

interface StrataState {
  user:        User;
  scores:      StressScore[];
  events:      CalendarEvent[];
  dailyResult: DailyScoreResult;  // StressEngine output for the fixture day
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// Computed once at module load — fixture data is static so this never needs
// to re-run during the POC.
// ─────────────────────────────────────────────────────────────────────────────

const initialState: StrataState = {
  user:   FIXTURE_USER,
  scores: FIXTURE_SCORES,
  events: FIXTURE_EVENTS,
  dailyResult: computeDailyScore({
    events:        FIXTURE_EVENTS,
    calendarPrefs: [
      { includeInScoring: true, contextSwitchPenalties: true, recoveryEventsReduce: true },
    ],
    checkInValue: 0,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const StrataContext = createContext<StrataState | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// Add <StrataProvider> to src/app/layout.tsx wrapping {children}.
// ─────────────────────────────────────────────────────────────────────────────

export function StrataProvider({ children }: { children: ReactNode }) {
  return (
    <StrataContext.Provider value={initialState}>
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
