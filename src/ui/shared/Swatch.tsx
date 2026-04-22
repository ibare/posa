import { isInSrgbGamut, oklchToHex } from '../../color/oklch';
import type { OKLCH } from '../../ir/types';

export type SwatchSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<SwatchSize, string> = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

type Props = {
  color: OKLCH | null;
  size?: SwatchSize;
  dim?: boolean;
  title?: string;
};

export function Swatch({ color, size = 'md', dim = false, title }: Props) {
  if (!color) {
    return (
      <div
        className={`${SIZE_CLASS[size]} rounded-md border border-dashed border-stone-300 ${
          dim ? 'opacity-40' : ''
        }`}
        title={title ?? 'no color'}
        aria-label={title ?? 'no color'}
      />
    );
  }

  const hex = oklchToHex(color.L, color.C, color.H);
  const inGamut = isInSrgbGamut(color.L, color.C, color.H);

  return (
    <div
      className={`relative ${SIZE_CLASS[size]} rounded-md ring-1 ring-stone-200/70 ${
        dim ? 'opacity-60' : ''
      }`}
      style={{ backgroundColor: hex }}
      title={title ?? hex}
      aria-label={title ?? hex}
    >
      {!inGamut && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"
          title="outside sRGB gamut"
          aria-label="outside sRGB gamut"
        />
      )}
    </div>
  );
}
