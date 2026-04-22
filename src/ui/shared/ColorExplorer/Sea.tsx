import { oklchToHex } from '../../../color/oklch';
import type { OKLCH } from '../../../ir/types';
import type { SeaRow } from './seas/shared';

type Props = {
  rows: SeaRow[];
  value: OKLCH | null;
  onPick: (color: OKLCH) => void;
};

const EPS_L = 0.01;
const EPS_C = 0.005;
const EPS_H = 1;

function matches(a: OKLCH, b: OKLCH | null): boolean {
  if (!b) return false;
  if (Math.abs(a.L - b.L) > EPS_L) return false;
  if (Math.abs(a.C - b.C) > EPS_C) return false;
  if (a.C < 0.01 && b.C < 0.01) return true;
  const dh = Math.abs(((a.H - b.H) % 360) + 360) % 360;
  return Math.min(dh, 360 - dh) < EPS_H;
}

export function Sea({ rows, value, onPick }: Props) {
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <SeaRowView key={row.label} row={row} value={value} onPick={onPick} />
      ))}
    </div>
  );
}

function SeaRowView({ row, value, onPick }: { row: SeaRow; value: OKLCH | null; onPick: (c: OKLCH) => void }) {
  const cols = Math.min(row.tiles.length, 12);
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.15em] text-stone-600 font-mono">
          {row.label}
        </span>
        <span className="text-[10px] text-stone-400 italic">{row.hint}</span>
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {row.tiles.map((tile, i) => {
          const hex = oklchToHex(tile.L, tile.C, tile.H);
          const isSelected = matches(tile, value);
          return (
            <button
              key={i}
              type="button"
              aria-label={`${row.label} tile ${i + 1}`}
              onClick={() => onPick(tile)}
              className={[
                'aspect-square rounded-md transition transform',
                'hover:scale-[1.08] hover:z-10 relative',
                isSelected
                  ? 'ring-2 ring-stone-900 ring-offset-2 ring-offset-white scale-105 z-10'
                  : '',
              ].join(' ')}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          );
        })}
      </div>
    </div>
  );
}
