'use client';

/**
 * DayStrip.tsx
 *
 * 7-day horizontal tab bar for the calendar screen.
 *
 * Displays one tab per score record showing:
 *   - Day abbreviation (Mon, Tue, etc.)
 *   - Date number
 *   - Color-coded stress dot based on calendarPts (meeting load only):
 *       green  (bg-emerald-400) = calendarPts < 40  — light day
 *       indigo (bg-indigo-400)  = calendarPts 40–74 — elevated load
 *       orange (bg-orange-400)  = calendarPts >= 75  — high load day
 *
 * Dots reflect meeting load specifically, consistent with the
 * DailyStressSummary bar on the calendar screen.
 *
 * Usage:
 *   <DayStrip
 *     scores={scores}
 *     selectedIndex={selectedIndex}
 *     onSelectDay={setSelectedIndex}
 *   />
 */

import { StressScore } from '@/lib/interfaces/types';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  scores:       StressScore[];
  selectedIndex: number;
  onSelectDay:  (index: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getDotColor(calendarPts: number): string {
  if (calendarPts >= 75) return 'bg-orange-400';
  if (calendarPts >= 40) return 'bg-indigo-400';
  return 'bg-emerald-400';
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function DayStrip({ scores, selectedIndex, onSelectDay }: Props) {
  return (
    <div className="flex justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
      {scores.map((score, i) => {
        const date       = new Date(score.date);
        const isSelected = i === selectedIndex;

        return (
          <button
            key={score.id}
            onClick={() => onSelectDay(i)}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
              isSelected ? 'bg-zinc-700' : 'hover:bg-zinc-800'
            }`}
          >
            <span className={`text-xs font-medium ${
              isSelected ? 'text-white' : 'text-zinc-400'
            }`}>
              {DAY_LABELS[date.getDay()]}
            </span>
            <span className={`text-sm font-semibold ${
              isSelected ? 'text-white' : 'text-zinc-300'
            }`}>
              {date.getDate()}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(score.calendarPts)}`} />
          </button>
        );
      })}
    </div>
  );
}
