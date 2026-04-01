/**
 * StressEngine.ts
 *
 * Pure stress score computation — no database, no vendor dependencies.
 * Receives plain data, returns plain numbers.
 *
 * This is the core of the Strata product. It implements the two-layer model:
 *   1. Base weights by event category
 *   2. Context-switch multipliers by placement
 *
 * Because it is dependency-free, it is trivially unit-testable and can run
 * identically on the server, in a background job, or in a mobile client.
 */

import type { CalendarEvent, EventCategory, ConnectedCalendar } from './interfaces/types';

// ─────────────────────────────────────────────────────────────────────────────
// BASE WEIGHTS
// ─────────────────────────────────────────────────────────────────────────────

const BASE_WEIGHTS: Record<EventCategory, number> = {
  logistical:      1,
  recurring_admin: 2,
  active_personal: 6,
  high_stakes:     7,
  recovery:        -2,
  work:            0,   // work events scored separately via meeting density model
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT-SWITCH MULTIPLIERS
// ─────────────────────────────────────────────────────────────────────────────

const CTX = {
  MIDDAY_PENALTY:         2,   // personal event between 9am–5pm
  ADJACENCY_HARD:         4,   // overlap or <15 min buffer to adjacent work event
  SANDWICH_PENALTY:       6,   // work → personal → work with no gaps
  PARTIAL_BUFFER_PENALTY: 1,   // 15–30 min buffer
  FULL_BUFFER_MINUTES:    30,  // 30+ min buffer = no penalty
  PARTIAL_BUFFER_MINUTES: 15,
  WORK_DAY_START_HOUR:    9,
  WORK_DAY_END_HOUR:      17,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// WORK MEETING DENSITY MODEL
// ─────────────────────────────────────────────────────────────────────────────

const WORK_MEETING_BASE      = 8;   // pts per work meeting
const BACK_TO_BACK_PENALTY   = 6;   // added per back-to-back pair
const LATE_DAY_PENALTY       = 4;   // meeting starting after 4pm

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoredEvent {
  eventId: string;
  baseStressPts: number;
  contextSwitchPts: number;
  totalStressPts: number;
  breakdown: {
    base: number;
    midday: number;
    adjacency: number;
    sandwich: number;
    partialBuffer: number;
  };
}

// Half-weight additive check-in model.
//
// On work days:  totalScore = calendarPts + round(checkInValue × CHECK_IN_WEIGHT)
// On rest days:  totalScore = checkInValue  (full value, no calendar anchor)
//
// Check-in always adds to the calendar score — it never reduces it.
// Calendar score is always the floor (Zero check-in leaves it unchanged).
// Check-in is worth half its face value on days with meetings,
// giving it meaningful influence without overwhelming calendar load.
//
// Example (calendarPts = 30):
//   Zero=0 → 30, Low=25 → 43, Moderate=50 → 55, High=75 → 68, Critical=100 → 80
export const CHECK_IN_WEIGHT = 0.5;

export interface DailyScoreResult {
  calendarPts:  number;          // total from all events (pre-multiplier)
  totalScore:   number;          // calendarPts × multiplier (or checkIn × 0.5 on rest days)
  scoredEvents: ScoredEvent[];
  topDrivers: {
    category: string;
    totalPts: number;
  }[];
}

export interface ScoreComputationInput {
  events: CalendarEvent[];
  calendarPrefs: Pick<ConnectedCalendar,
    'includeInScoring' | 'contextSwitchPenalties' | 'recoveryEventsReduce'
  >[];
  checkInValue: number;         // user's self-reported 0–100
  maxScore?: number;            // cap, default 100
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function minutesBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 60_000;
}

function hourOf(d: Date): number {
  return d.getHours() + d.getMinutes() / 60;
}

function isDuringWorkDay(d: Date): boolean {
  const h = hourOf(d);
  return h >= CTX.WORK_DAY_START_HOUR && h < CTX.WORK_DAY_END_HOUR;
}

function isWorkEvent(e: CalendarEvent): boolean {
  return e.tag === 'work' || e.category === 'work';
}

function isPersonalEvent(e: CalendarEvent): boolean {
  return e.tag === 'personal' && e.category !== 'work';
}

function bufferMinutes(a: CalendarEvent, b: CalendarEvent): number {
  // minutes between end of a and start of b (negative if overlapping)
  return minutesBetween(a.endAt, b.startAt);
}

// ─────────────────────────────────────────────────────────────────────────────
// WORK EVENT SCORING
// ─────────────────────────────────────────────────────────────────────────────

function scoreWorkEvents(workEvents: CalendarEvent[]): ScoredEvent[] {
  const sorted = [...workEvents].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime()
  );

  return sorted.map((event, i) => {
    if (event.scoringDisabled) {
      return { eventId: event.id, baseStressPts: 0, contextSwitchPts: 0,
        totalStressPts: 0, breakdown: { base:0, midday:0, adjacency:0, sandwich:0, partialBuffer:0 } };
    }

    let base = WORK_MEETING_BASE;

    // Late day penalty
    if (hourOf(event.startAt) >= 16) {
      base += LATE_DAY_PENALTY;
    }

    // Back-to-back penalty with the previous work event
    let adjacency = 0;
    if (i > 0) {
      const gap = bufferMinutes(sorted[i - 1], event);
      if (gap < CTX.PARTIAL_BUFFER_MINUTES) adjacency = BACK_TO_BACK_PENALTY;
    }

    const total = base + adjacency;
    return {
      eventId: event.id,
      baseStressPts: base,
      contextSwitchPts: adjacency,
      totalStressPts: total,
      breakdown: { base, midday: 0, adjacency, sandwich: 0, partialBuffer: 0 },
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL EVENT SCORING
// ─────────────────────────────────────────────────────────────────────────────

function scorePersonalEvent(
  event: CalendarEvent,
  allEvents: CalendarEvent[],
  applyContextSwitch: boolean
): ScoredEvent {
  if (event.scoringDisabled) {
    return { eventId: event.id, baseStressPts: 0, contextSwitchPts: 0,
      totalStressPts: 0, breakdown: { base:0, midday:0, adjacency:0, sandwich:0, partialBuffer:0 } };
  }

  const base = BASE_WEIGHTS[event.category] ?? 0;
  if (base <= 0 && event.category !== 'recovery') {
    return { eventId: event.id, baseStressPts: base, contextSwitchPts: 0,
      totalStressPts: base, breakdown: { base, midday:0, adjacency:0, sandwich:0, partialBuffer:0 } };
  }

  const breakdown = { base, midday: 0, adjacency: 0, sandwich: 0, partialBuffer: 0 };

  if (!applyContextSwitch) {
    return { eventId: event.id, baseStressPts: base, contextSwitchPts: 0,
      totalStressPts: base, breakdown };
  }

  const workEvents = allEvents
    .filter(isWorkEvent)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  // Midday penalty — personal event starting during work hours
  if (isDuringWorkDay(event.startAt)) {
    breakdown.midday = CTX.MIDDAY_PENALTY;
  }

  // Find the nearest preceding and following work events
  const preceding = [...workEvents]
    .filter(w => w.endAt <= event.startAt)
    .at(-1);
  const following = workEvents.find(w => w.startAt >= event.endAt);

  // Sandwich detection — work before AND after with no real gaps
  if (preceding && following) {
    const gapBefore = bufferMinutes(preceding, event);
    const gapAfter  = bufferMinutes(event, following);
    if (gapBefore < CTX.PARTIAL_BUFFER_MINUTES && gapAfter < CTX.PARTIAL_BUFFER_MINUTES) {
      breakdown.sandwich = CTX.SANDWICH_PENALTY;
    }
  }

  // Adjacency penalty — only applied if sandwich isn't already firing
  if (breakdown.sandwich === 0) {
    const nearestWork = preceding ?? following;
    if (nearestWork) {
      const gap = preceding
        ? bufferMinutes(preceding, event)
        : bufferMinutes(event, following!);

      if (gap < 0 || gap < CTX.PARTIAL_BUFFER_MINUTES) {
        breakdown.adjacency = CTX.ADJACENCY_HARD;
      } else if (gap < CTX.FULL_BUFFER_MINUTES) {
        breakdown.partialBuffer = CTX.PARTIAL_BUFFER_PENALTY;
      }
    }
  }

  const contextSwitchPts =
    breakdown.midday + breakdown.adjacency + breakdown.sandwich + breakdown.partialBuffer;

  const totalStressPts = base + contextSwitchPts;

  return {
    eventId: event.id,
    baseStressPts: base,
    contextSwitchPts,
    totalStressPts,
    breakdown,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLLING AVERAGE
// ─────────────────────────────────────────────────────────────────────────────

export function computeRollingAvg(scores: number[], days = 7): number {
  const window = scores.slice(-days);
  if (window.length === 0) return 0;
  return Math.round(window.reduce((a, b) => a + b, 0) / window.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — computeDailyScore
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the full stress score for a user's day.
 *
 * @example
 * const result = computeDailyScore({
 *   events: syncedEvents,
 *   calendarPrefs: userCalendars,
 *   checkInValue: 60,
 * });
 * // result.calendarPts — points from calendar events
 * // result.scoredEvents — per-event breakdown for the calendar screen
 */
export function computeDailyScore(input: ScoreComputationInput): DailyScoreResult {
  const { events, calendarPrefs, maxScore = 100 } = input;

  // Respect per-calendar scoring preferences
  const activeCalendarIds = new Set(
    calendarPrefs
      .filter(p => p.includeInScoring)
      .map((_, i) => i)              // placeholder — in practice keyed by calendarId
  );

  // Separate disabled events, work, and personal
  const scorableEvents = events.filter(e => !e.scoringDisabled);
  const workEvents     = scorableEvents.filter(isWorkEvent);
  const personalEvents = scorableEvents.filter(isPersonalEvent);

  // Determine if context-switch penalties apply (user may toggle this off)
  const applyContextSwitch = calendarPrefs.some(p => p.contextSwitchPenalties);
  const applyRecoveryReduction = calendarPrefs.some(p => p.recoveryEventsReduce);

  // Score work events
  const scoredWork = scoreWorkEvents(workEvents);

  // Score personal events
  const scoredPersonal = personalEvents.map(e =>
    scorePersonalEvent(e, scorableEvents, applyContextSwitch)
  );

  // Score recovery events (may reduce total if preference is on)
  const recoveryPts = applyRecoveryReduction
    ? events
        .filter(e => e.category === 'recovery' && !e.scoringDisabled)
        .reduce((sum, e) => sum + (BASE_WEIGHTS.recovery), 0)
    : 0;

  const allScored = [...scoredWork, ...scoredPersonal];

  const calendarPts = Math.max(
    0,
    allScored.reduce((sum, s) => sum + s.totalStressPts, 0) + recoveryPts
  );

  // Build driver summary for burnout alert screen
  const driverMap = new Map<string, number>();
  allScored.forEach(s => {
    const event = events.find(e => e.id === s.eventId);
    if (!event) return;
    const key = event.category === 'work' ? 'Work meetings' : event.category;
    driverMap.set(key, (driverMap.get(key) ?? 0) + s.totalStressPts);
  });
  const topDrivers = [...driverMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, totalPts]) => ({ category, totalPts }));

  // Compute totalScore using half-weight additive model
  const cappedCalendarPts = Math.min(calendarPts, maxScore);
  const totalScore = cappedCalendarPts === 0
    ? input.checkInValue                                                          // rest day — full check-in value
    : Math.min(maxScore, cappedCalendarPts + Math.round(input.checkInValue * CHECK_IN_WEIGHT)); // work day — calendar + half check-in

  return {
    calendarPts:  cappedCalendarPts,
    totalScore,
    scoredEvents: allScored,
    topDrivers,
  };
}
