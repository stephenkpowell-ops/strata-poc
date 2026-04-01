'use client';

/**
 * src/app/calendar/page.tsx
 *
 * Calendar screen.
 *
 * Key fix: the StressEngine is called locally for whichever day is
 * selected, using only that day's events. This means every day's
 * EventRow and EventDetail panels show correct per-event breakdowns
 * regardless of which day is tapped.
 *
 * The store's dailyResult is no longer used here — it is scoped to
 * March 25 only and is used by the home/burnout screens instead.
 */

import { useState, useMemo } from 'react';
import { useStrata } from '@/lib/store';
import { computeDailyScore } from '@/lib/StressEngine';
import DayStrip from '@/components/DayStrip';
import EventRow from '@/components/EventRow';
import GapIndicator from '@/components/GapIndicator';
import EventDetail from '@/components/EventDetail';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth()    === db.getMonth()    &&
    da.getDate()     === db.getDate()
  );
}

function minutesBetween(endAt: Date | string, startAt: Date | string): number {
  return Math.round(
    (new Date(startAt).getTime() - new Date(endAt).getTime()) / 60_000
  );
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
  const { scores, forecastScores, events, checkInValue } = useStrata();

  const allScores    = [...scores, ...forecastScores];
  const historyCount = scores.length;

  const [selectedIndex,   setSelectedIndex]   = useState(scores.length - 1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedScore = allScores[selectedIndex];
  const selectedDate  = selectedScore?.date;
  const isForecast    = selectedIndex >= historyCount;

  // Filter events to selected day
  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
      .filter(e => isSameDay(e.startAt, selectedDate))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [events, selectedDate]);

  // Score the selected day's events locally using the StressEngine
  const dayResult = useMemo(() => {
    if (dayEvents.length === 0) return null;
    return computeDailyScore({
      events: dayEvents,
      calendarPrefs: [
        { includeInScoring: true, contextSwitchPenalties: true, recoveryEventsReduce: true },
      ],
      checkInValue: isForecast ? 0 : checkInValue,
    });
  }, [dayEvents, checkInValue, isForecast]);

  const scoredEventMap = useMemo(() => {
    if (!dayResult) return new Map();
    return new Map(dayResult.scoredEvents.map(s => [s.eventId, s]));
  }, [dayResult]);

  // Calendar pts: use live StressEngine output when events exist,
  // otherwise fall back to the stored fixture value
  const calendarPtsToday = dayResult
    ? dayResult.calendarPts
    : selectedScore?.calendarPts ?? 0;

  const selectedEvent  = selectedEventId
    ? events.find(e => e.id === selectedEventId) ?? null
    : null;
  const selectedScored = selectedEventId
    ? scoredEventMap.get(selectedEventId) ?? null
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* Day strip */}
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
              ? minutesBetween(event.endAt, nextEvent.startAt)
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
