import type { ColorRef, IR, OKLCH } from '../../../../ir/types';

/**
 * ColorExplorer 추천 섹션에서 row generator들이 공유하는 입력 컨텍스트.
 * role은 attribute id(background/text/...) 또는 symbol id(primary/...).
 */
export type RowContext = {
  role: string;
  value: OKLCH | null;
  assignment: ColorRef | null;
  ir: IR;
};

/** 추천 row — 항상 11 타일을 보장. */
export type Row = {
  id: string;
  /** explorer i18n namespace 하위 key. */
  labelKey: string;
  hintKey: string;
  tiles: OKLCH[];
};

/**
 * 컨텍스트를 받아 row를 산출하거나, 해당 추천이 유의미하지 않으면 null.
 * null이면 상위에서 skip — row 자체가 숨겨진다.
 */
export type Recommender = (ctx: RowContext) => Row | null;

/** 모든 row가 맞춰야 하는 타일 수. */
export const TILE_COUNT = 11;

export function linspace(start: number, end: number, n: number): number[] {
  if (n <= 1) return [start];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(start + (end - start) * t);
  }
  return out;
}

export function c(L: number, C: number, H: number): OKLCH {
  return { L, C, H };
}
