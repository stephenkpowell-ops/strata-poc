'use client';

/**
 * src/app/recovery/page.tsx
 *
 * Recovery protocol picker — Step 23.
 *
 * Shows three protocol cards with Breathing Reset pre-selected.
 * The Breathing Reset card includes an inline "Start Breathing Reset →"
 * button. Cognitive Offload and Tension Release are visible but disabled.
 *
 * Context banner at the top explains why this session is recommended
 * based on the current score from the store.
 */

import Link from 'next/link';
import { useStrata } from '@/lib/store';

// ─────────────────────────────────────────────────────────────────────────────
// PROTOCOL CARD
// ─────────────────────────────────────────────────────────────────────────────

function ProtocolCard({
  title,
  description,
  duration,
  impact,
  selected,
  disabled,
  showStart,
}: {
  title:       string;
  description: string;
  duration:    string;
  impact:      string;
  selected?:   boolean;
  disabled?:   boolean;
  showStart?:  boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl p-4 border transition-colors ${
      disabled
        ? 'bg-zinc-900 border-zinc-800 opacity-40'
        : selected
          ? 'bg-indigo-950 border-indigo-600'
          : 'bg-zinc-900 border-zinc-700'
    }`}>

      {/* Header row */}
      <div className="flex items-start justify-between">
        <span className={`text-sm font-semibold ${
          disabled ? 'text-zinc-500' : selected ? 'text-indigo-300' : 'text-white'
        }`}>
          {title}
        </span>
        {selected && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-900 px-2 py-0.5 rounded-full">
            Recommended
          </span>
        )}
        {disabled && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        )}
      </div>

      {/* Description */}
      <p className={`text-xs leading-relaxed ${disabled ? 'text-zinc-600' : 'text-zinc-400'}`}>
        {description}
      </p>

      {/* Duration and impact */}
      <div className="flex items-center gap-3 pt-1">
        <span className={`text-xs ${disabled ? 'text-zinc-600' : 'text-zinc-500'}`}>
          {duration}
        </span>
        <span className="text-zinc-700">·</span>
        <span className={`text-xs font-medium ${
          disabled ? 'text-zinc-600' : selected ? 'text-emerald-400' : 'text-zinc-400'
        }`}>
          {impact}
        </span>
      </div>

      {/* Inline start button — only on the selected card */}
      {showStart && (
        <Link
          href="/recovery/session"
          className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl py-2.5 transition-colors mt-1"
        >
          Start Breathing Reset →
        </Link>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function RecoveryPage() {
  const { scores } = useStrata();
  const latest     = scores[scores.length - 1];
  const score      = latest?.totalScore ?? 0;
  const avg        = latest?.rollingAvg7d ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Strata
          </span>
          <span className="text-xl font-bold text-white">
            Recovery
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 pb-8">

        {/* Context banner */}
        <div className="flex flex-col gap-1 bg-amber-950 border border-amber-800 rounded-2xl p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Why now
          </span>
          <p className="text-sm text-amber-200 leading-snug">
            Score at {score} · {avg} rolling avg. A reset now reduces tomorrow&#39;s baseline.
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Acute high load → Breathing Reset recommended
          </p>
        </div>

        {/* Protocol cards */}
        <div className="flex flex-col gap-3">
          <ProtocolCard
            title="Breathing Reset"
            description="Box breathing: 4-count inhale, hold, exhale, hold. 4 rounds. Regulates the nervous system and drops cortisol. Effective within 4 minutes."
            duration="5 min"
            impact="−6 pts estimated"
            selected
            showStart
          />
          <ProtocolCard
            title="Cognitive Offload"
            description="Three steps: Dump — timed 2-min freewrite. Sort — categorise each item. Release — acknowledge what was released. Clears decision fatigue."
            duration="5 min"
            impact="−8 pts estimated"
            disabled
          />
          <ProtocolCard
            title="Tension Release"
            description="Progressive muscle release targeting neck, jaw, and shoulders — the physical sites of accumulated cognitive load. 4 guided stages."
            duration="4 min"
            impact="−5 pts estimated"
            disabled
          />
        </div>

      </div>

    </div>
  );
}
