'use client';

/**
 * src/app/calendar/page.tsx
 *
 * Calendar screen — the core differentiator of the Strata POC.
 *
 * Current state (Step 10 — DayStrip only):
 *   - DayStrip renders across the top with colour-coded stress dots
 *   - Selecting a day updates selectedIndex
 *   - Placeholder below the strip for the timeline (Step 11)
 *
 * Steps still to come:
 *   Step 11 — Timeline events list
 *   Step 12 — Stress colour coding on event blocks
 *   Step 13 — Gap indicators between events
 *   Step 14 — Event detail tap-through
 */

import { useState } from 'react';
import { useStrata } from '@/lib/store';
import DayStrip from '@/components/DayStrip';

export default function CalendarPage() {
  const { scores } = useStrata();

  // Default to the most recent day
  const [selectedIndex, setSelectedIndex] = useState(scores.length - 1);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* Day strip — step 10 */}
      <DayStrip
        scores={scores}
        selectedIndex={selectedIndex}
        onSelectDay={setSelectedIndex}
      />

      {/* Timeline placeholder — replaced in step 11 */}
      <div className="flex flex-col flex-1 items-center justify-center gap-2 text-zinc-600">
        <span className="text-sm">Timeline coming in step 11</span>
        <span className="text-xs">Selected day index: {selectedIndex}</span>
      </div>

    </div>
  );
}
