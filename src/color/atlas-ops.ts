import type { ComponentDefinition } from '../catalog/components';
import { resolveEffectivePrimitiveShade } from '../ir/selectors';
import {
  SHADE_INDICES,
  SYMBOL_IDS,
  type AttributeAssignment,
  type ColorRef,
  type IR,
  type PrimitiveId,
  type PrimitiveScale,
  type ShadeIndex,
  type SlotId,
  type StateId,
  type SymbolAssignment,
  type SymbolId,
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

/**
 * 같은 primitive 내에서 fromShade를 참조하던 모든 소비자를 toShade로 옮긴다.
 * Atlas의 참조 숫자 드래그에서 사용 — 사용자가 소비자 집합을 고정한 채로
 * 어느 스텝을 바라볼지 실시간으로 바꿔보기 위한 경로.
 *
 * primitive.scale 자체는 손대지 않는다. 앵커(anchorShade)도 불변.
 */
export function rebindShade(
  ir: IR,
  primitiveId: PrimitiveId,
  fromShade: ShadeIndex,
  toShade: ShadeIndex,
): IR {
  if (fromShade === toShade) return ir;
  if (!ir.primitives[primitiveId]) return ir;

  let changed = false;

  const nextSymbols = { ...ir.symbols };
  for (const [symId, assign] of Object.entries(ir.symbols)) {
    if (!assign || assign.primitive !== primitiveId || assign.shade !== fromShade) continue;
    nextSymbols[symId as SymbolId] = { primitive: primitiveId, shade: toShade };
    changed = true;
  }

  const nextAttributes = { ...ir.attributes };
  for (const [attrId, assign] of Object.entries(ir.attributes)) {
    if (!assign || assign.primitive !== primitiveId || assign.shade !== fromShade) continue;
    nextAttributes[attrId as keyof IR['attributes']] = {
      primitive: primitiveId,
      shade: toShade,
    };
    changed = true;
  }

  const nextSlots = { ...ir.slots };
  for (const [slotId, slot] of Object.entries(ir.slots)) {
    let slotChanged = false;
    let nextRef = slot.ref;
    if (
      slot.ref &&
      slot.ref.kind === 'primitive' &&
      slot.ref.primitive === primitiveId &&
      slot.ref.shade === fromShade
    ) {
      nextRef = { kind: 'primitive', primitive: primitiveId, shade: toShade };
      slotChanged = true;
    }
    let nextStates = slot.states;
    let statesChanged = false;
    for (const [state, override] of Object.entries(slot.states)) {
      if (
        override &&
        override.kind === 'primitive' &&
        override.primitive === primitiveId &&
        override.shade === fromShade
      ) {
        if (!statesChanged) nextStates = { ...slot.states };
        nextStates[state as Exclude<StateId, 'default'>] = {
          kind: 'primitive',
          primitive: primitiveId,
          shade: toShade,
        };
        statesChanged = true;
      }
    }
    if (slotChanged || statesChanged) {
      nextSlots[slotId] = { ...slot, ref: nextRef, states: nextStates };
      changed = true;
    }
  }

  if (!changed) return ir;

  return {
    ...ir,
    symbols: nextSymbols,
    attributes: nextAttributes,
    slots: nextSlots,
    meta: { ...ir.meta, updatedAt: Date.now() },
  };
}

/**
 * 각 shade의 소비자 수를 집계한다. 두 소스를 합산한다:
 *   1) Symbol 배정 — symbol 자체가 팔레트 토큰이자 소비자. variant 활성화의 근거이고
 *      slot 참조와 독립적으로 존재한다. "symbol이 유일한 소비자"인 primitive도
 *      최소 1은 계산되어야 한다.
 *   2) 활성 slot × state의 상속 체인 해결 결과(state override → slot.ref → attribute).
 *      attribute에 배정만 있고 상속하는 slot이 없으면 집계에 잡히지 않는다.
 *      slot이 {kind:'symbol'}로 symbol을 참조하면 그 symbol의 shade로 추가 카운트되며,
 *      symbol 배정 카운트(1)와 중복이 아니라 별도 소비 경로다.
 */
export function shadeUsage(
  ir: IR,
  components: ComponentDefinition[],
  primitiveId: PrimitiveId,
): Record<ShadeIndex, number> {
  const usage = {} as Record<ShadeIndex, number>;
  if (!ir.primitives[primitiveId]) return usage;
  for (const shade of SHADE_INDICES) {
    usage[shade] = 0;
  }
  for (const assign of Object.values(ir.symbols)) {
    if (assign && assign.primitive === primitiveId) usage[assign.shade]++;
  }
  const symbolIdSet: Set<string> = new Set(SYMBOL_IDS);
  for (const comp of components) {
    const variantIds: (string | null)[] = comp.variants?.length
      ? comp.variants.map((v) => v.id)
      : [null];
    for (const variantId of variantIds) {
      // variant.id가 SymbolId와 일치하고 그 symbol에 할당이 없으면 해당 slot은 비활성.
      if (variantId && symbolIdSet.has(variantId)) {
        if (ir.symbols[variantId as SymbolId] == null) continue;
      }
      for (const attr of comp.attributes) {
        const slotId = variantId
          ? `${comp.id}.${variantId}.${attr}`
          : `${comp.id}.${attr}`;
        for (const state of comp.states) {
          const resolved = resolveEffectivePrimitiveShade(
            ir,
            slotId,
            attr,
            state,
          );
          if (!resolved) continue;
          if (resolved.primitive !== primitiveId) continue;
          usage[resolved.shade]++;
        }
      }
    }
  }
  return usage;
}

/**
 * shade별 effective usage의 총합. Atlas 카드 상단 "Used in N places" 표시용.
 * 삭제 가드·orphan 판정은 primitive-ops의 countPrimitiveReferences(direct)를 계속 사용한다.
 */
export function effectivePrimitiveReferenceCount(
  ir: IR,
  components: ComponentDefinition[],
  primitiveId: PrimitiveId,
): number {
  const usage = shadeUsage(ir, components, primitiveId);
  let total = 0;
  for (const shade of SHADE_INDICES) total += usage[shade] ?? 0;
  return total;
}

export type { PrimitiveScale };
