'use client';

/**
 * EventDetail.tsx
 *
 * Slide-up panel showing the full stress point breakdown for a calendar event.
 *
 * Displays:
 *   - Time range and category label
 *   - Base stress pts
 *   - Each context-switch penalty that fired (non-zero only)
 *   - Total stress pts
 *   - Close button to dismiss
 *
 * Usage:
 *   <EventDetail
 *     calendarEvent={event}
 *     scoredEvent={scoredEvent}
 *     onClose={() => setSelectedEventId(null)}
 *   />
 */

import { CalendarEvent } from '@/lib/interfaces/types';
import { ScoredEvent } from '@/lib/StressEngine';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  calendarEvent: CalendarEvent;
  scoredEvent:   ScoredEvent;
  onClose:       () => void;
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

function getCategoryLabel(category: CalendarEvent['category']): string {
  switch (category) {
    case 'work':            return 'Work meeting';
    case 'active_personal': return 'Active personal';
    case 'logistical':      return 'Logistical';
    case 'recurring_admin': return 'Recurring admin';
    case 'high_stakes':     return 'High stakes';
    case 'recovery':        return 'Recovery';
    default:                return 'Event';
  }
}

function getPtsColour(pts: number): string {
  if (pts >= 15) return 'text-orange-400';
  if (pts >= 6)  return 'text-indigo-400';
  return 'text-emerald-400';
}

// ─────────────────────────────────────────────────────────────────────────────
// BREAKDOWN ROW
// ─────────────────────────────────────────────────────────────────────────────

function BreakdownRow({ label, pts }: { label: string; pts: number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-zinc-800">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-200">+{pts} pts</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function EventDetail({ calendarEvent, scoredEvent, onClose }: Props) {
  const { startAt, endAt, category, tag } = calendarEvent;
  const { breakdown, totalStressPts } = scoredEvent;
  const ptsColour = getPtsColour(totalStressPts);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-2xl p-6 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {tag === 'personal' ? 'Personal' : 'Work'}
            </span>
            <span className="text-base font-semibold text-white">
              {getCategoryLabel(category)}
            </span>
            <span className="text-xs text-zinc-400">
              {formatTime(startAt)} – {formatTime(endAt)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-xl font-light leading-none mt-1"
          >
            ✕
          </button>
        </div>

        {/* Breakdown */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Stress breakdown
          </span>

          {/* Base pts always shown */}
          <BreakdownRow label="Base score" pts={breakdown.base} />

          {/* Context-switch penalties — only shown if non-zero */}
          {breakdown.midday > 0 && (
            <BreakdownRow label="Midday penalty (during work hours)" pts={breakdown.midday} />
          )}
          {breakdown.adjacency > 0 && (
            <BreakdownRow label="Adjacency penalty (< 15 min buffer)" pts={breakdown.adjacency} />
          )}
          {breakdown.sandwich > 0 && (
            <BreakdownRow label="Sandwich penalty (work → personal → work)" pts={breakdown.sandwich} />
          )}
          {breakdown.partialBuffer > 0 && (
            <BreakdownRow label="Partial buffer (15–30 min gap)" pts={breakdown.partialBuffer} />
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm font-semibold text-white">Total stress load</span>
          <span className={`text-lg font-bold tabular-nums ${ptsColour}`}>
            +{totalStressPts} pts
          </span>
        </div>

      </div>
    </>
  );
}
