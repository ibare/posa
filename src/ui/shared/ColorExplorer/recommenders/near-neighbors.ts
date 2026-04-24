import {
  resolveAttributeColor,
  resolveSymbolColor,
} from '../../../../ir/selectors';
import type {
  AttributeId,
  IR,
  OKLCH,
  SymbolId,
} from '../../../../ir/types';
import { TILE_COUNT, linspace, type Recommender } from './shared';

/**
 * 현재 value 주변의 미세한 L 변주 11개.
 *
 * value가 있으면 현재 색의 L을 중심으로 ±SPREAD 램프.
 * value===null 이면 paired attribute/symbol 색을 기준으로 보강 램프를 만든다.
 *   - text/placeholder/icon/mark ↔ background: 대비되는 L
 *   - border/outline/muted/overlay/track ↔ background: 유사 톤, 배경보다 농도 짙게
 *   - fill/thumb ↔ primary: primary L 주위 neighbor
 *   - accent/secondary ↔ primary: primary hue의 complement 주위
 * 페어가 해결되지 않으면 row 감춤.
 */
export const nearNeighbors: Recommender = ({ value, role, ir }) => {
  if (value) {
    const [rMin, rMax] = roleLRange(role);
    return row(sampleLRamp(value, rMin, rMax));
  }
  const pair = PAIRED[role];
  if (!pair) return null;
  const pairColor = resolvePairColor(ir, pair);
  if (!pairColor) return null;
  return row(generateFromPair(pairColor, pair.mode, role));
};

function row(tiles: OKLCH[]) {
  return {
    id: 'near-neighbors',
    labelKey: 'rows.nearNeighbors.label',
    hintKey: 'rows.nearNeighbors.hint',
    tiles,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// value가 있을 때: L 축 미세 램프
// ──────────────────────────────────────────────────────────────────────────

const SPREAD = 0.12;

function sampleLRamp(value: OKLCH, rMin: number, rMax: number): OKLCH[] {
  const span = rMax - rMin;
  if (span <= SPREAD * 2) {
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

// ──────────────────────────────────────────────────────────────────────────
// value가 null일 때: paired attribute/symbol 기반 보강
// ──────────────────────────────────────────────────────────────────────────

type PairMode = 'contrast' | 'similar' | 'neighbor' | 'complement';
type PairSpec = {
  source: { kind: 'attribute'; id: AttributeId } | { kind: 'symbol'; id: SymbolId };
  mode: PairMode;
};

const PAIRED: Record<string, PairSpec> = {
  text: { source: { kind: 'attribute', id: 'background' }, mode: 'contrast' },
  placeholder: { source: { kind: 'attribute', id: 'background' }, mode: 'contrast' },
  icon: { source: { kind: 'attribute', id: 'background' }, mode: 'contrast' },
  mark: { source: { kind: 'attribute', id: 'background' }, mode: 'contrast' },
  border: { source: { kind: 'attribute', id: 'background' }, mode: 'similar' },
  outline: { source: { kind: 'attribute', id: 'background' }, mode: 'similar' },
  muted: { source: { kind: 'attribute', id: 'background' }, mode: 'similar' },
  overlay: { source: { kind: 'attribute', id: 'background' }, mode: 'similar' },
  track: { source: { kind: 'attribute', id: 'background' }, mode: 'similar' },
  fill: { source: { kind: 'symbol', id: 'primary' }, mode: 'neighbor' },
  thumb: { source: { kind: 'symbol', id: 'primary' }, mode: 'neighbor' },
  accent: { source: { kind: 'symbol', id: 'primary' }, mode: 'complement' },
  secondary: { source: { kind: 'symbol', id: 'primary' }, mode: 'complement' },
};

function resolvePairColor(ir: IR, pair: PairSpec): OKLCH | null {
  if (pair.source.kind === 'attribute') {
    return resolveAttributeColor(ir, pair.source.id);
  }
  return resolveSymbolColor(ir, pair.source.id);
}

function generateFromPair(pair: OKLCH, mode: PairMode, role: string): OKLCH[] {
  const [rMin, rMax] = roleLRange(role);
  switch (mode) {
    case 'contrast': {
      // role usable L 범위 전체를 11등분. hue/chroma는 살짝 살려 순수 회색
      // 덩어리가 되지 않게 pair의 C를 감쇠해서 전달.
      return linspace(rMin, rMax, TILE_COUNT).map((L) => ({
        L,
        C: pair.C * 0.4,
        H: pair.H,
      }));
    }
    case 'similar': {
      // 배경 hue/chroma 유지, L은 배경에서 role 중심 쪽으로 짧은 램프.
      const startL = clamp(pair.L, rMin, rMax);
      const endL = clamp((rMin + rMax) / 2, rMin, rMax);
      return linspace(startL, endL, TILE_COUNT).map((L) => ({
        L,
        C: Math.min(pair.C * 1.5, 0.04),
        H: pair.H,
      }));
    }
    case 'neighbor': {
      // primary L 주위 ±SPREAD 변주.
      const center = clamp(pair.L, rMin + SPREAD, rMax - SPREAD);
      return linspace(center - SPREAD, center + SPREAD, TILE_COUNT).map((L) => ({
        L,
        C: pair.C,
        H: pair.H,
      }));
    }
    case 'complement': {
      // primary hue의 보색(+180°) 주위 ±30° 변주. L/C는 primary 그대로.
      const hueCenter = (pair.H + 180) % 360;
      return linspace(hueCenter - 30, hueCenter + 30, TILE_COUNT).map((H) => ({
        L: pair.L,
        C: pair.C,
        H: ((H % 360) + 360) % 360,
      }));
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// role별 usable L 구간
// ──────────────────────────────────────────────────────────────────────────

const ROLE_L_RANGE: Record<string, [number, number]> = {
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

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
