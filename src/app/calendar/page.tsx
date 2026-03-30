'use client';

/**
 * src/app/calendar/page.tsx
 *
 * Calendar screen — the core differentiator of the Strata POC.
 *
 * Current state (Step 14 — event detail tap-through):
 *   - DayStrip renders across the top with colour-coded stress dots
 *   - Selecting a day filters events to that day and renders them
 *     in time order via EventRow
 *   - GapIndicator is rendered between consecutive events
 *   - Tapping an EventRow opens the EventDetail slide-up panel
 *     showing the full stress breakdown for that event
 *   - Tapping the backdrop or close button dismisses the panel
 *
 * Steps 10–14 are now complete.
 */

import { useState } from 'react';
import { useStrata } from '@/lib/store';
import DayStrip from '@/components/DayStrip';
import EventRow from '@/components/EventRow';
import GapIndicator from '@/components/GapIndicator';
import EventDetail from '@/components/EventDetail';
import { CalendarEvent } from '@/lib/interfaces/types';
import { ScoredEvent } from '@/lib/StressEngine';

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

  // Selected day tab
  const [selectedIndex, setSelectedIndex] = useState(scores.length - 1);

  // Selected event for the detail panel — null means panel is closed
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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

  // Resolve the selected event and its score for the detail panel
  const selectedEvent    = selectedEventId ? events.find(e => e.id === selectedEventId) ?? null : null;
  const selectedScored   = selectedEventId ? scoredEventMap.get(selectedEventId) ?? null : null;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* Day strip — step 10 */}
      <DayStrip
        scores={scores}
        selectedIndex={selectedIndex}
        onSelectDay={(i) => {
          setSelectedIndex(i);
          setSelectedEventId(null); // close detail panel when switching days
        }}
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

            const nextEvent = dayEvents[i + 1];
            const gapMinutes = nextEvent
              ? minutesBetween(new Date(event.endAt), new Date(nextEvent.startAt))
              : null;

            return (
              <div key={event.id}>
                <EventRow
                  calendarEvent={event}
                  scoredEvent={scoredEvent}
                  onTap={() => setSelectedEventId(event.id)}
                />
                {gapMinutes !== null && (
                  <GapIndicator gapMinutes={gapMinutes} />
                )}
              </div>
            );
          })
        )}

      </div>

      {/* Event detail panel — step 14 */}
      {selectedEvent && selectedScored && (
        <EventDetail
          calendarEvent={selectedEvent}
          scoredEvent={selectedScored}
          onClose={() => setSelectedEventId(null)}
        />
      )}

    </div>
  );
}
