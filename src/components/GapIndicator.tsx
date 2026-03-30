'use client';

/**
 * GapIndicator.tsx
 *
 * Renders a gap label between two consecutive calendar events.
 *
 * Three states based on gap duration:
 *   >= 30 min  → green  "Recovery window · Nmin"
 *   < 15 min   → amber  "No gap — stress peak risk"
 *   15–29 min  → nothing rendered (partial buffer, no label)
 *
 * Usage:
 *   <GapIndicator gapMinutes={45} />
 */

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  gapMinutes: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function GapIndicator({ gapMinutes }: Props) {
  // Recovery window — 30+ minutes
  if (gapMinutes >= 30) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5">
        <div className="h-px flex-1 bg-emerald-900" />
        <span className="text-xs font-medium text-emerald-400 whitespace-nowrap">
          Recovery window · {gapMinutes} min
        </span>
        <div className="h-px flex-1 bg-emerald-900" />
      </div>
    );
  }

  // No gap — stress peak risk (under 15 minutes)
  if (gapMinutes < 15) {
    return (
      <div className="flex items-center gap-2 px-4 py-1.5">
        <div className="h-px flex-1 bg-amber-900" />
        <span className="text-xs font-medium text-amber-400 whitespace-nowrap">
          No gap — stress peak risk
        </span>
        <div className="h-px flex-1 bg-amber-900" />
      </div>
    );
  }

  // Partial buffer (15–29 min) — no label rendered
  return null;
}
