'use client';

/**
 * CheckInCard.tsx
 *
 * Daily check-in card for the home screen.
 *
 * Five tap-to-select options representing self-reported stress level,
 * independent of calendar load:
 *
 *   Zero      →   0  — grey dot
 *   Low       →  25  — green dot
 *   Moderate  →  50  — indigo dot
 *   High      →  75  — orange dot
 *   Critical  → 100  — red dot
 *
 * Selecting an option updates the store and recalculates totalScore live.
 *
 * Usage:
 *   <CheckInCard
 *     currentValue={checkInValue}
 *     onSelect={(value) => setCheckIn(value)}
 *   />
 */

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  currentValue: number;
  onSelect:     (value: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

const OPTIONS = [
  { label: 'Zero',     value: 0,   dotColor: 'bg-zinc-500',    textColor: 'text-zinc-400',    borderColor: 'border-zinc-500'    },
  { label: 'Low',      value: 25,  dotColor: 'bg-emerald-500', textColor: 'text-emerald-400', borderColor: 'border-emerald-500' },
  { label: 'Moderate', value: 50,  dotColor: 'bg-indigo-400',  textColor: 'text-indigo-300',  borderColor: 'border-indigo-400'  },
  { label: 'High',     value: 75,  dotColor: 'bg-orange-400',  textColor: 'text-orange-300',  borderColor: 'border-orange-400'  },
  { label: 'Critical', value: 100, dotColor: 'bg-red-500',     textColor: 'text-red-400',     borderColor: 'border-red-500'     },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckInCard({ currentValue, onSelect }: Props) {
  const selected = OPTIONS.find(o => o.value === currentValue);

  return (
    <div className="flex flex-col gap-3 bg-zinc-900 rounded-2xl p-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Daily Check-in
          </span>
          <span className="text-sm font-semibold text-white">
            How are you feeling today?
          </span>
        </div>
        {selected && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${selected.borderColor} ${selected.textColor} bg-transparent`}>
            {selected.label}
          </span>
        )}
      </div>

      {/* Sub-label */}
      <p className="text-xs text-zinc-500 leading-relaxed">
        Independent of your calendar — how is your mental load right now?
      </p>

      {/* Options */}
      <div className="flex gap-2">
        {OPTIONS.map(option => {
          const isSelected = currentValue === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                isSelected
                  ? `${option.borderColor} bg-zinc-800`
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
              }`}
            >
              {/* Color dot */}
              <div className={`w-2.5 h-2.5 rounded-full ${option.dotColor} ${
                isSelected ? 'opacity-100' : 'opacity-40'
              }`} />
              {/* Label */}
              <span className={`text-[9px] font-medium leading-tight text-center ${
                isSelected ? option.textColor : 'text-zinc-600'
              }`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Score contribution note */}
      <p className="text-[10px] text-zinc-600 text-center">
        Check-in: {selected ? selected.label : 'not logged'} · amplifies calendar load{currentValue === 0 ? ' (reduced)' : currentValue <= 50 ? '' : ' (amplified)'}
      </p>

    </div>
  );
}
