import { COMPONENT_DEFINITIONS, findComponentBySlotId } from '../catalog/components';
import type {
  AttributeId,
  ColorRef,
  IR,
  OKLCH,
  PrimitiveId,
  ShadeIndex,
  SlotId,
  StateId,
  SymbolId,
} from './types';

/**
 * IR을 읽기만 해서 파생 뷰를 계산하는 순수 셀렉터.
 * 어떤 함수도 IR을 수정하거나 primitive를 생성하지 않는다.
 */

// ──────────────────────────────────────────────────────────────────────────
// Slot id 생성 / 질의
// ──────────────────────────────────────────────────────────────────────────

export function enumerateAllSlotIds(): SlotId[] {
  const ids: SlotId[] = [];
  for (const comp of COMPONENT_DEFINITIONS) {
    const variants = comp.variants ?? [{ id: '', label: '' }];
    for (const variant of variants) {
      for (const attr of comp.attributes) {
        const base = variant.id
          ? `${comp.id}.${variant.id}.${attr}`
          : `${comp.id}.${attr}`;
        ids.push(base);
      }
    }
  }
  return ids;
}

/** 주어진 attribute로 끝나는 slot id만 골라낸다. Z1 리스트용. */
export function getSlotsByAttribute(attrId: AttributeId): SlotId[] {
  return enumerateAllSlotIds().filter((id) => id.endsWith(`.${attrId}`));
}

/** slot id 끝부분에서 attribute id 추출. */
export function getAttributeFromSlotId(slotId: SlotId): AttributeId {
  const parts = slotId.split('.');
  return parts[parts.length - 1] as AttributeId;
}

/**
 * Slot의 표시 이름.
 *   - ref가 symbol 참조면 `${slotId}.${symbol}` 형태로 접미사가 붙는다.
 *   - 이외에는 base slot id 그대로.
 * (설계: slot 엔터티 자체는 단일 존재. 이름만 유저에게 보일 때 확장된다.)
 */
export function getSlotDisplayName(slotId: SlotId, ir: IR): string {
  const slot = ir.slots[slotId];
  if (!slot || !slot.ref || slot.ref.kind !== 'symbol') return slotId;
  return `${slotId}.${slot.ref.symbol}`;
}

// ──────────────────────────────────────────────────────────────────────────
// ColorRef resolve
// ──────────────────────────────────────────────────────────────────────────

function resolveColorRef(ir: IR, ref: ColorRef): OKLCH | null {
  if (ref.kind === 'primitive') {
    return ir.primitives[ref.primitive]?.scale[ref.shade] ?? null;
  }
  const symbolAssignment = ir.symbols[ref.symbol];
  if (!symbolAssignment) return null;
  return (
    ir.primitives[symbolAssignment.primitive]?.scale[symbolAssignment.shade] ??
    null
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Symbol / Attribute / Slot resolve
// ──────────────────────────────────────────────────────────────────────────

export function resolveSymbolColor(ir: IR, symbolId: SymbolId): OKLCH | null {
  const assignment = ir.symbols[symbolId];
  if (!assignment) return null;
  return ir.primitives[assignment.primitive]?.scale[assignment.shade] ?? null;
}

export function resolveAttributeColor(ir: IR, attrId: AttributeId): OKLCH | null {
  const assignment = ir.attributes[attrId];
  if (!assignment) return null;
  return resolveColorRef(ir, assignment);
}

/**
 * 상속 체인:
 *   state override → slot.ref → attribute assignment → null
 *
 * state === 'default'이거나 해당 state override가 없으면 slot.ref로 폴백.
 * slot.ref가 null이면 attribute로 폴백.
 */
export function resolveSlotStateColor(
  ir: IR,
  slotId: SlotId,
  state: StateId = 'default',
): OKLCH | null {
  const slot = ir.slots[slotId];

  if (state !== 'default') {
    const stateRef = slot?.states?.[state as Exclude<StateId, 'default'>];
    if (stateRef !== undefined && stateRef !== null) {
      return resolveColorRef(ir, stateRef);
    }
    // State 명시 없음 → default로 폴백
  }

  if (slot?.ref) return resolveColorRef(ir, slot.ref);

  // Slot ref 없음 → attribute에서 상속
  const attrId = getAttributeFromSlotId(slotId);
  const attrAssignment = ir.attributes[attrId];
  if (attrAssignment) return resolveColorRef(ir, attrAssignment);

  return null;
}

/** slot state에 직접 할당이 있는지(=상속이 아닌지) — UI 표시용. */
export function isSlotStateDirectlyAssigned(
  ir: IR,
  slotId: SlotId,
  state: StateId,
): boolean {
  const slot = ir.slots[slotId];
  if (!slot) return false;
  if (state === 'default') return slot.ref !== null && slot.ref !== undefined;
  const override = slot.states?.[state as Exclude<StateId, 'default'>];
  return override !== undefined && override !== null;
}

// ──────────────────────────────────────────────────────────────────────────
// Primitive 참조 카운트 / 사용 shade
// ──────────────────────────────────────────────────────────────────────────

function forEachColorRef(ir: IR, visit: (ref: ColorRef) => void) {
  for (const sym of Object.values(ir.symbols)) {
    if (sym) visit({ kind: 'primitive', primitive: sym.primitive, shade: sym.shade });
  }
  for (const attr of Object.values(ir.attributes)) {
    if (attr) visit(attr);
  }
  for (const slot of Object.values(ir.slots)) {
    if (slot.ref) visit(slot.ref);
    for (const override of Object.values(slot.states)) {
      if (override) visit(override);
    }
  }
}

/**
 * primitive id별로 "지금 IR의 어딘가에서 직접 참조 중인 shade" 집합을 구한다.
 * symbol 경유 참조는 symbol.assignment.shade만 더해진다 (symbol을 참조하는 slot은
 * 이미 symbol에 의해 representation이 한 번 모였기 때문).
 */
export function computeUsedShadesByPrimitive(
  ir: IR,
): Record<PrimitiveId, ShadeIndex[]> {
  const buckets: Record<PrimitiveId, Set<ShadeIndex>> = {};
  forEachColorRef(ir, (ref) => {
    if (ref.kind !== 'primitive') return;
    if (!buckets[ref.primitive]) buckets[ref.primitive] = new Set();
    buckets[ref.primitive].add(ref.shade);
  });
  const out: Record<PrimitiveId, ShadeIndex[]> = {};
  for (const [id, set] of Object.entries(buckets)) {
    out[id] = Array.from(set);
  }
  return out;
}

/**
 * primitive가 몇 군데(symbol/attribute/slot/slot-state)에서 참조되는지.
 * Atlas/Inspector 표시용.
 */
export function countPrimitiveReferences(ir: IR, primitiveId: PrimitiveId): number {
  let n = 0;
  forEachColorRef(ir, (ref) => {
    if (ref.kind === 'primitive' && ref.primitive === primitiveId) n++;
  });
  return n;
}

export function countPrimitiveSlotReferences(
  ir: IR,
  primitiveId: PrimitiveId,
): number {
  return countPrimitiveReferences(ir, primitiveId);
}

// ──────────────────────────────────────────────────────────────────────────
// 컴포넌트 ↔ slot 탐색 헬퍼
// ──────────────────────────────────────────────────────────────────────────

export { findComponentBySlotId };

/** slot이 지원하는 state 목록. 컴포넌트 정의에서 가져온다. */
export function getSlotStates(slotId: SlotId): StateId[] {
  return findComponentBySlotId(slotId)?.states ?? ['default'];
}
