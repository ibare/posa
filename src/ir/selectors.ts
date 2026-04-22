import type { IR, PrimitiveId, ShadeIndex } from './types';

/**
 * IR을 읽기만 해서 파생 뷰를 계산하는 순수 셀렉터.
 * store의 ir가 갱신될 때마다 호출해도 안전하도록 side effect 없이 유지한다.
 */

/**
 * primitive id별로 "지금 IR의 어딘가(role 또는 slot state)에서 참조 중인 shade" 집합을 구한다.
 * 중복 없는 shade 배열로 반환.
 */
export function computeUsedShadesByPrimitive(
  ir: IR,
): Record<PrimitiveId, ShadeIndex[]> {
  const buckets: Record<PrimitiveId, Set<ShadeIndex>> = {};

  const push = (primitiveId: PrimitiveId, shade: ShadeIndex) => {
    if (!buckets[primitiveId]) buckets[primitiveId] = new Set();
    buckets[primitiveId].add(shade);
  };

  for (const assignment of Object.values(ir.roles)) {
    push(assignment.primitive, assignment.shade);
  }

  for (const slot of Object.values(ir.slots)) {
    for (const stateAssignment of Object.values(slot.states)) {
      if (!stateAssignment) continue;
      push(stateAssignment.primitive, stateAssignment.shade);
    }
  }

  const out: Record<PrimitiveId, ShadeIndex[]> = {};
  for (const [id, set] of Object.entries(buckets)) {
    out[id] = Array.from(set);
  }
  return out;
}

/**
 * primitive가 role/slot 어디에서 몇 번 참조되는지 단순 카운트.
 * "Other greens you've used" 리스트에서 slot 개수를 표시할 때 쓴다.
 */
export function countPrimitiveSlotReferences(
  ir: IR,
  primitiveId: PrimitiveId,
): number {
  let n = 0;
  for (const assignment of Object.values(ir.roles)) {
    if (assignment.primitive === primitiveId) n += 1;
  }
  for (const slot of Object.values(ir.slots)) {
    for (const stateAssignment of Object.values(slot.states)) {
      if (stateAssignment?.primitive === primitiveId) n += 1;
    }
  }
  return n;
}
