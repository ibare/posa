import { hueFamily } from '../../../color/primitive-ops';
import type { OKLCH, PrimitiveId, PrimitiveScale } from '../../../ir/types';

/** 같은 hue family이면서 selfId를 제외한 primitive들을 골라낸다. */
export function findSameFamilyPrimitives(
  primitives: Record<PrimitiveId, PrimitiveScale>,
  selfId: PrimitiveId | null,
  familyAnchor: PrimitiveScale | null,
): PrimitiveScale[] {
  if (!familyAnchor) return [];
  const targetFamily = hueFamily(familyAnchor.anchor);
  return Object.values(primitives).filter((p) => {
    if (p.id === selfId) return false;
    return hueFamily(p.anchor) === targetFamily;
  });
}

const EPS_L = 0.01;
const EPS_C = 0.005;
const EPS_H = 1;

/** tile과 현재 값이 동일 색으로 볼 수 있는지. 저채도면 hue 무시. */
export function matchesOKLCH(a: OKLCH, b: OKLCH | null): boolean {
  if (!b) return false;
  if (Math.abs(a.L - b.L) > EPS_L) return false;
  if (Math.abs(a.C - b.C) > EPS_C) return false;
  if (a.C < 0.01 && b.C < 0.01) return true;
  const dh = Math.abs(((a.H - b.H) % 360) + 360) % 360;
  return Math.min(dh, 360 - dh) < EPS_H;
}
