'use client';

/**
 * ForecastCard.tsx
 *
 * 5-Day Meeting Forecast card for the home screen.
 *
 * Shows the next 5 days of projected calendar load pulled directly
 * from FIXTURE_SCORES (score_9 through score_11 for Mar 26–28,
 * plus Sat/Sun with 0 pts) so the values always match what appears
 * on the calendar screen.
 *
 * For Mar 26–28 the score records exist in FIXTURE_SCORES with
 * checkInValue: 0 and totalScore = calendarPts (forecast — no
 * check-in logged yet). The card shows calendarPts only.
 *
 * Sat Mar 29 and Sun Mar 30 are generated inline as rest days.
 *
 * Usage:
 *   <ForecastCard forecastScores={forecastScores} />
 */

import type { StressScore } from '@/lib/interfaces/types';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  forecastScores: StressScore[];
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ForecastSlot {
  date:        Date;
  calendarPts: number;
  isRest:      boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getBarColor(pts: number): string {
  if (pts >= 71) return 'bg-orange-400';
  if (pts >= 36) return 'bg-indigo-400';
  if (pts > 0)   return 'bg-emerald-400';
  return 'bg-zinc-800';
}

function getTextColor(pts: number): string {
  if (pts >= 71) return 'text-orange-400';
  if (pts >= 36) return 'text-indigo-400';
  return 'text-emerald-400';
}

function getLoadLabel(pts: number, isRest: boolean): string {
  if (isRest)    return 'Rest';
  if (pts >= 71) return 'High';
  if (pts >= 36) return 'Elevated';
  if (pts === 0) return 'Free';
  return 'Light';
}

function generateInsight(slots: ForecastSlot[]): string {
  const workdays  = slots.filter(d => d.calendarPts > 0 && !d.isRest);
  const heaviest  = slots.reduce((a, b) => a.calendarPts > b.calendarPts ? a : b);
  const highDays  = workdays.filter(d => d.calendarPts >= 71);
  const lightDays = workdays.filter(d => d.calendarPts > 0 && d.calendarPts < 35);

  const heaviestDay = DAY_LABELS[new Date(heaviest.date).getDay()];

  if (highDays.length >= 2) {
    return `${highDays.length} high-load days ahead — prioritize recovery tonight.`;
  }
  if (heaviest.calendarPts >= 36) {
    return `${heaviestDay} is your heaviest day — consider a recovery session beforehand.`;
  }
  if (lightDays.length >= 2) {
    return `Lighter days ahead — a good stretch to front-load recovery sessions.`;
  }
  if (workdays.length === 0) {
    return `No meetings in the next 5 days — use the space to reset.`;
  }
  return `Manageable week ahead — maintain your check-in routine.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ForecastCard({ forecastScores }: Props) {
  // Build 5 slots: use the 3 forecast score records + Sat/Sun as rest days
  const slots: ForecastSlot[] = [
    ...forecastScores.slice(0, 3).map(s => ({
      date:        new Date(s.date),
      calendarPts: s.calendarPts,
      isRest:      false,
    })),
    {
      date:        new Date('2025-03-29T12:00:00'),
      calendarPts: 0,
      isRest:      true,
    },
    {
      date:        new Date('2025-03-30T12:00:00'),
      calendarPts: 0,
      isRest:      true,
    },
  ];

  const insight = generateInsight(slots);
  const maxPts  = Math.max(...slots.map(d => d.calendarPts), 1);

  return (
    <div className="flex flex-col gap-4 bg-zinc-900 rounded-2xl p-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            5-Day Forecast
          </span>
          <span className="text-xs text-zinc-600">
            Projected calendar load
          </span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded-full">
          Predictive
        </span>
      </div>

      {/* Day columns */}
      <div className="flex gap-2">
        {slots.map((slot, i) => {
          const pts      = slot.calendarPts;
          const dayLabel = DAY_LABELS[slot.date.getDay()];
          const dateNum  = slot.date.getDate();
          const barH     = pts > 0 ? Math.max(12, Math.round((pts / maxPts) * 64)) : 4;
          const label    = getLoadLabel(pts, slot.isRest);

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">

              {/* Bar */}
              <div className="flex flex-col justify-end h-16 w-full">
                <div
                  className={`w-full rounded-t-sm transition-all ${getBarColor(pts)}`}
                  style={{ height: `${barH}px` }}
                />
              </div>

              {/* Day */}
              <span className="text-[10px] font-medium text-zinc-500">{dayLabel}</span>

              {/* Date */}
              <span className="text-xs font-semibold text-zinc-300">{dateNum}</span>

              {/* Load label */}
              <span className={`text-[9px] font-semibold ${
                slot.isRest || pts === 0 ? 'text-zinc-600' : getTextColor(pts)
              }`}>
                {label}
              </span>

              {/* Pts — only for days with meetings */}
              {pts > 0 && !slot.isRest && (
                <span className={`text-[9px] tabular-nums ${getTextColor(pts)}`}>
                  {pts} pts
                </span>
              )}

            </div>
          );
        })}
      </div>

      {/* Insight line */}
      <div className="flex items-start gap-2 bg-zinc-800 rounded-xl px-3 py-2.5">
        <span className="text-indigo-400 text-xs mt-0.5 flex-shrink-0">→</span>
        <span className="text-xs text-zinc-300 leading-relaxed">{insight}</span>
      </div>

    </div>
  );
}
