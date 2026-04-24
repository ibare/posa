import {
  SHADE_INDICES,
  type OKLCH,
  type PrimitiveId,
  type PrimitiveScale,
  type ShadeIndex,
} from '../ir/types';

/**
 * Primitive scale 파생 — anchor 하나에서 11단 OKLCH scale을 만들어낸다.
 *
 * 규칙 요약:
 * - Shade별 target L은 아래 TARGET_L 표를 따른다 (Tailwind와 유사한 분포).
 * - Anchor가 찍힌 shade는 anchor.L을 그대로 쓴다 (사용자 의도 존중).
 * - Anchor 근처(거리 1~2단)는 anchor.L과 target L을 선형 블렌드.
 * - 멀리 떨어진 shade는 target L 그대로.
 * - Chroma는 anchor.C에 shade별 multiplier를 곱한다. Neutral(C < 0.02)은 변화 없음.
 * - Hue는 모든 shade에서 동일.
 */

const TARGET_L: Record<ShadeIndex, number> = {
  50: 0.97,
  100: 0.94,
  200: 0.87,
  300: 0.78,
  400: 0.68,
  500: 0.58,
  600: 0.48,
  700: 0.4,
  800: 0.32,
  900: 0.24,
  950: 0.16,
};

const CHROMA_MULT: Record<ShadeIndex, number> = {
  50: 0.3,
  100: 0.5,
  200: 0.7,
  300: 0.85,
  400: 0.95,
  500: 1.0,
  600: 1.0,
  700: 0.9,
  800: 0.75,
  900: 0.55,
  950: 0.35,
};

const NEUTRAL_CHROMA_THRESHOLD = 0.02;

/**
 * anchor.L에 가장 가까운 TARGET_L을 갖는 shade를 찾는다.
 * 새 primitive 생성 시 anchorShade 결정에 사용 — anchorShade가 anchor.L과
 * 동떨어지면 주변 shade 블렌드가 V자로 꺾여 scale monotonicity가 깨진다.
 */
export function nearestShadeForL(L: number): ShadeIndex {
  let best: ShadeIndex = 500;
  let bestDiff = Infinity;
  for (const shade of SHADE_INDICES) {
    const diff = Math.abs(TARGET_L[shade] - L);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = shade;
    }
  }
  return best;
}

/** Anchor와 그 anchor의 shade 위치를 받아 11단 OKLCH scale을 파생한다. */
export function deriveScale(
  anchor: OKLCH,
  anchorShade: ShadeIndex,
): Record<ShadeIndex, OKLCH> {
  const anchorIndex = SHADE_INDICES.indexOf(anchorShade);
  const isNeutral = anchor.C < NEUTRAL_CHROMA_THRESHOLD;

  const result = {} as Record<ShadeIndex, OKLCH>;

  for (let i = 0; i < SHADE_INDICES.length; i++) {
    const shade = SHADE_INDICES[i];

    if (shade === anchorShade) {
      result[shade] = { L: anchor.L, C: anchor.C, H: anchor.H };
      continue;
    }

    const distance = Math.abs(i - anchorIndex);
    const targetL = TARGET_L[shade];

    let L: number;
    if (distance >= 3) {
      L = targetL;
    } else {
      const t = distance / 3;
      L = anchor.L * (1 - t) + targetL * t;
    }

    const C = isNeutral ? anchor.C : anchor.C * CHROMA_MULT[shade];

    result[shade] = { L, C, H: anchor.H };
  }

  return result;
}

/** 새 PrimitiveScale 객체를 만든다. createdAt은 호출 시점의 Date.now(). */
export function createPrimitive(
  id: PrimitiveId,
  anchor: OKLCH,
  anchorShade: ShadeIndex,
): PrimitiveScale {
  return {
    id,
    anchor: { L: anchor.L, C: anchor.C, H: anchor.H },
    anchorShade,
    scale: deriveScale(anchor, anchorShade),
    createdAt: Date.now(),
  };
}
