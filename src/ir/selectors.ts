import {
  ATTRIBUTE_DEFINITIONS,
  type AttributeDefinition,
} from '../catalog/attributes';
import {
  findComponentBySlotId,
  type ComponentDefinition,
} from '../catalog/components';
import {
  SYMBOL_DEFINITIONS,
  type SymbolDefinition,
} from '../catalog/symbols';
import {
  ATTRIBUTE_IDS,
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

// ──────────────────────────────────────────────────────────────────────────
// Active scope 파생
//
// 사용자가 선택한 컴포넌트 집합(scope)이 Z*·IR·export의 유일한 원천이다.
// 여기서 파생되는 attribute/symbol 집합만이 앱 전체에서 열거 가능한 공간이다.
// 카탈로그 전수 상수(ATTRIBUTE_IDS/SYMBOL_IDS)는 "등록된 어휘"일 뿐 열거에 쓰지 않는다.
// ──────────────────────────────────────────────────────────────────────────

/** 스코프 컴포넌트들이 선언한 attribute 합집합. ATTRIBUTE_IDS 원래 순서 유지. */
export function getActiveAttributeIds(
  components: ComponentDefinition[],
): AttributeId[] {
  const seen = new Set<AttributeId>();
  for (const c of components) for (const a of c.attributes) seen.add(a);
  return ATTRIBUTE_IDS.filter((id) => seen.has(id));
}

/**
 * 스코프 컴포넌트의 variant 중 variant.id가 SymbolId와 일치하는 것의 합집합.
 * SYMBOL_IDS 원래 순서 유지. 어떤 컴포넌트도 variant를 쓰지 않으면 빈 배열.
 *
 * 근거: variant 이름이 SymbolId와 일치할 때만 Symbol 축과 결합 가능하고
 * (catalog 정책), 그 외 경로로는 symbol 할당이 어떤 slot에도 영향을 주지 않아
 * 열거할 의미가 없다.
 */
export function getActiveSymbolIds(
  components: ComponentDefinition[],
): SymbolId[] {
  const seen = new Set<SymbolId>();
  for (const c of components) {
    for (const v of c.variants ?? []) {
      if (SYMBOL_ID_SET.has(v.id)) seen.add(v.id as SymbolId);
    }
  }
  return SYMBOL_IDS.filter((id) => seen.has(id));
}

const ATTRIBUTE_DEF_BY_ID: Record<AttributeId, AttributeDefinition> =
  Object.fromEntries(ATTRIBUTE_DEFINITIONS.map((d) => [d.id, d])) as Record<
    AttributeId,
    AttributeDefinition
  >;
const SYMBOL_DEF_BY_ID: Record<SymbolId, SymbolDefinition> = Object.fromEntries(
  SYMBOL_DEFINITIONS.map((d) => [d.id, d]),
) as Record<SymbolId, SymbolDefinition>;

export function getActiveAttributeDefs(
  components: ComponentDefinition[],
): AttributeDefinition[] {
  return getActiveAttributeIds(components).map((id) => ATTRIBUTE_DEF_BY_ID[id]);
}

export function getActiveSymbolDefs(
  components: ComponentDefinition[],
): SymbolDefinition[] {
  return getActiveSymbolIds(components).map((id) => SYMBOL_DEF_BY_ID[id]);
}

/** 카탈로그에 등록된 attribute 정의 룩업 (스코프 무관, label 용). */
export function getAttributeDefinition(
  id: AttributeId,
): AttributeDefinition | undefined {
  return ATTRIBUTE_DEF_BY_ID[id];
}

/** 카탈로그에 등록된 symbol 정의 룩업 (스코프 무관, label 용). */
export function getSymbolDefinition(id: SymbolId): SymbolDefinition | undefined {
  return SYMBOL_DEF_BY_ID[id];
}

/**
 * IR을 읽기만 해서 파생 뷰를 계산하는 순수 셀렉터.
 * 어떤 함수도 IR을 수정하거나 primitive를 생성하지 않는다.
 *
 * 모든 "컴포넌트 전체 순회" 셀렉터는 `components: ComponentDefinition[]`을 받는다.
 * 카탈로그 상수를 직접 참조하지 않기 때문에 호출 쪽에서 온보딩 스코프를 주입해야 한다.
 */

// ──────────────────────────────────────────────────────────────────────────
// Slot id 생성 / 질의
// ──────────────────────────────────────────────────────────────────────────

export function enumerateAllSlotIds(
  components: ComponentDefinition[],
): SlotId[] {
  const ids: SlotId[] = [];
  for (const comp of components) {
    // 기본형은 모든 컴포넌트가 동일하게 가진다.
    for (const attr of comp.attributes) {
      ids.push(`${comp.id}.${attr}`);
    }
    for (const variant of comp.variants ?? []) {
      for (const attr of comp.attributes) {
        ids.push(`${comp.id}.${variant.id}.${attr}`);
      }
    }
  }
  return ids;
}

/**
 * Variant가 symbol-bound인지 판정. 즉 variant.id가 SymbolId와 일치하고
 * 그 symbol에 할당이 없다면 이 variant는 "비활성 — symbol 정의 필요" 상태.
 */
export function isSymbolVariantId(variantId: string): variantId is SymbolId {
  return SYMBOL_ID_SET.has(variantId);
}

/**
 * 컴포넌트의 variant 중 "지금 보일 수 있는" 것들만 골라낸다.
 * symbol-bound variant는 그 symbol이 IR에 할당된 경우에만 노출,
 * 그 외 variant는 항상 노출.
 */
export function getVisibleVariants(
  component: ComponentDefinition,
  ir: IR,
): NonNullable<ComponentDefinition['variants']> {
  const variants = component.variants ?? [];
  return variants.filter((v) => {
    if (!isSymbolVariantId(v.id)) return true;
    return ir.symbols[v.id] != null;
  });
}

/**
 * Variant 이름이 SymbolId와 동일한 slot은 그 symbol에 primitive가 할당된 경우에만 활성.
 * (예: primary symbol 미할당 시 button.primary.* 전부 비노출.)
 * Posa 정책상 모든 variant id는 SymbolId와 일치한다 — 일치하지 않는 variant는
 * 카탈로그에서 허용하지 않는다. 기본형(segment가 2개) slot은 항상 활성.
 */
export function isSlotActive(slotId: SlotId, ir: IR): boolean {
  const parts = slotId.split('.');
  if (parts.length !== 3) return true;
  const variant = parts[1];
  if (!SYMBOL_ID_SET.has(variant)) return true;
  return ir.symbols[variant as SymbolId] != null;
}

/** Symbol 미할당으로 인해 비활성화된 slot을 걸러낸 활성 slot id 목록. */
export function enumerateActiveSlotIds(
  components: ComponentDefinition[],
  ir: IR,
): SlotId[] {
  return enumerateAllSlotIds(components).filter((id) => isSlotActive(id, ir));
}

export type PaletteRibbonSegment = {
  primitiveId: PrimitiveId;
  count: number;
  /** 대표색 — 해당 primitive가 가장 자주 쓰인 shade의 OKLCH. */
  color: OKLCH;
};

/**
 * Palette ribbon용 집계:
 *   - total: 컴포넌트·variant·attribute·state로 만들어지는 색 지정 가능 위치의 총수.
 *     비활성 variant(symbol 미할당)는 제외.
 *   - filled: 상속 체인(state → slot → attribute)을 따라 실제 primitive 색에 도달하는 위치 수.
 *     attribute에 색을 지정하면 그 attribute를 쓰는 모든 슬롯이 함께 채워진다.
 *   - segments: 도달한 primitive별 개수와 대표색(가장 자주 쓰인 shade).
 */
export function computePaletteRibbon(
  components: ComponentDefinition[],
  ir: IR,
): {
  total: number;
  filled: number;
  segments: PaletteRibbonSegment[];
} {
  let total = 0;
  let filled = 0;
  const byPrim: Record<
    PrimitiveId,
    { count: number; shadeFreq: Map<ShadeIndex, number> }
  > = {};

  const bump = (primitive: PrimitiveId, shade: ShadeIndex) => {
    let bucket = byPrim[primitive];
    if (!bucket) {
      bucket = { count: 0, shadeFreq: new Map() };
      byPrim[primitive] = bucket;
    }
    bucket.count++;
    bucket.shadeFreq.set(shade, (bucket.shadeFreq.get(shade) ?? 0) + 1);
  };

  for (const comp of components) {
    const variantIds: (string | null)[] = comp.variants?.length
      ? comp.variants.map((v) => v.id)
      : [null];
    for (const variantId of variantIds) {
      if (variantId && SYMBOL_ID_SET.has(variantId)) {
        if (ir.symbols[variantId as SymbolId] == null) continue;
      }
      for (const attr of comp.attributes) {
        const slotId = variantId
          ? `${comp.id}.${variantId}.${attr}`
          : `${comp.id}.${attr}`;
        for (const state of comp.states) {
          total++;
          const resolved = resolveEffectivePrimitiveShade(
            ir,
            slotId,
            attr,
            state,
          );
          if (!resolved) continue;
          filled++;
          bump(resolved.primitive, resolved.shade);
        }
      }
    }
  }

  const segments: PaletteRibbonSegment[] = [];
  for (const [primitiveId, { count, shadeFreq }] of Object.entries(byPrim)) {
    let modeShade: ShadeIndex | null = null;
    let modeCount = -1;
    for (const [shade, n] of shadeFreq) {
      if (n > modeCount) {
        modeShade = shade;
        modeCount = n;
      }
    }
    if (modeShade == null) continue;
    const color = ir.primitives[primitiveId]?.scale[modeShade];
    if (!color) continue;
    segments.push({ primitiveId, count, color });
  }
  segments.sort((a, b) => b.count - a.count);

  return { total, filled, segments };
}

function resolveRefToPrimitiveShade(
  ir: IR,
  ref: ColorRef,
): { primitive: PrimitiveId; shade: ShadeIndex } | null {
  if (ref.kind === 'primitive') {
    return { primitive: ref.primitive, shade: ref.shade };
  }
  const sym = ir.symbols[ref.symbol];
  if (!sym) return null;
  return { primitive: sym.primitive, shade: sym.shade };
}

/**
 * resolveSlotStateColor의 primitive-shade 버전. 상속 체인은 동일:
 *   state override → slot.ref → attribute.
 */
function resolveEffectivePrimitiveShade(
  ir: IR,
  slotId: SlotId,
  attrId: AttributeId,
  state: StateId,
): { primitive: PrimitiveId; shade: ShadeIndex } | null {
  const slot = ir.slots[slotId];

  if (state !== 'default') {
    const stateRef = slot?.states?.[state as Exclude<StateId, 'default'>];
    if (stateRef) return resolveRefToPrimitiveShade(ir, stateRef);
  }

  if (slot?.ref) return resolveRefToPrimitiveShade(ir, slot.ref);

  const attrAssignment = ir.attributes[attrId];
  if (attrAssignment) {
    return { primitive: attrAssignment.primitive, shade: attrAssignment.shade };
  }

  return null;
}

/** 주어진 attribute로 끝나는 활성 slot id만 골라낸다. Z1 리스트용. */
export function getSlotsByAttribute(
  components: ComponentDefinition[],
  attrId: AttributeId,
  ir: IR,
): SlotId[] {
  return enumerateActiveSlotIds(components, ir).filter((id) =>
    id.endsWith(`.${attrId}`),
  );
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

/**
 * Z0 attribute row의 "모드 2" 판정 + 분할 swatch 표시용.
 * 그 attribute로 끝나는 active slot 중 slot.ref가 명시된 slot들의 default 색을
 * distinct(OKLCH 정확 일치 dedup)하게 모은다.
 */
export function getDirectChildColorsForAttribute(
  components: ComponentDefinition[],
  ir: IR,
  attrId: AttributeId,
): OKLCH[] {
  const out: OKLCH[] = [];
  for (const slotId of getSlotsByAttribute(components, attrId, ir)) {
    const slot = ir.slots[slotId];
    if (!slot?.ref) continue;
    const color = resolveColorRef(ir, slot.ref);
    if (!color) continue;
    if (!out.some((c) => c.L === color.L && c.C === color.C && c.H === color.H)) {
      out.push(color);
    }
  }
  return out;
}

/**
 * Z1 slot row의 "모드 2" 판정 + 분할 swatch 표시용.
 * slot.states에 override된 색들의 distinct 목록.
 */
export function getDirectChildColorsForSlot(ir: IR, slotId: SlotId): OKLCH[] {
  const slot = ir.slots[slotId];
  if (!slot) return [];
  const out: OKLCH[] = [];
  for (const ref of Object.values(slot.states)) {
    if (!ref) continue;
    const color = resolveColorRef(ir, ref);
    if (!color) continue;
    if (!out.some((c) => c.L === color.L && c.C === color.C && c.H === color.H)) {
      out.push(color);
    }
  }
  return out;
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
