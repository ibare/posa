import { oklchToHex } from '../../../color/oklch';
import {
  SHADE_INDICES,
  type PrimitiveScale,
  type ShadeIndex,
} from '../../../ir/types';

type Props = {
  primitive: PrimitiveScale;
  selectedShade: ShadeIndex;
  usedShades: ShadeIndex[];
  onSelectShade: (shade: ShadeIndex) => void;
};

export function MyPrimitive({
  primitive,
  selectedShade,
  usedShades,
  onSelectShade,
}: Props) {
  const usedSet = new Set(usedShades);
  const usedExcludingCurrent = usedShades.filter((s) => s !== selectedShade);

  return (
    <div className="rounded-md border border-stone-900/10 bg-stone-900/[0.02] p-3">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
            My
          </span>
          <span className="font-mono text-sm text-stone-900">
            {primitive.id}
          </span>
        </div>
        <span className="text-[10px] font-mono text-stone-500 tabular-nums">
          {usedSet.size} / 11 shades in use
        </span>
      </div>

      <div className="flex items-end gap-0.5">
        {SHADE_INDICES.map((shade) => {
          const color = primitive.scale[shade];
          const hex = oklchToHex(color.L, color.C, color.H);
          const isSelected = shade === selectedShade;
          const isUsedByOther = usedExcludingCurrent.includes(shade);
          return (
            <div
              key={shade}
              className="relative flex-1 flex flex-col items-center"
            >
              {isSelected && (
                <span className="text-[9px] font-mono text-stone-900 leading-none mb-0.5">
                  ▼
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectShade(shade)}
                aria-label={`shade ${shade}`}
                className={[
                  'relative w-full h-12 rounded-sm transition transform origin-bottom',
                  'hover:scale-y-110 hover:z-10',
                  isSelected
                    ? 'ring-2 ring-stone-900 scale-y-110 z-10'
                    : '',
                ].join(' ')}
                style={{ backgroundColor: hex }}
                title={`${shade} · ${hex}`}
              >
                {isUsedByOther && (
                  <span className="absolute left-1/2 bottom-1 -translate-x-1/2 w-1 h-1 rounded-full bg-white/90" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-0.5 mt-1">
        {SHADE_INDICES.map((shade) => {
          const isSelected = shade === selectedShade;
          return (
            <span
              key={shade}
              className={[
                'flex-1 text-center text-[9px] font-mono tabular-nums',
                isSelected
                  ? 'text-stone-900 font-medium'
                  : 'text-stone-400',
              ].join(' ')}
            >
              {shade}
            </span>
          );
        })}
      </div>

      <p className="text-[11px] text-stone-600 mt-2 leading-snug">
        Change this role's shade — click any position above. Primitive stays intact.
      </p>
    </div>
  );
}
