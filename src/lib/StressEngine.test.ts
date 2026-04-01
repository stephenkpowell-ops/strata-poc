/**
 * StressEngine.test.ts
 *
 * Unit tests for the core stress computation model.
 * Zero dependencies — no database, no mocks needed, just pure functions.
 *
 * Run with: npx vitest run src/lib/services/StressEngine.test.ts
 */

import { describe, it, expect } from 'vitest';
import { computeDailyScore, computeRollingAvg } from './StressEngine';
import type { CalendarEvent, ConnectedCalendar } from '../interfaces/types';

// ─────────────────────────────────────────────────────────────────────────────
// TEST FIXTURES
// ─────────────────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'evt_test',
    userId: 'user_test',
    calendarId: 'cal_test',
    externalId: 'ext_test',
    source: 'google',
    tag: 'work',
    category: 'work',
    title: null,
    startAt: new Date('2025-03-25T09:00:00'),
    endAt: new Date('2025-03-25T10:00:00'),
    durationMinutes: 60,
    attendeeCount: 5,
    isRecurring: false,
    recurringGroupId: null,
    baseStressPts: 0,
    contextSwitchPts: 0,
    totalStressPts: 0,
    scoringDisabled: false,
    scoringDisabledScope: null,
    categoryOverriddenByUser: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const defaultPrefs: ConnectedCalendar['includeInScoring'] extends boolean
  ? Pick<ConnectedCalendar, 'includeInScoring' | 'contextSwitchPenalties' | 'recoveryEventsReduce'>[]
  : never[] = [
  { includeInScoring: true, contextSwitchPenalties: true, recoveryEventsReduce: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// WORK MEETING SCORING
// ─────────────────────────────────────────────────────────────────────────────

describe('Work meeting scoring', () => {
  it('scores a single work meeting at base weight', () => {
    const events = [makeEvent({ id: 'w1', tag: 'work', category: 'work' })];
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    expect(result.calendarPts).toBe(8); // WORK_MEETING_BASE
  });

  it('applies back-to-back penalty for meetings with no gap', () => {
    const events = [
      makeEvent({ id: 'w1', tag: 'work', category: 'work',
        startAt: new Date('2025-03-25T09:00:00'), endAt: new Date('2025-03-25T10:00:00') }),
      makeEvent({ id: 'w2', tag: 'work', category: 'work',
        startAt: new Date('2025-03-25T10:00:00'), endAt: new Date('2025-03-25T11:00:00') }),
    ];
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    // w1: 8pts, w2: 8 + 6 (back-to-back) = 14pts → total 22
    expect(result.calendarPts).toBe(22);
  });

  it('applies late-day penalty for meetings starting after 4pm', () => {
    const events = [makeEvent({
      id: 'w1', tag: 'work', category: 'work',
      startAt: new Date('2025-03-25T16:30:00'), endAt: new Date('2025-03-25T17:30:00'),
    })];
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    // 8 (base) + 4 (late day) = 12
    expect(result.calendarPts).toBe(12);
  });

  it('does not apply back-to-back penalty when gap is 30+ minutes', () => {
    const events = [
      makeEvent({ id: 'w1', startAt: new Date('2025-03-25T09:00:00'), endAt: new Date('2025-03-25T10:00:00') }),
      makeEvent({ id: 'w2', startAt: new Date('2025-03-25T10:30:00'), endAt: new Date('2025-03-25T11:30:00') }),
    ];
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    // 8 + 8 = 16, no back-to-back penalty
    expect(result.calendarPts).toBe(16);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL EVENT BASE WEIGHTS
// ─────────────────────────────────────────────────────────────────────────────

describe('Personal event base weights', () => {
  it.each([
    ['logistical',      1],
    ['recurring_admin', 2],
    ['active_personal', 6],
    ['high_stakes',     7],
  ])('scores %s event at +%i pts base (after 5pm, no adjacency)', (category, expectedBase) => {
    const events = [makeEvent({
      id: 'p1', tag: 'personal', category: category as any,
      // After work hours — no midday or adjacency penalty
      startAt: new Date('2025-03-25T18:00:00'),
      endAt: new Date('2025-03-25T19:00:00'),
    })];
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    expect(result.calendarPts).toBe(expectedBase);
  });

  it('subtracts 2pts for recovery events when preference is on', () => {
    const events = [makeEvent({
      id: 'p1', tag: 'personal', category: 'recovery',
      startAt: new Date('2025-03-25T12:00:00'), endAt: new Date('2025-03-25T13:00:00'),
    })];
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    expect(result.calendarPts).toBe(0); // max(0, -2) = 0
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT-SWITCH MULTIPLIERS — the worked example from the UX docs
// ─────────────────────────────────────────────────────────────────────────────

describe('Context-switch multipliers — doctor appointment worked example', () => {
  /**
   * Tuesday schedule from the UX documentation:
   *   09:30 All-hands (work)       → +18 pts
   *   10:30 Exec review (work)     → +19 pts (back-to-back with all-hands)
   *   12:00 Doctor appt (personal) → +10 pts (base 4 + midday 2 + adjacency 4)
   *   17:30 Kids pickup (personal) → +1 pt  (base 1, after hours, no adjacency)
   */
  const events = [
    makeEvent({ id: 'w1', tag: 'work', category: 'work',
      startAt: new Date('2025-03-25T09:30:00'), endAt: new Date('2025-03-25T10:30:00') }),
    makeEvent({ id: 'w2', tag: 'work', category: 'work',
      startAt: new Date('2025-03-25T10:30:00'), endAt: new Date('2025-03-25T11:30:00') }),
    makeEvent({ id: 'p1', tag: 'personal', category: 'active_personal',
      startAt: new Date('2025-03-25T11:40:00'), endAt: new Date('2025-03-25T12:40:00') }),
    makeEvent({ id: 'p2', tag: 'personal', category: 'logistical',
      startAt: new Date('2025-03-25T17:30:00'), endAt: new Date('2025-03-25T18:00:00') }),
  ];

  it('applies midday penalty to doctor appointment', () => {
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    const doctorScore = result.scoredEvents.find(s => s.eventId === 'p1');
    expect(doctorScore?.breakdown.midday).toBe(2);
  });

  it('applies adjacency penalty to doctor appointment (<15 min from exec review)', () => {
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    const doctorScore = result.scoredEvents.find(s => s.eventId === 'p1');
    expect(doctorScore?.breakdown.adjacency).toBe(4);
  });

  it('scores doctor appointment at +12 total (base 6 + midday 2 + adjacency 4)', () => {
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    const doctorScore = result.scoredEvents.find(s => s.eventId === 'p1');
    expect(doctorScore?.totalStressPts).toBe(12);
  });

  it('scores kids pickup at +1 (base only — after hours, no adjacent work meetings)', () => {
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    const pickupScore = result.scoredEvents.find(s => s.eventId === 'p2');
    expect(pickupScore?.totalStressPts).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SANDWICH PATTERN
// ─────────────────────────────────────────────────────────────────────────────

describe('Sandwich pattern (work → personal → work)', () => {
  it('applies sandwich penalty (+6) when personal event has no gap on either side', () => {
    const events = [
      makeEvent({ id: 'w1', tag: 'work', category: 'work',
        startAt: new Date('2025-03-25T13:00:00'), endAt: new Date('2025-03-25T14:00:00') }),
      makeEvent({ id: 'p1', tag: 'personal', category: 'active_personal',
        startAt: new Date('2025-03-25T14:00:00'), endAt: new Date('2025-03-25T14:30:00') }),
      makeEvent({ id: 'w2', tag: 'work', category: 'work',
        startAt: new Date('2025-03-25T14:30:00'), endAt: new Date('2025-03-25T15:30:00') }),
    ];
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    const personalScore = result.scoredEvents.find(s => s.eventId === 'p1');
    // base 6 + midday 2 + sandwich 6 = 14
    expect(personalScore?.breakdown.sandwich).toBe(6);
    expect(personalScore?.totalStressPts).toBe(14);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCORING DISABLED
// ─────────────────────────────────────────────────────────────────────────────

describe('Scoring disabled', () => {
  it('returns 0 pts for events with scoringDisabled = true', () => {
    const events = [makeEvent({ id: 'w1', tag: 'work', category: 'work', scoringDisabled: true })];
    const result = computeDailyScore({ events, calendarPrefs: defaultPrefs, checkInValue: 0 });
    expect(result.calendarPts).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT-SWITCH PREFERENCE OFF
// ─────────────────────────────────────────────────────────────────────────────

describe('Context-switch penalties disabled by user preference', () => {
  it('applies only base weight when contextSwitchPenalties is off', () => {
    const events = [
      makeEvent({ id: 'w1', tag: 'work', category: 'work',
        startAt: new Date('2025-03-25T10:00:00'), endAt: new Date('2025-03-25T11:00:00') }),
      makeEvent({ id: 'p1', tag: 'personal', category: 'active_personal',
        startAt: new Date('2025-03-25T11:00:00'), endAt: new Date('2025-03-25T12:00:00') }),
    ];
    const prefsOff = [{ includeInScoring: true, contextSwitchPenalties: false, recoveryEventsReduce: true }];
    const result = computeDailyScore({ events, calendarPrefs: prefsOff, checkInValue: 0 });
    const personalScore = result.scoredEvents.find(s => s.eventId === 'p1');
    // Only base weight, no penalties
    expect(personalScore?.contextSwitchPts).toBe(0);
    expect(personalScore?.totalStressPts).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ROLLING AVERAGE
// ─────────────────────────────────────────────────────────────────────────────

describe('computeRollingAvg', () => {
  it('computes the average of the last N scores', () => {
    const scores = [50, 60, 70, 80, 90, 100, 65];
    expect(computeRollingAvg(scores, 7)).toBe(74); // (50+60+70+80+90+100+65)/7 = 73.57 → 74
  });

  it('uses all scores when fewer than window size are available', () => {
    const scores = [60, 80];
    expect(computeRollingAvg(scores, 7)).toBe(70);
  });

  it('returns 0 for empty input', () => {
    expect(computeRollingAvg([], 7)).toBe(0);
  });

  it('uses only the most recent N scores from a longer array', () => {
    const scores = [10, 10, 10, 10, 100, 100, 100, 100, 100, 100, 100];
    // last 7: [100, 100, 100, 100, 100, 100, 100]
    expect(computeRollingAvg(scores, 7)).toBe(100);
  });
});
