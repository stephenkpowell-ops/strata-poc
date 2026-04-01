'use client';

/**
 * CheckInCard.tsx
 *
 * Daily check-in card with rule-based prediction.
 *
 * Before the user logs a check-in, the predicted option is highlighted
 * with a subtle indigo ring and a "Predicted" badge. The prediction
 * disappears once the user makes an explicit selection.
 *
 * The prediction is purely rule-based for the POC — in the MVP it
 * would be replaced by a model trained on historical check-in data.
 *
 * Options:
 *   Zero      →   0
 *   Low       →  25
 *   Moderate  →  50
 *   High      →  75
 *   Critical  → 100
 */

import type { PredictionInput, CheckInValue } from '@/lib/predictCheckIn';
import { predictCheckIn, getPredictionRationale } from '@/lib/predictCheckIn';

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  currentValue:    number;
  onSelect:        (value: number) => void;
  predictionInput: PredictionInput;
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

export default function CheckInCard({ currentValue, onSelect, predictionInput }: Props) {
  const selected   = OPTIONS.find(o => o.value === currentValue);
  const hasLogged  = currentValue !== 0 || selected?.value === 0;

  // Compute prediction — always run so it's available for the rationale
  const predicted: CheckInValue = predictCheckIn(predictionInput);
  const rationale  = getPredictionRationale(predictionInput, predicted);

  // Show prediction only when the user hasn't yet logged today
  // "not logged" = currentValue is 0 AND the user hasn't tapped Zero explicitly
  // We use a simple heuristic: if value is 0, treat as unlogged
  // (the user can still tap Zero deliberately — the prediction just clears)
  const showPrediction = currentValue === 0;

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
        {selected && !showPrediction && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${selected.borderColor} ${selected.textColor} bg-transparent`}>
            {selected.label}
          </span>
        )}
        {showPrediction && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-700 text-indigo-400 bg-indigo-950">
            Predicted
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
          const isSelected  = !showPrediction && currentValue === option.value;
          const isPredicted = showPrediction && option.value === predicted;

          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${
                isSelected
                  ? `border ${option.borderColor} bg-zinc-800`
                  : isPredicted
                    ? 'border border-indigo-600 border-dashed bg-indigo-950/40'
                    : 'border border-zinc-800 bg-zinc-950 hover:border-zinc-600'
              }`}
            >
              {/* Color dot */}
              <div className={`w-2.5 h-2.5 rounded-full ${option.dotColor} ${
                isSelected || isPredicted ? 'opacity-100' : 'opacity-40'
              }`} />
              {/* Label */}
              <span className={`text-[9px] font-medium leading-tight text-center ${
                isSelected  ? option.textColor :
                isPredicted ? 'text-indigo-400' :
                'text-zinc-600'
              }`}>
                {option.label}
              </span>
              {/* Predicted badge */}
              {isPredicted && (
                <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-500">
                  predicted
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Prediction rationale — shown before logging */}
      {showPrediction && (
        <div className="flex items-start gap-2 bg-zinc-800 rounded-xl px-3 py-2">
          <span className="text-indigo-400 text-xs mt-0.5 flex-shrink-0">→</span>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {rationale}
          </p>
        </div>
      )}

      {/* Contribution note — shown after logging */}
      {!showPrediction && (
        <p className="text-[10px] text-zinc-600 text-center">
          Check-in: {selected?.label} · amplifies calendar load{currentValue === 0 ? ' (reduced)' : currentValue <= 50 ? '' : ' (amplified)'}
        </p>
      )}

    </div>
  );
}
