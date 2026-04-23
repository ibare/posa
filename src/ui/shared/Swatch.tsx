import type { CSSProperties } from 'react';
import { isInSrgbGamut, oklchToHex } from '../../color/oklch';
import type { OKLCH } from '../../ir/types';

export type SwatchSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<SwatchSize, string> = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

const CHECKER_TILE_PX: Record<SwatchSize, number> = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
};

/** 이미지 에디터 스타일 체스판 패턴 — 색 미지정 시 "비어있음"을 시각적으로 명확히 전달. */
export function checkerboardStyle(tile = 8): CSSProperties {
  const half = tile / 2;
  return {
    backgroundColor: '#ffffff',
    backgroundImage:
      'linear-gradient(45deg, #d6d3d1 25%, transparent 25%), linear-gradient(-45deg, #d6d3d1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d6d3d1 75%), linear-gradient(-45deg, transparent 75%, #d6d3d1 75%)',
    backgroundSize: `${tile}px ${tile}px`,
    backgroundPosition: `0 0, 0 ${half}px, ${half}px -${half}px, -${half}px 0`,
  };
}

const BADGE_TEXT_CLASS: Record<SwatchSize, string> = {
  xs: 'text-[7px]',
  sm: 'text-[8px]',
  md: 'text-[9px]',
  lg: 'text-[10px]',
};

type Props = {
  /** 단일 색 모드. colors와 동시에 주면 colors가 우선. */
  color?: OKLCH | null;
  /** 다중 색 모드(분할 swatch). distinct 색 목록을 외부에서 dedup해 넘긴다. */
  colors?: OKLCH[];
  size?: SwatchSize;
  dim?: boolean;
  title?: string;
};

export function Swatch({
  color,
  colors,
  size = 'md',
  dim = false,
  title,
}: Props) {
  if (colors && colors.length > 0) {
    return (
      <MultiSwatch colors={colors} size={size} dim={dim} title={title} />
    );
  }

  if (!color) {
    return (
      <div
        className={`${SIZE_CLASS[size]} rounded-md ring-1 ring-stone-300/70 ${
          dim ? 'opacity-40' : ''
        }`}
        style={checkerboardStyle(CHECKER_TILE_PX[size])}
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

function MultiSwatch({
  colors,
  size,
  dim,
  title,
}: {
  colors: OKLCH[];
  size: SwatchSize;
  dim: boolean;
  title?: string;
}) {
  const total = colors.length;
  const visible = colors.slice(0, 4);
  const overflow = total - visible.length;
  const hexes = visible.map((c) => oklchToHex(c.L, c.C, c.H));

  const label =
    title ?? `${total} direct color${total === 1 ? '' : 's'} below`;

  return (
    <div
      className={`relative ${SIZE_CLASS[size]} rounded-md ring-1 ring-stone-400/80 overflow-hidden ${
        dim ? 'opacity-60' : ''
      }`}
      title={label}
      aria-label={label}
    >
      <SwatchSplit hexes={hexes} />
      {overflow > 0 && (
        <span
          className={`absolute bottom-0 right-0 px-1 leading-none py-0.5 bg-stone-900/85 text-white font-mono ${BADGE_TEXT_CLASS[size]}`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

function SwatchSplit({ hexes }: { hexes: string[] }) {
  if (hexes.length === 1) {
    return <div className="w-full h-full" style={{ backgroundColor: hexes[0] }} />;
  }
  if (hexes.length === 2) {
    return (
      <div className="w-full h-full flex">
        <div className="flex-1" style={{ backgroundColor: hexes[0] }} />
        <div className="flex-1" style={{ backgroundColor: hexes[1] }} />
      </div>
    );
  }
  if (hexes.length === 3) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex-1" style={{ backgroundColor: hexes[0] }} />
        <div className="flex-1 flex">
          <div className="flex-1" style={{ backgroundColor: hexes[1] }} />
          <div className="flex-1" style={{ backgroundColor: hexes[2] }} />
        </div>
      </div>
    );
  }
  // 4
  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2">
      <div style={{ backgroundColor: hexes[0] }} />
      <div style={{ backgroundColor: hexes[1] }} />
      <div style={{ backgroundColor: hexes[2] }} />
      <div style={{ backgroundColor: hexes[3] }} />
    </div>
  );
}
