'use client';

/**
 * CheckInCard.tsx
 *
 * Daily check-in card for the home screen.
 *
 * Displays a 5-option tap-to-select stress level picker independent
 * of calendar load. The selected value updates the store and
 * recalculates the total score immediately.
 *
 * Options map to 0-100 scale:
 *   Low       →  0
 *   Moderate  → 25
 *   High      → 50
 *   Very High → 75
 *   Critical  → 100
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
  { label: 'Low',       value: 0,   color: 'bg-emerald-500', textColor: 'text-emerald-400', borderColor: 'border-emerald-500' },
  { label: 'Moderate',  value: 25,  color: 'bg-emerald-400', textColor: 'text-emerald-300', borderColor: 'border-emerald-400' },
  { label: 'High',      value: 50,  color: 'bg-indigo-400',  textColor: 'text-indigo-300',  borderColor: 'border-indigo-400'  },
  { label: 'Very High', value: 75,  color: 'bg-orange-400',  textColor: 'text-orange-300',  borderColor: 'border-orange-400'  },
  { label: 'Critical',  value: 100, color: 'bg-red-500',     textColor: 'text-red-400',     borderColor: 'border-red-500'     },
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
              <div className={`w-2.5 h-2.5 rounded-full ${option.color} ${
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
        Check-in contributes {currentValue} pts to your stress load score
      </p>

    </div>
  );
}
