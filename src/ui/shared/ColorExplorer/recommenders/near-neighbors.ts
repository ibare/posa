import type { OKLCH } from '../../../../ir/types';
import { TILE_COUNT, linspace, type Recommender } from './shared';

/**
 * 현재 value 주변의 미세한 L 변주 11개.
 *
 * value === null 이면 row 감춤 (Phase E에서 paired attribute 기반 보강 추가 예정).
 * C, H는 현재 값 그대로 유지 — 오직 밝기만 움직인다.
 *
 * L 범위는 role별 usable 구간으로 제한한다. value.L이 그 구간을 벗어나 있거나
 * 경계에 가까우면, 램프 중심(center)을 구간 안으로 밀어 넣어 11개 타일이
 * 모두 의미 있는 범위 안에 떨어지도록 한다.
 */
export const nearNeighbors: Recommender = ({ value, role }) => {
  if (!value) return null;

  const [rMin, rMax] = roleLRange(role);
  const tiles: OKLCH[] = sampleLRamp(value, rMin, rMax);

  return {
    id: 'near-neighbors',
    labelKey: 'rows.nearNeighbors.label',
    hintKey: 'rows.nearNeighbors.hint',
    tiles,
  };
};

/** 현재 L 기준 ±SPREAD 주변에서 11개 L 샘플. */
const SPREAD = 0.12;

function sampleLRamp(value: OKLCH, rMin: number, rMax: number): OKLCH[] {
  const span = rMax - rMin;
  if (span <= SPREAD * 2) {
    // role 구간이 너무 좁으면 전체를 11등분.
    return linspace(rMin, rMax, TILE_COUNT).map((L) => ({
      L,
      C: value.C,
      H: value.H,
    }));
  }

  const center = clamp(value.L, rMin + SPREAD, rMax - SPREAD);
  return linspace(center - SPREAD, center + SPREAD, TILE_COUNT).map((L) => ({
    L,
    C: value.C,
    H: value.H,
  }));
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

/**
 * role별 usable L 구간. 없는 role은 기본 [0.05, 0.98].
 * 예: text는 0.10~0.50 밝기 내에서만 가독성 있는 텍스트색이 된다.
 */
const ROLE_L_RANGE: Record<string, [number, number]> = {
  // attribute
  background: [0.85, 1.0],
  text: [0.1, 0.5],
  placeholder: [0.4, 0.7],
  icon: [0.15, 0.55],
  overlay: [0.1, 0.55],
  muted: [0.4, 0.7],
  border: [0.72, 0.92],
  track: [0.72, 0.92],
  thumb: [0.5, 0.8],
  outline: [0.25, 0.75],
  mark: [0.25, 0.75],
  fill: [0.25, 0.75],
  // symbol — 넓게 허용
  primary: [0.35, 0.75],
  secondary: [0.35, 0.75],
  accent: [0.35, 0.75],
  info: [0.35, 0.75],
  success: [0.35, 0.75],
  warning: [0.55, 0.85],
  error: [0.4, 0.7],
};

const DEFAULT_L_RANGE: [number, number] = [0.05, 0.98];

function roleLRange(role: string): [number, number] {
  return ROLE_L_RANGE[role] ?? DEFAULT_L_RANGE;
}
