import { COMPONENT_DEFINITIONS, findComponentBySlotId } from '../catalog/components';
import {
  SYMBOL_IDS,
  type AttributeId,
  type ColorRef,
  type IR,
  type OKLCH,
  type PrimitiveId,
  type ShadeIndex,
  type SlotId,
  type StateId,
  type SymbolId,
} from './types';

const SYMBOL_ID_SET: Set<string> = new Set(SYMBOL_IDS);

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

/**
 * Variant 이름이 SymbolId와 동일한 slot은 그 symbol에 primitive가 할당된 경우에만 활성.
 * (예: primary symbol 미할당 시 button.primary.* 전부 비노출.)
 * 'outline'/'ghost'/'default' 처럼 symbol과 무관한 variant는 항상 활성.
 * 변형이 없는 컴포넌트(card/input)는 항상 활성.
 */
export function isSlotActive(slotId: SlotId, ir: IR): boolean {
  const parts = slotId.split('.');
  if (parts.length !== 3) return true;
  const variant = parts[1];
  if (!SYMBOL_ID_SET.has(variant)) return true;
  return ir.symbols[variant as SymbolId] != null;
}

/** Symbol 미할당으로 인해 비활성화된 slot을 걸러낸 활성 slot id 목록. */
export function enumerateActiveSlotIds(ir: IR): SlotId[] {
  return enumerateAllSlotIds().filter((id) => isSlotActive(id, ir));
}

/** 주어진 attribute로 끝나는 활성 slot id만 골라낸다. Z1 리스트용. */
export function getSlotsByAttribute(attrId: AttributeId, ir: IR): SlotId[] {
  return enumerateActiveSlotIds(ir).filter((id) => id.endsWith(`.${attrId}`));
}

/** slot id 끝부분에서 attribute id 추출. */
export function getAttributeFromSlotId(slotId: SlotId): AttributeId {
  const parts = slotId.split('.');
  return parts[parts.length - 1] as AttributeId;
}

/**
 * Slot의 표시 이름.
 *   - 명시적 slot.ref가 symbol이면 `${slotId}.${symbol}` 접미사.
 *   - 그 외에는 base slot id 그대로.
 * (설계: slot 엔터티 자체는 단일 존재. 이름만 유저에게 보일 때 확장된다.)
 */
export function getSlotDisplayName(slotId: SlotId, ir: IR): string {
  const slot = ir.slots[slotId];
  if (slot?.ref?.kind === 'symbol') return `${slotId}.${slot.ref.symbol}`;
  return slotId;
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
  return ir.primitives[assignment.primitive]?.scale[assignment.shade] ?? null;
}

/**
 * 상속 체인:
 *   state override → slot.ref → attribute → null
 *
 * Variant 이름이 SymbolId와 일치한다고 해서 자동으로 그 symbol에 바인딩되지 않는다.
 * (background/border/text가 전부 한 색으로 묶이지 않게 하기 위함.)
 * Symbol 라이브 링크는 사용자가 슬롯 인스펙터에서 명시적으로 "Use a symbol"을 선택했을 때만 형성된다.
 *
 * Attribute는 항상 primitive 스냅샷이므로 symbol 변경이 attribute 경유로 새지 않는다.
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

  // Slot 명시적 ref 없음 → attribute에서 상속 (primitive 스냅샷)
  const attrId = getAttributeFromSlotId(slotId);
  const attrAssignment = ir.attributes[attrId];
  if (attrAssignment) {
    return ir.primitives[attrAssignment.primitive]?.scale[attrAssignment.shade] ?? null;
  }

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
    if (attr) visit({ kind: 'primitive', primitive: attr.primitive, shade: attr.shade });
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
