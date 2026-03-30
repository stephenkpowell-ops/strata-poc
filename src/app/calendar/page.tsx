'use client';

/**
 * src/app/calendar/page.tsx
 *
 * Calendar screen — the core differentiator of the Strata POC.
 *
 * Current state (Step 11 — timeline events list):
 *   - DayStrip renders across the top with colour-coded stress dots
 *   - Selecting a day filters events to that day and renders them
 *     in time order via EventRow
 *   - Events matching the selected day's date are shown in the timeline
 *   - Empty state shown when no events exist for the selected day
 *
 * Steps still to come:
 *   Step 13 — Gap indicators between events
 *   Step 14 — Event detail tap-through
 */

import { useState } from 'react';
import { useStrata } from '@/lib/store';
import DayStrip from '@/components/DayStrip';
import EventRow from '@/components/EventRow';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { scores, events, dailyResult } = useStrata();

  // Default to the most recent day
  const [selectedIndex, setSelectedIndex] = useState(scores.length - 1);

  // The date of the selected day tab
  const selectedDate = scores[selectedIndex]?.date;

  // Filter events to those starting on the selected day, sorted by startAt
  const dayEvents = events
    .filter(e => selectedDate && isSameDay(new Date(e.startAt), new Date(selectedDate)))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // Match each day event to its scored counterpart from the StressEngine output
  const scoredEventMap = new Map(
    dailyResult.scoredEvents.map(s => [s.eventId, s])
  );

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* Day strip — step 10 */}
      <DayStrip
        scores={scores}
        selectedIndex={selectedIndex}
        onSelectDay={setSelectedIndex}
      />

      {/* Timeline — step 11 */}
      <div className="flex flex-col flex-1 gap-2 p-4">

        {dayEvents.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-zinc-600 text-sm">
            No events for this day
          </div>
        ) : (
          dayEvents.map(event => {
            const scoredEvent = scoredEventMap.get(event.id);

            // If the event has no scored counterpart, skip it
            if (!scoredEvent) return null;

            return (
              <EventRow
                key={event.id}
                calendarEvent={event}
                scoredEvent={scoredEvent}
              />
            );
          })
        )}

      </div>

    </div>
  );
}
