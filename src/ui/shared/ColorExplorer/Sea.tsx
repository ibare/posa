import { useTranslation } from 'react-i18next';
import { oklchToHex } from '../../../color/oklch';
import type { OKLCH } from '../../../ir/types';
import type { Row } from './recommenders/shared';
import { matchesOKLCH } from './utils';

type Props = {
  rows: Row[];
  value: OKLCH | null;
  onPick: (color: OKLCH) => void;
};

export function Sea({ rows, value, onPick }: Props) {
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <SeaRowView key={row.id} row={row} value={value} onPick={onPick} />
      ))}
    </div>
  );
}

function SeaRowView({
  row,
  value,
  onPick,
}: {
  row: Row;
  value: OKLCH | null;
  onPick: (c: OKLCH) => void;
}) {
  const { t } = useTranslation('explorer');
  const cols = Math.min(row.tiles.length, 11);
  const label = t(row.labelKey);
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.15em] text-stone-600 font-mono">
          {label}
        </span>
        <span className="text-[10px] text-stone-400 italic">
          {t(row.hintKey)}
        </span>
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {row.tiles.map((tile, i) => {
          const hex = oklchToHex(tile.L, tile.C, tile.H);
          const isSelected = matchesOKLCH(tile, value);
          return (
            <button
              key={i}
              type="button"
              aria-label={`${label} tile ${i + 1}`}
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
