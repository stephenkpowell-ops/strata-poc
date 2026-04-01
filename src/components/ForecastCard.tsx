'use client';

/**
 * ForecastCard.tsx
 *
 * 5-day predictive stress forecast card for the home screen.
 *
 * Shows the next 5 days of projected calendar load with:
 *   - Day label + date number
 *   - Color-coded load bar
 *   - calendarPts value
 *   - A single opinionated insight line at the bottom
 *
 * Load thresholds:
 *   green  (calendarPts < 35)  — Light
 *   indigo (calendarPts 36–70) — Elevated
 *   orange (calendarPts >= 71) — High Load
 *
 * Usage:
 *   <ForecastCard forecast={forecast} />
 */

import type { ForecastDay } from '@/lib/mocks';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  forecast: ForecastDay[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDotColor(pts: number): string {
  if (pts >= 71) return 'bg-orange-400';
  if (pts >= 36) return 'bg-indigo-400';
  return 'bg-emerald-400';
}

function getTextColor(pts: number): string {
  if (pts >= 71) return 'text-orange-400';
  if (pts >= 36) return 'text-indigo-400';
  return 'text-emerald-400';
}

function getLoadLabel(pts: number): string {
  if (pts >= 71) return 'High';
  if (pts >= 36) return 'Elevated';
  if (pts === 0)  return 'Free';
  return 'Light';
}

/**
 * Generate an opinionated insight line based on the 5-day forecast.
 * Looks for the heaviest day, recovery windows, and back-to-back risks.
 */
function generateInsight(forecast: ForecastDay[]): string {
  const workdays   = forecast.filter(d => d.calendarPts > 0);
  const heaviest   = forecast.reduce((a, b) => a.calendarPts > b.calendarPts ? a : b);
  const highDays   = forecast.filter(d => d.calendarPts >= 71);
  const lightDays  = forecast.filter(d => d.calendarPts > 0 && d.calendarPts < 35);
  const freeDays   = forecast.filter(d => d.calendarPts === 0);

  // Identify back-to-backs on the heaviest day
  const hasB2B = heaviest.events.some((e, i) => {
    if (i === 0 || e.category !== 'work') return false;
    const prev = heaviest.events[i - 1];
    return prev.category === 'work' && prev.end === e.start;
  });

  const heaviestDay = DAY_LABELS[new Date(heaviest.date).getDay()];

  if (highDays.length >= 2) {
    return `${highDays.length} high-load days ahead — prioritize recovery tonight.`;
  }

  if (heaviest.calendarPts >= 36 && hasB2B) {
    return `${heaviestDay} has back-to-back meetings with no buffer — protect your morning.`;
  }

  if (heaviest.calendarPts >= 36) {
    return `${heaviestDay} is your heaviest day — consider a recovery session beforehand.`;
  }

  if (freeDays.length >= 2 && lightDays.length >= 1) {
    return `Light week ahead — good window to build recovery capacity.`;
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

export default function ForecastCard({ forecast }: Props) {
  const insight = generateInsight(forecast);
  const maxPts  = Math.max(...forecast.map(d => d.calendarPts), 1);

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
        {forecast.map((day, i) => {
          const date      = new Date(day.date);
          const dayLabel  = DAY_LABELS[date.getDay()];
          const dateNum   = date.getDate();
          const pts       = day.calendarPts;
          const barHeight = pts > 0 ? Math.max(12, Math.round((pts / maxPts) * 64)) : 4;
          const textColor = getTextColor(pts);
          const dotColor  = getDotColor(pts);
          const loadLabel = getLoadLabel(pts);

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">

              {/* Bar */}
              <div className="flex flex-col justify-end h-16 w-full">
                <div
                  className={`w-full rounded-t-sm ${pts > 0 ? dotColor : 'bg-zinc-800'} transition-all`}
                  style={{ height: `${barHeight}px` }}
                />
              </div>

              {/* Day label */}
              <span className="text-[10px] font-medium text-zinc-500">{dayLabel}</span>

              {/* Date */}
              <span className="text-xs font-semibold text-zinc-300">{dateNum}</span>

              {/* Load label */}
              <span className={`text-[9px] font-semibold ${pts > 0 ? textColor : 'text-zinc-700'}`}>
                {loadLabel}
              </span>

              {/* Pts */}
              {pts > 0 && (
                <span className={`text-[9px] tabular-nums ${textColor}`}>
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
        <span className="text-xs text-zinc-300 leading-relaxed">
          {insight}
        </span>
      </div>

    </div>
  );
}
