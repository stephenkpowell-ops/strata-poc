/**
 * predictCheckIn.ts
 *
 * Rule-based check-in prediction for the Strata POC.
 *
 * Uses the same signals a trained ML model would use, but with
 * hard-coded heuristics instead of learned weights. This demonstrates
 * the prediction concept to testers without requiring real user data.
 *
 * In the MVP this function would be replaced by a model trained on
 * 30+ days of per-user check-in vs calendar correlations.
 *
 * Inputs:
 *   calendarPts         — today's meeting load from StressEngine
 *   dayOfWeek           — 0=Sun, 1=Mon, ... 6=Sat
 *   rollingAvg7d        — 7-day rolling average total score
 *   completedSessions   — recovery sessions completed recently
 *   consecutiveHighDays — days in a row with totalScore > 70
 *
 * Output:
 *   One of: 0 | 25 | 50 | 75 | 100
 *   (matching the CheckInCard option values)
 */

export interface PredictionInput {
  calendarPts:         number;
  dayOfWeek:           number;
  rollingAvg7d:        number;
  completedSessions:   number;
  consecutiveHighDays: number;
}

export type CheckInValue = 0 | 25 | 50 | 75 | 100;

const CHECK_IN_OPTIONS: CheckInValue[] = [0, 25, 50, 75, 100];

function snapToOption(value: number): CheckInValue {
  return CHECK_IN_OPTIONS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  ) as CheckInValue;
}

export function predictCheckIn(input: PredictionInput): CheckInValue {
  const { calendarPts, dayOfWeek, rollingAvg7d, completedSessions, consecutiveHighDays } = input;

  // ── Base score from calendar load (primary signal) ──────────────────────
  let base = 0;
  if      (calendarPts >= 71) base = 75;  // High
  else if (calendarPts >= 36) base = 50;  // Moderate
  else if (calendarPts >= 15) base = 25;  // Low
  else                        base = 0;   // Zero

  // ── Fatigue modifier — rolling average trend ─────────────────────────────
  if (rollingAvg7d > 70)      base = Math.min(100, base + 25); // sustained high load
  else if (rollingAvg7d < 40) base = Math.max(0,   base - 25); // well rested

  // ── Day-of-week modifier ─────────────────────────────────────────────────
  if ((dayOfWeek === 0 || dayOfWeek === 6)) {
    base = Math.max(0, base - 25);                              // weekend recovery
  } else if (dayOfWeek === 1 && rollingAvg7d < 55) {
    base = Math.max(0, base - 25);                              // Monday after good rest
  } else if (dayOfWeek === 5 && rollingAvg7d > 55) {
    base = Math.min(100, base + 25);                            // Friday end-of-week fatigue
  }

  // ── Consecutive high days — sustained load fatigue ───────────────────────
  if (consecutiveHighDays >= 3) base = Math.min(100, base + 25);

  // ── Recovery modifier — recent sessions reduce predicted load ────────────
  if (completedSessions >= 3) base = Math.max(0, base - 25);

  return snapToOption(base);
}

/**
 * Generate a short explanation for why this prediction was made.
 * Shown below the predicted option in the CheckInCard.
 */
export function getPredictionRationale(input: PredictionInput, predicted: CheckInValue): string {
  const { calendarPts, dayOfWeek, rollingAvg7d, consecutiveHighDays, completedSessions } = input;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend && predicted === 0) {
    return 'Weekend with no meetings — predicting a reset day.';
  }
  if (consecutiveHighDays >= 3 && predicted >= 75) {
    return `${consecutiveHighDays} consecutive high days — cumulative fatigue likely.`;
  }
  if (rollingAvg7d > 70 && calendarPts >= 36) {
    return 'Heavy schedule on top of an already high rolling average.';
  }
  if (completedSessions >= 3 && predicted <= 25) {
    return 'Recent recovery sessions are keeping your load in check.';
  }
  if (dayOfWeek === 5 && predicted >= 75) {
    return 'Friday with elevated rolling average — end-of-week fatigue likely.';
  }
  if (calendarPts >= 71) {
    return 'High meeting load today — predicting elevated felt stress.';
  }
  if (calendarPts >= 36) {
    return 'Moderate meeting load — predicting a manageable day.';
  }
  return 'Light schedule and stable rolling average — predicting a low-stress day.';
}
