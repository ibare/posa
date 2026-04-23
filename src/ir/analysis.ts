/**
 * Review 화면 전용 순수 분석. UI 의존성 없음.
 *
 * Posa IR은 4축(primitives / symbols / attributes / slots)이므로 전통적인 role 축은
 * 없다. 여기 함수들은 그 축들을 기준으로 쏠림·정합성·대비를 요약한다.
 */

import type { ComponentDefinition } from '../catalog/components';
import { contrastRatio, verdictOf, type ContrastVerdict } from '../color/contrast';
import {
  enumerateActiveSlotIds,
  getActiveAttributeIds,
  getActiveSymbolIds,
  resolveAttributeColor,
  resolveSlotStateColor,
  resolveSymbolColor,
} from './selectors';
import {
  SHADE_INDICES,
  type AttributeId,
  type ColorRef,
  type IR,
  type OKLCH,
  type PrimitiveId,
  type ShadeIndex,
  type SlotId,
  type SymbolId,
} from './types';

// ──────────────────────────────────────────────────────────────────────────
// 참조 통계 — primitive / symbol / attribute 쏠림 계산
// ──────────────────────────────────────────────────────────────────────────

export type PrimitiveReferenceBucket = {
  primitiveId: PrimitiveId;
  totalRefs: number;
  shadeHits: Partial<Record<ShadeIndex, number>>;
  usedShades: ShadeIndex[];
  representativeColor: OKLCH;
};

/**
 * primitive별 참조 횟수와 사용된 shade 집합. `shadeHits`는 SHADE_INDICES 정의 순서의
 * 부분 집합이고, `representativeColor`는 가장 자주 참조된 shade의 색이다.
 *
 * 모든 직접 참조(symbol / attribute / slot.ref / slot.state-override)를 1로 센다.
 */
export function computePrimitiveUsage(ir: IR): PrimitiveReferenceBucket[] {
  const buckets = new Map<
    PrimitiveId,
    { total: number; shadeHits: Map<ShadeIndex, number> }
  >();

  const bump = (primitiveId: PrimitiveId, shade: ShadeIndex) => {
    let bucket = buckets.get(primitiveId);
    if (!bucket) {
      bucket = { total: 0, shadeHits: new Map() };
      buckets.set(primitiveId, bucket);
    }
    bucket.total++;
    bucket.shadeHits.set(shade, (bucket.shadeHits.get(shade) ?? 0) + 1);
  };

  const visit = (ref: ColorRef) => {
    if (ref.kind === 'primitive') {
      bump(ref.primitive, ref.shade);
      return;
    }
    const sym = ir.symbols[ref.symbol];
    if (!sym) return;
    bump(sym.primitive, sym.shade);
  };

  for (const sym of Object.values(ir.symbols)) {
    if (sym) bump(sym.primitive, sym.shade);
  }
  for (const attr of Object.values(ir.attributes)) {
    if (attr) bump(attr.primitive, attr.shade);
  }
  for (const slot of Object.values(ir.slots)) {
    if (slot.ref) visit(slot.ref);
    for (const override of Object.values(slot.states)) {
      if (override) visit(override);
    }
  }

  const out: PrimitiveReferenceBucket[] = [];
  for (const [primitiveId, { total, shadeHits }] of buckets) {
    const scale = ir.primitives[primitiveId];
    if (!scale) continue;
    const shadeHitsObj: Partial<Record<ShadeIndex, number>> = {};
    let topShade: ShadeIndex = SHADE_INDICES[0];
    let topCount = -1;
    for (const [shade, count] of shadeHits) {
      shadeHitsObj[shade] = count;
      if (count > topCount) {
        topShade = shade;
        topCount = count;
      }
    }
    const usedShades = SHADE_INDICES.filter((s) => shadeHits.has(s));
    out.push({
      primitiveId,
      totalRefs: total,
      shadeHits: shadeHitsObj,
      usedShades,
      representativeColor: scale.scale[topShade],
    });
  }
  out.sort((a, b) => b.totalRefs - a.totalRefs);
  return out;
}

export type SymbolUsage = {
  symbolId: SymbolId;
  slotReferences: number;
  color: OKLCH;
};

/** symbol을 `{kind: 'symbol'}` ColorRef로 직접 가리키는 slot/state 수. */
export function computeSymbolUsage(
  ir: IR,
  components: ComponentDefinition[],
): SymbolUsage[] {
  const counts: Partial<Record<SymbolId, number>> = {};
  for (const slotId of enumerateActiveSlotIds(components, ir)) {
    const slot = ir.slots[slotId];
    if (!slot) continue;
    if (slot.ref?.kind === 'symbol') {
      counts[slot.ref.symbol] = (counts[slot.ref.symbol] ?? 0) + 1;
    }
    for (const override of Object.values(slot.states)) {
      if (override?.kind === 'symbol') {
        counts[override.symbol] = (counts[override.symbol] ?? 0) + 1;
      }
    }
  }
  const out: SymbolUsage[] = [];
  for (const symbolId of getActiveSymbolIds(components)) {
    if (ir.symbols[symbolId] == null) continue;
    const color = resolveSymbolColor(ir, symbolId);
    if (!color) continue;
    out.push({
      symbolId,
      slotReferences: counts[symbolId] ?? 0,
      color,
    });
  }
  return out;
}

export type AttributeUsage = {
  attributeId: AttributeId;
  /** 이 attribute를 선언한 active slot 수 (상속이 도달하는 면). */
  coveredSlots: number;
  /** 이 attribute를 덮어쓰지 않고 실제로 상속받는 slot 수. */
  inheritingSlots: number;
  color: OKLCH | null;
};

