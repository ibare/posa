import { oklchToHex } from '../../../color/oklch';
import {
  SHADE_INDICES,
  type PrimitiveId,
  type PrimitiveScale,
} from '../../../ir/types';

type Item = {
  primitive: PrimitiveScale;
  slotCount: number;
};

type Props = {
  familyLabel: string;
  items: Item[];
  onSelect: (primitiveId: PrimitiveId) => void;
};

export function OtherPrimitives({ familyLabel, items, onSelect }: Props) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-stone-600 font-mono mb-2">
        Other {familyLabel}s you've used
      </div>
      <div className="space-y-1.5">
        {items.map(({ primitive, slotCount }) => (
          <button
            key={primitive.id}
            type="button"
            onClick={() => onSelect(primitive.id)}
            className="w-full flex items-center gap-3 rounded-md border border-stone-200 bg-white hover:border-stone-500 px-2.5 py-2 transition text-left"
          >
            <span className="w-20 shrink-0 font-mono text-xs text-stone-900 truncate">
              {primitive.id}
            </span>
            <span className="flex-1 flex h-5 rounded overflow-hidden ring-1 ring-stone-200">
              {SHADE_INDICES.map((shade) => {
                const color = primitive.scale[shade];
                const hex = oklchToHex(color.L, color.C, color.H);
                return (
                  <span
                    key={shade}
                    className="flex-1"
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
            </span>
            <span className="font-mono text-[10px] text-stone-500 tabular-nums shrink-0">
              {slotCount} slot{slotCount === 1 ? '' : 's'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

