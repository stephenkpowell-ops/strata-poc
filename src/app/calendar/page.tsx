'use client';

/**
 * src/app/calendar/page.tsx
 *
 * Calendar screen.
 *
 * The day strip shows all score records — both historical (Mar 17–25)
 * and forecast (Mar 26–28) — so the user can tap into forecast days
 * and see their planned events. Forecast days are visually distinguished
 * with a dashed dot border to signal they are projected, not actual.
 *
 * Load thresholds (dots + summary bar):
 *   green  = calendarPts < 35   — light day
 *   indigo = calendarPts 36–70  — elevated load
 *   orange = calendarPts >= 71  — high load day
 */

import { useState } from 'react';
import { useStrata } from '@/lib/store';
import DayStrip from '@/components/DayStrip';
import EventRow from '@/components/EventRow';
import GapIndicator from '@/components/GapIndicator';
import EventDetail from '@/components/EventDetail';

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

function getStressColor(pts: number): string {
  if (pts >= 71) return 'text-orange-400';
  if (pts >= 36) return 'text-indigo-400';
  return 'text-emerald-400';
}

function getStressLabel(pts: number): string {
  if (pts >= 71) return 'High load day';
  if (pts >= 36) return 'Elevated load';
  return 'Light day';
}

function getStressBg(pts: number): string {
  if (pts >= 71) return 'bg-orange-950 border-orange-900';
  if (pts >= 36) return 'bg-indigo-950 border-indigo-900';
  return 'bg-emerald-950 border-emerald-900';
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY STRESS SUMMARY BAR
// ─────────────────────────────────────────────────────────────────────────────

function DailyStressSummary({
  calendarPts,
  eventCount,
  isForecast,
}: {
  calendarPts: number;
  eventCount:  number;
  isForecast:  boolean;
}) {
  const color = getStressColor(calendarPts);
  const label = getStressLabel(calendarPts);
  const bg    = getStressBg(calendarPts);

  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b ${bg}`}>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>
          {label}
        </span>
        <span className="text-zinc-600 text-xs">
          · {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </span>
        {isForecast && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950 border border-indigo-800 px-1.5 py-0.5 rounded-full">
            Forecast
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-zinc-500">Meeting load</span>
        <span className={`text-sm font-bold tabular-nums ${color}`}>
          +{calendarPts} pts
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { scores, forecastScores, events, dailyResult } = useStrata();

  // Combine historical and forecast scores for the day strip
  const allScores    = [...scores, ...forecastScores];
  const historyCount = scores.length; // first N entries are historical

  const [selectedIndex,   setSelectedIndex]   = useState(scores.length - 1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedScore  = allScores[selectedIndex];
  const selectedDate   = selectedScore?.date;
  const isForecast     = selectedIndex >= historyCount;
  const calendarPtsToday = selectedScore?.calendarPts ?? 0;

  const dayEvents = events
    .filter(e => selectedDate && isSameDay(new Date(e.startAt), new Date(selectedDate)))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const scoredEventMap = new Map(
    dailyResult.scoredEvents.map(s => [s.eventId, s])
  );

  const selectedEvent  = selectedEventId ? events.find(e => e.id === selectedEventId) ?? null : null;
  const selectedScored = selectedEventId ? scoredEventMap.get(selectedEventId) ?? null : null;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* Day strip — all 12 days */}
      <DayStrip
        scores={allScores}
        selectedIndex={selectedIndex}
        onSelectDay={(i) => {
          setSelectedIndex(i);
          setSelectedEventId(null);
        }}
      />

      {/* Daily stress summary bar */}
      <DailyStressSummary
        calendarPts={calendarPtsToday}
        eventCount={dayEvents.length}
        isForecast={isForecast}
      />

      {/* Timeline */}
      <div className="flex flex-col flex-1 gap-0 p-4">
        {dayEvents.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-zinc-600 text-sm">
            No events for this day
          </div>
        ) : (
          dayEvents.map((event, i) => {
            const scoredEvent = scoredEventMap.get(event.id);
            if (!scoredEvent) return null;

            const nextEvent  = dayEvents[i + 1];
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

      {/* Event detail panel */}
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
