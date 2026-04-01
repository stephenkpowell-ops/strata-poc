'use client';

/**
 * DayStrip.tsx
 *
 * Horizontal day tab bar for the calendar screen.
 *
 * Displays one tab per score record (historical + forecast).
 * Each tab shows day label, date number, and a color-coded stress dot.
 *
 * Timeline visual treatment:
 *   Past    (before today) — date number dimmed to zinc-600, normal border
 *   Today   (March 25)     — date number on filled indigo circle, "TODAY" label
 *   Future  (after today)  — date number normal, tab has dashed border
 *
 * TODAY is hardcoded to March 25 for the POC.
 *
 * Dot color by calendarPts:
 *   green  (bg-emerald-400) = calendarPts < 35
 *   indigo (bg-indigo-400)  = calendarPts 36–70
 *   orange (bg-orange-400)  = calendarPts >= 71
 */

import type { StressScore } from '@/lib/interfaces/types';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Today's date for the POC — March 25, 2025
const TODAY = new Date('2025-03-25T12:00:00');

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  scores:        StressScore[];
  selectedIndex: number;
  onSelectDay:   (index: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getDotColor(pts: number): string {
  if (pts >= 71) return 'bg-orange-400';
  if (pts >= 36) return 'bg-indigo-400';
  return 'bg-emerald-400';
}

function isToday(date: Date): boolean {
  return (
    new Date(date).getFullYear() === TODAY.getFullYear() &&
    new Date(date).getMonth()    === TODAY.getMonth()    &&
    new Date(date).getDate()     === TODAY.getDate()
  );
}

function isPast(date: Date): boolean {
  return new Date(date).getTime() < TODAY.setHours(0, 0, 0, 0);
}

function isFuture(date: Date): boolean {
  return new Date(date).getTime() > TODAY.setHours(23, 59, 59, 999);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DayStrip({ scores, selectedIndex, onSelectDay }: Props) {
  return (
    <div className="flex justify-between px-2 py-3 bg-zinc-900 border-b border-zinc-800">
      {scores.map((score, i) => {
        const date       = new Date(score.date);
        const isSelected = i === selectedIndex;
        const today      = isToday(date);
        const past       = isPast(date);
        const future     = isFuture(date);

        return (
          <button
            key={score.id}
            onClick={() => onSelectDay(i)}
            className={`flex flex-col items-center gap-1 px-1.5 py-2 rounded-lg transition-colors ${
              isSelected
                ? 'bg-zinc-700'
                : 'hover:bg-zinc-800'
            } ${
              future && !isSelected
                ? 'border border-dashed border-zinc-700'
                : 'border border-transparent'
            }`}
          >
            {/* Day label */}
            <span className={`text-[10px] font-medium ${
              today   ? 'text-indigo-400'
              : past  ? 'text-zinc-600'
              : isSelected ? 'text-white'
              : 'text-zinc-400'
            }`}>
              {DAY_LABELS[date.getDay()]}
            </span>

            {/* Date number — today gets a filled indigo circle */}
            {today ? (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600">
                <span className="text-xs font-bold text-white">
                  {date.getDate()}
                </span>
              </div>
            ) : (
              <span className={`text-xs font-semibold ${
                past
                  ? 'text-zinc-600'
                  : isSelected
                    ? 'text-white'
                    : 'text-zinc-300'
              }`}>
                {date.getDate()}
              </span>
            )}

            {/* Stress dot */}
            <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(score.calendarPts)} ${
              past ? 'opacity-40' : 'opacity-100'
            }`} />

            {/* TODAY label */}
            {today && (
              <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-400">
                Today
              </span>
            )}

          </button>
        );
      })}
    </div>
  );
}
