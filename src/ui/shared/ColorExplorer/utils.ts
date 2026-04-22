import { hueFamily } from '../../../color/primitive-ops';
import type { PrimitiveId, PrimitiveScale } from '../../../ir/types';

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
