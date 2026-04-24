import type { OKLCH } from '../../../../ir/types';

export type SeaRow = {
  label: string;
  hint: string;
  tiles: OKLCH[];
};

export type SeaModule = {
  tierA: () => SeaRow[];
  tierB: () => SeaRow[];
};

export const c = (L: number, C: number, H: number): OKLCH => ({ L, C, H });

/** start(포함) ~ end(포함)에서 steps개의 균일 hue 샘플을 만든다. */
export const hueSweep = (
  start: number,
  end: number,
  steps: number,
  L: number,
  C: number,
): OKLCH[] => {
  if (steps <= 1) return [c(L, C, start)];
  const out: OKLCH[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    out.push(c(L, C, start + (end - start) * t));
  }
  return out;
};

/** 색상환 전체를 11개로 샘플링 (Tailwind 11-step 규약에 맞춤). */
export const fullHueRing = (L: number, C: number): OKLCH[] =>
  hueSweep(0, 330, 11, L, C);
