'use client';

/**
 * src/app/calendar/page.tsx
 *
 * Calendar screen — the core differentiator of the Strata POC.
 *
 * Current state (Step 13 — gap indicators):
 *   - DayStrip renders across the top with colour-coded stress dots
 *   - Selecting a day filters events to that day and renders them
 *     in time order via EventRow
 *   - GapIndicator is rendered between consecutive events:
 *       >= 30 min gap  → green "Recovery window · Nmin"
 *       < 15 min gap   → amber "No gap — stress peak risk"
 *       15–29 min gap  → nothing (partial buffer, no label)
 *
 * Step still to come:
 *   Step 14 — Event detail tap-through
 */

import { useState } from 'react';
import { useStrata } from '@/lib/store';
import DayStrip from '@/components/DayStrip';
import EventRow from '@/components/EventRow';
import GapIndicator from '@/components/GapIndicator';

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

function minutesBetween(endAt: Date, startAt: Date): number {
  return Math.round((startAt.getTime() - endAt.getTime()) / 60_000);
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

      {/* Timeline — steps 11, 12, 13 */}
      <div className="flex flex-col flex-1 gap-0 p-4">

        {dayEvents.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-zinc-600 text-sm">
            No events for this day
          </div>
        ) : (
          dayEvents.map((event, i) => {
            const scoredEvent = scoredEventMap.get(event.id);
            if (!scoredEvent) return null;

            // Compute gap between this event and the next one
            const nextEvent = dayEvents[i + 1];
            const gapMinutes = nextEvent
              ? minutesBetween(new Date(event.endAt), new Date(nextEvent.startAt))
              : null;

            return (
              <div key={event.id}>
                <EventRow
                  calendarEvent={event}
                  scoredEvent={scoredEvent}
                />
                {/* Gap indicator between this event and the next */}
                {gapMinutes !== null && (
                  <GapIndicator gapMinutes={gapMinutes} />
                )}
              </div>
            );
          })
        )}

      </div>

    </div>
  );
}
