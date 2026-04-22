import {
  SHADE_INDICES,
  type IR,
  type PrimitiveId,
  type PrimitiveScale,
  type ShadeIndex,
} from '../ir/types';
import { countPrimitiveReferences, findNearestShade } from './primitive-ops';

/**
 * Atlas 뷰에서 호출하는 IR 변환.
 * 탐색 뷰의 primitive 생성과 달리 여기서는 "정리" 성격이 강하다 — 사용자가 명시적으로 remove / merge 를 요청.
 */

export class AtlasOpError extends Error {}

/**
 * 고아(참조 0) primitive만 제거한다. 참조가 남아있는 경우 에러.
 */
export function removePrimitive(ir: IR, primitiveId: PrimitiveId): IR {
  if (!ir.primitives[primitiveId]) {
    throw new AtlasOpError(`primitive ${primitiveId} does not exist`);
  }
  if (countPrimitiveReferences(ir, primitiveId) > 0) {
    throw new AtlasOpError(`primitive ${primitiveId} is still in use`);
  }
  const nextPrimitives = { ...ir.primitives };
  delete nextPrimitives[primitiveId];
  return {
    ...ir,
    primitives: nextPrimitives,
    meta: { ...ir.meta, updatedAt: Date.now() },
  };
}

/**
 * source primitive의 모든 참조를 target primitive로 옮기고 source를 제거한다.
 * 리매핑된 shade는 원래 shade가 아니라 target primitive에서 L이 가장 가까운 shade.
 */
export function mergePrimitive(
  ir: IR,
  sourceId: PrimitiveId,
  targetId: PrimitiveId,
): IR {
  if (sourceId === targetId) {
    throw new AtlasOpError('merge source and target are identical');
  }
  const source = ir.primitives[sourceId];
  const target = ir.primitives[targetId];
  if (!source || !target) {
    throw new AtlasOpError('primitive not found');
  }

  const remapShade = (originalShade: ShadeIndex): ShadeIndex => {
    const originalL = source.scale[originalShade].L;
    return findNearestShade(target, originalL);
  };

  const nextRoles = { ...ir.roles };
  for (const [roleId, assign] of Object.entries(ir.roles)) {
    if (assign.primitive !== sourceId) continue;
    nextRoles[roleId] = {
      primitive: targetId,
      shade: remapShade(assign.shade),
    };
  }

  const nextSlots = { ...ir.slots };
  for (const [slotId, slot] of Object.entries(ir.slots)) {
    let changed = false;
    const nextStates = { ...slot.states };
    for (const [state, override] of Object.entries(slot.states)) {
      if (!override || override.primitive !== sourceId) continue;
      nextStates[state] = {
        primitive: targetId,
        shade: remapShade(override.shade),
      };
      changed = true;
    }
    if (changed) {
      nextSlots[slotId] = { ...slot, states: nextStates };
    }
  }

  const nextPrimitives = { ...ir.primitives };
  delete nextPrimitives[sourceId];

  return {
    ...ir,
    primitives: nextPrimitives,
    roles: nextRoles,
    slots: nextSlots,
    meta: { ...ir.meta, updatedAt: Date.now() },
  };
}

/** 특정 primitive를 참조하는 role id와 slot(state 포함) 목록을 돌려준다. UI 표시용. */
export function listPrimitiveReferences(
  ir: IR,
  primitiveId: PrimitiveId,
): {
  roles: string[];
  slotStates: { slotId: string; state: string }[];
} {
  const roles: string[] = [];
  for (const [roleId, assign] of Object.entries(ir.roles)) {
    if (assign.primitive === primitiveId) roles.push(roleId);
  }
  const slotStates: { slotId: string; state: string }[] = [];
  for (const [slotId, slot] of Object.entries(ir.slots)) {
    for (const [state, override] of Object.entries(slot.states)) {
      if (override && override.primitive === primitiveId) {
        slotStates.push({ slotId, state });
      }
    }
  }
  return { roles, slotStates };
}

/** 어떤 shade가 몇 번 참조되는지 count (Atlas 사용률 시각화용). */
export function shadeUsage(
  ir: IR,
  primitiveId: PrimitiveId,
): Record<ShadeIndex, number> {
  const usage = {} as Record<ShadeIndex, number>;
  const p = ir.primitives[primitiveId];
  if (!p) return usage;
  for (const shade of SHADE_INDICES) {
    usage[shade] = 0;
  }
  for (const assign of Object.values(ir.roles)) {
    if (assign.primitive === primitiveId) usage[assign.shade]++;
  }
  for (const slot of Object.values(ir.slots)) {
    for (const override of Object.values(slot.states)) {
      if (override && override.primitive === primitiveId) {
        usage[override.shade]++;
      }
    }
  }
  return usage;
}

// PrimitiveScale는 타입 참조만으로도 쓰이도록 re-export.
export type { PrimitiveScale };
