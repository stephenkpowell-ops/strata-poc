'use client';

/**
 * EventRow.tsx
 *
 * Renders a single calendar event block in the timeline.
 *
 * Displays:
 *   - Time range (e.g. "9:30 AM – 10:30 AM")
 *   - Work / Personal badge
 *   - Event category label
 *   - Stress points delta (e.g. "+18 pts")
 *
 * Colour coding by totalStressPts (left border + pts label):
 *   orange  (>= 15 pts) — high load
 *   indigo  (6–14 pts)  — medium load
 *   green   (< 6 pts)   — low load / recovery
 *
 * Usage:
 *   <EventRow event={scoredEvent} calendarEvent={calendarEvent} />
 */

import { CalendarEvent } from '@/lib/interfaces/types';
import { ScoredEvent } from '@/lib/StressEngine';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  calendarEvent: CalendarEvent;
  scoredEvent:   ScoredEvent;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getBorderColour(pts: number): string {
  if (pts >= 15) return 'border-orange-400';
  if (pts >= 6)  return 'border-indigo-400';
  return 'border-emerald-400';
}

function getPtsColour(pts: number): string {
  if (pts >= 15) return 'text-orange-400';
  if (pts >= 6)  return 'text-indigo-500';
  return 'text-emerald-400';
}

function getCategoryLabel(category: CalendarEvent['category']): string {
  switch (category) {
    case 'work':            return 'Meeting';
    case 'active_personal': return 'Personal';
    case 'logistical':      return 'Logistical';
    case 'recurring_admin': return 'Admin';
    case 'high_stakes':     return 'High stakes';
    case 'recovery':        return 'Recovery';
    default:                return 'Event';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function EventRow({ calendarEvent, scoredEvent }: Props) {
  const { startAt, endAt, tag, category } = calendarEvent;
  const { totalStressPts } = scoredEvent;

  const borderColour = getBorderColour(totalStressPts);
  const ptsColour    = getPtsColour(totalStressPts);
  const isPersonal   = tag === 'personal';

  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-l-4 ${borderColour} bg-zinc-900 rounded-r-lg`}>

      {/* Time column */}
      <div className="flex flex-col items-end min-w-[72px]">
        <span className="text-xs font-medium text-zinc-300">
          {formatTime(startAt)}
        </span>
        <span className="text-xs text-zinc-500">
          {formatTime(endAt)}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-zinc-700 mt-0.5" />

      {/* Event info */}
      <div className="flex flex-col flex-1 gap-0.5">
        <div className="flex items-center gap-2">
          {/* Work / Personal badge */}
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            isPersonal
              ? 'bg-violet-900 text-violet-300'
              : 'bg-zinc-700 text-zinc-300'
          }`}>
            {isPersonal ? 'Personal' : 'Work'}
          </span>
          {/* Category label */}
          <span className="text-xs text-zinc-400">
            {getCategoryLabel(category)}
          </span>
        </div>
      </div>

      {/* Stress pts */}
      <div className={`text-sm font-semibold tabular-nums ${ptsColour}`}>
        +{totalStressPts} pts
      </div>

    </div>
  );
}