/**
 * attribute가 얼마나 "기반 색"으로 작동하는지.
 *   coveredSlots    : 해당 attribute로 끝나는 active slot의 전체 수.
 *   inheritingSlots : 그 중 slot.ref가 비어 있어서 attribute 값이 실제로 도달하는 수.
 */
export function computeAttributeUsage(
  ir: IR,
  components: ComponentDefinition[],
): AttributeUsage[] {
  const activeAttrs = getActiveAttributeIds(components);
  const covered: Partial<Record<AttributeId, number>> = {};
  const inheriting: Partial<Record<AttributeId, number>> = {};
  for (const slotId of enumerateActiveSlotIds(components, ir)) {
    const attrId = slotId.split('.').pop() as AttributeId;
    covered[attrId] = (covered[attrId] ?? 0) + 1;
    const slot = ir.slots[slotId];
    if (!slot?.ref) inheriting[attrId] = (inheriting[attrId] ?? 0) + 1;
  }
  const out: AttributeUsage[] = [];
  for (const attributeId of activeAttrs) {
    if (ir.attributes[attributeId] == null) continue;
    out.push({
      attributeId,
      coveredSlots: covered[attributeId] ?? 0,
      inheritingSlots: inheriting[attributeId] ?? 0,
      color: resolveAttributeColor(ir, attributeId),
    });
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Contrast — 실제 존재하는 slot pair만 계산 (컴포넌트 × variant × state 안의 text/background)
// ──────────────────────────────────────────────────────────────────────────

/**
 * 대비 검사에 넣을 "ink" attribute (텍스트·아이콘·마크 계열). 면 위에 그려지는 잉크.
 */
const INK_ATTRS: ReadonlySet<AttributeId> = new Set([
  'text',
  'placeholder',
  'icon',
  'mark',
]);

/** 대비 검사에 넣을 "surface" attribute. */
const SURFACE_ATTRS: ReadonlySet<AttributeId> = new Set([
  'background',
  'muted',
  'fill',
  'track',
]);

export type ContrastPair = {
  fgSlotId: SlotId;
  bgSlotId: SlotId;
  fgAttributeId: AttributeId;
  bgAttributeId: AttributeId;
  fgColor: OKLCH;
  bgColor: OKLCH;
  componentId: string;
  variantId: string | null;
  ratio: number;
  verdict: ContrastVerdict;
};

function slotScopeKey(slotId: SlotId): string {
  const parts = slotId.split('.');
  if (parts.length === 3) return `${parts[0]}.${parts[1]}`;
  return parts[0];
}

function splitSlot(slotId: SlotId): {
  componentId: string;
  variantId: string | null;
  attributeId: AttributeId;
} {
  const parts = slotId.split('.');
  if (parts.length === 3) {
    return {
      componentId: parts[0],
      variantId: parts[1],
      attributeId: parts[2] as AttributeId,
    };
  }
  return {
    componentId: parts[0],
    variantId: null,
    attributeId: parts[1] as AttributeId,
  };
}

/**
 * 같은 scope(컴포넌트·variant) 안에서 ink × surface pair의 기본 state 대비를 계산.
 * 색이 resolve 안 되는 slot은 건너뛴다. OKLCH 동일한 pair는 dedup.
 */
export function computeContrastPairs(
  ir: IR,
  components: ComponentDefinition[],
): ContrastPair[] {
  const byScope = new Map<string, SlotId[]>();
  for (const slotId of enumerateActiveSlotIds(components, ir)) {
    const key = slotScopeKey(slotId);
    const arr = byScope.get(key);
    if (arr) arr.push(slotId);
    else byScope.set(key, [slotId]);
  }

  const pairs: ContrastPair[] = [];
  const seen = new Set<string>();

  for (const [, slotIds] of byScope) {
    const inks: SlotId[] = [];
    const surfaces: SlotId[] = [];
    for (const id of slotIds) {
      const attr = id.split('.').pop() as AttributeId;
      if (INK_ATTRS.has(attr)) inks.push(id);
      else if (SURFACE_ATTRS.has(attr)) surfaces.push(id);
    }
    if (inks.length === 0 || surfaces.length === 0) continue;

    for (const fg of inks) {
      const fgColor = resolveSlotStateColor(ir, fg, 'default');
      if (!fgColor) continue;
      const fgMeta = splitSlot(fg);
      for (const bg of surfaces) {
        const bgColor = resolveSlotStateColor(ir, bg, 'default');
        if (!bgColor) continue;
        const sig = `${fgColor.L.toFixed(4)}-${fgColor.C.toFixed(4)}-${fgColor.H.toFixed(2)}|${bgColor.L.toFixed(4)}-${bgColor.C.toFixed(4)}-${bgColor.H.toFixed(2)}|${fgMeta.componentId}|${fgMeta.variantId ?? ''}`;
        if (seen.has(sig)) continue;
        seen.add(sig);
        const bgMeta = splitSlot(bg);
        const ratio = contrastRatio(fgColor, bgColor);
        pairs.push({
          fgSlotId: fg,
          bgSlotId: bg,
          fgAttributeId: fgMeta.attributeId,
          bgAttributeId: bgMeta.attributeId,
          fgColor,
          bgColor,
          componentId: fgMeta.componentId,
          variantId: fgMeta.variantId,
          ratio,
          verdict: verdictOf(ratio),
        });
      }
    }
  }

  // 문제 있는 pair가 상단에 오도록 verdict 심각도순.
  const verdictRank: Record<ContrastVerdict, number> = {
    poor: 0,
    'large-only': 1,
    good: 2,
    excellent: 3,
  };
  pairs.sort((a, b) => {
    const d = verdictRank[a.verdict] - verdictRank[b.verdict];
    if (d !== 0) return d;
    return a.ratio - b.ratio;
  });
  return pairs;
}

