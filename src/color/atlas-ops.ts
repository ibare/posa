import {
  SHADE_INDICES,
  type AttributeAssignment,
  type ColorRef,
  type IR,
  type PrimitiveId,
  type PrimitiveScale,
  type ShadeIndex,
  type SlotId,
  type StateId,
  type SymbolAssignment,
} from '../ir/types';
import { countPrimitiveReferences, findNearestShade } from './primitive-ops';

/**
 * Atlas 뷰에서 호출하는 IR 변환.
 * 탐색 뷰의 primitive 생성과 달리 여기서는 "정리" 성격이 강하다 — 사용자가 명시적으로 remove / merge 를 요청.
 */

export class AtlasOpError extends Error {}

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

  const remapRef = (ref: ColorRef | null | undefined): ColorRef | null | undefined => {
    if (!ref) return ref;
    if (ref.kind !== 'primitive') return ref;
    if (ref.primitive !== sourceId) return ref;
    return { kind: 'primitive', primitive: targetId, shade: remapShade(ref.shade) };
  };

  const nextSymbols = { ...ir.symbols };
  for (const [symId, assign] of Object.entries(ir.symbols)) {
    if (!assign || assign.primitive !== sourceId) continue;
    const next: SymbolAssignment = {
      primitive: targetId,
      shade: remapShade(assign.shade),
    };
    nextSymbols[symId as keyof IR['symbols']] = next;
  }

  const remapAttr = (assign: AttributeAssignment): AttributeAssignment => {
    if (assign.primitive !== sourceId) return assign;
    return { primitive: targetId, shade: remapShade(assign.shade) };
  };

  const nextAttributes = { ...ir.attributes };
  for (const [attrId, assign] of Object.entries(ir.attributes)) {
    if (!assign) continue;
    const remapped = remapAttr(assign);
    if (remapped !== assign) {
      nextAttributes[attrId as keyof IR['attributes']] = remapped;
    }
  }

  const nextSlots = { ...ir.slots };
  for (const [slotId, slot] of Object.entries(ir.slots)) {
    const newRef = remapRef(slot.ref);
    const nextStates = { ...slot.states };
    let statesChanged = false;
    for (const [state, override] of Object.entries(slot.states)) {
      const remapped = remapRef(override);
      if (remapped !== override) {
        nextStates[state as Exclude<StateId, 'default'>] = remapped ?? null;
        statesChanged = true;
      }
    }
    if (newRef !== slot.ref || statesChanged) {
      nextSlots[slotId] = {
        ...slot,
        ref: newRef ?? null,
        states: nextStates,
      };
    }
  }

  const nextPrimitives = { ...ir.primitives };
  delete nextPrimitives[sourceId];

  return {
    ...ir,
    primitives: nextPrimitives,
    symbols: nextSymbols,
    attributes: nextAttributes,
    slots: nextSlots,
    meta: { ...ir.meta, updatedAt: Date.now() },
  };
}

export type PrimitiveReferenceLocation =
  | { kind: 'symbol'; symbolId: string }
  | { kind: 'attribute'; attributeId: string }
  | { kind: 'slot'; slotId: SlotId }
  | { kind: 'slot-state'; slotId: SlotId; state: StateId };

export function listPrimitiveReferences(
  ir: IR,
  primitiveId: PrimitiveId,
): PrimitiveReferenceLocation[] {
  const out: PrimitiveReferenceLocation[] = [];
  for (const [symId, assign] of Object.entries(ir.symbols)) {
    if (assign && assign.primitive === primitiveId) {
      out.push({ kind: 'symbol', symbolId: symId });
    }
  }
  for (const [attrId, assign] of Object.entries(ir.attributes)) {
    if (assign && assign.primitive === primitiveId) {
      out.push({ kind: 'attribute', attributeId: attrId });
    }
  }
  for (const [slotId, slot] of Object.entries(ir.slots)) {
    if (slot.ref && slot.ref.kind === 'primitive' && slot.ref.primitive === primitiveId) {
      out.push({ kind: 'slot', slotId });
    }
    for (const [state, override] of Object.entries(slot.states)) {
      if (override && override.kind === 'primitive' && override.primitive === primitiveId) {
        out.push({ kind: 'slot-state', slotId, state: state as StateId });
      }
    }
  }
  return out;
}

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
  for (const assign of Object.values(ir.symbols)) {
    if (assign && assign.primitive === primitiveId) usage[assign.shade]++;
  }
  for (const assign of Object.values(ir.attributes)) {
    if (assign && assign.primitive === primitiveId) {
      usage[assign.shade]++;
    }
  }
  for (const slot of Object.values(ir.slots)) {
    if (slot.ref && slot.ref.kind === 'primitive' && slot.ref.primitive === primitiveId) {
      usage[slot.ref.shade]++;
    }
    for (const override of Object.values(slot.states)) {
      if (override && override.kind === 'primitive' && override.primitive === primitiveId) {
        usage[override.shade]++;
      }
    }
  }
  return usage;
}

export type { PrimitiveScale };
