import type {
  ColorRef,
  IR,
  OKLCH,
  PrimitiveId,
  PrimitiveScale,
  ShadeIndex,
} from '../ir/types';
import { createPrimitive } from './primitive';

/**
 * IR에 대한 primitive 생성/조정/참조 추적 연산.
 * 모든 함수는 순수 — 호출자가 반환된 IR로 state를 갈아끼우는 식으로 사용한다.
 */

/** Scale 내부 판정 — hue 20°·chroma 0.08 이내. L은 제약 없음. */
export const SCALE_HUE_TOLERANCE = 20;
export const SCALE_CHROMA_TOLERANCE = 0.08;
const NEUTRAL_FAMILY_CHROMA = 0.03;

export type HueFamily =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'magenta'
  | 'pink'
  | 'neutral';

export function hueFamily(color: OKLCH): HueFamily {
  if (color.C < NEUTRAL_FAMILY_CHROMA) return 'neutral';
  const h = ((color.H % 360) + 360) % 360;
  if (h < 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 75) return 'yellow';
  if (h < 165) return 'green';
  if (h < 195) return 'cyan';
  if (h < 255) return 'blue';
  if (h < 285) return 'purple';
  if (h < 315) return 'magenta';
  return 'pink';
}

export function hueDistance(a: number, b: number): number {
  const diff = (((a - b) % 360) + 360) % 360;
  return Math.min(diff, 360 - diff);
}

export function isWithinScale(anchor: OKLCH, primitive: PrimitiveScale): boolean {
  const bothNeutral =
    anchor.C < NEUTRAL_FAMILY_CHROMA && primitive.anchor.C < NEUTRAL_FAMILY_CHROMA;
  const chromaOk =
    Math.abs(anchor.C - primitive.anchor.C) < SCALE_CHROMA_TOLERANCE;
  if (bothNeutral) return chromaOk;
  const hueOk = hueDistance(anchor.H, primitive.anchor.H) < SCALE_HUE_TOLERANCE;
  return hueOk && chromaOk;
}

function letterSuffix(index: number): string {
  if (index < 26) return String.fromCharCode(97 + index);
  const first = Math.floor(index / 26) - 1;
  const second = index % 26;
  return String.fromCharCode(97 + first) + String.fromCharCode(97 + second);
}

export function nextPrimitiveId(ir: IR, family: string): PrimitiveId {
  const prefix = `${family}-`;
  const used = new Set<string>();
  for (const id of Object.keys(ir.primitives)) {
    if (id.startsWith(prefix)) used.add(id);
  }
  for (let i = 0; i < 1024; i++) {
    const candidate = `${prefix}${letterSuffix(i)}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${prefix}${letterSuffix(Object.keys(ir.primitives).length)}`;
}

export function addPrimitive(
  ir: IR,
  anchor: OKLCH,
  anchorShade: ShadeIndex,
): { ir: IR; primitiveId: PrimitiveId } {
  const family = hueFamily(anchor);
  const id = nextPrimitiveId(ir, family);
  const primitive = createPrimitive(id, anchor, anchorShade);
  const nextIr: IR = {
    ...ir,
    primitives: { ...ir.primitives, [id]: primitive },
    meta: { ...ir.meta, updatedAt: Date.now() },
  };
  return { ir: nextIr, primitiveId: id };
}

export function adjustPrimitiveAnchor(
  ir: IR,
  primitiveId: PrimitiveId,
  newAnchor: OKLCH,
): IR {
  const existing = ir.primitives[primitiveId];
  if (!existing) return ir;
  const replaced = createPrimitive(
    existing.id,
    newAnchor,
    existing.anchorShade,
  );
  const preserved: PrimitiveScale = {
    ...replaced,
    createdAt: existing.createdAt,
  };
  return {
    ...ir,
    primitives: { ...ir.primitives, [primitiveId]: preserved },
    meta: { ...ir.meta, updatedAt: Date.now() },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// ColorRef 순회 (orphan 판정 / 카운트 / merge에서 공통 사용)
// ──────────────────────────────────────────────────────────────────────────

function forEachDirectPrimitiveRef(
  ir: IR,
  visit: (ref: { primitive: PrimitiveId; shade: ShadeIndex }) => void,
) {
  // Symbol은 primitive를 직접 가리킴.
  for (const sym of Object.values(ir.symbols)) {
    if (sym) visit(sym);
  }
  // Attribute는 ColorRef. primitive kind만 primitive 참조.
  for (const attr of Object.values(ir.attributes)) {
    if (attr && attr.kind === 'primitive') visit(attr);
  }
  // Slot ref + state overrides. primitive kind만.
  for (const slot of Object.values(ir.slots)) {
    if (slot.ref && slot.ref.kind === 'primitive') visit(slot.ref);
    for (const override of Object.values(slot.states)) {
      if (override && override.kind === 'primitive') visit(override);
    }
  }
}

export function countPrimitiveReferences(
  ir: IR,
  primitiveId: PrimitiveId,
): number {
  let n = 0;
  forEachDirectPrimitiveRef(ir, (ref) => {
    if (ref.primitive === primitiveId) n++;
  });
  return n;
}

export function findOrphanPrimitives(ir: IR): PrimitiveId[] {
  const orphans: PrimitiveId[] = [];
  for (const id of Object.keys(ir.primitives)) {
    if (countPrimitiveReferences(ir, id) === 0) orphans.push(id);
  }
  return orphans;
}

export function pruneOrphanPrimitives(ir: IR): IR {
  const orphans = findOrphanPrimitives(ir);
  if (orphans.length === 0) return ir;
  const nextPrimitives = { ...ir.primitives };
  for (const id of orphans) delete nextPrimitives[id];
  return {
    ...ir,
    primitives: nextPrimitives,
    meta: { ...ir.meta, updatedAt: Date.now() },
  };
}

export function findNearestPrimitive(
  ir: IR,
  anchor: OKLCH,
): PrimitiveScale | null {
  let best: PrimitiveScale | null = null;
  let bestScore = Infinity;
  for (const p of Object.values(ir.primitives)) {
    if (!isWithinScale(anchor, p)) continue;
    const dH = hueDistance(anchor.H, p.anchor.H);
    const dC = Math.abs(anchor.C - p.anchor.C);
    const score = dH + dC * 100;
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

export function findNearestShade(
  primitive: PrimitiveScale,
  targetL: number,
): ShadeIndex {
  let bestShade: ShadeIndex = primitive.anchorShade;
  let bestDiff = Infinity;
  for (const [shadeStr, color] of Object.entries(primitive.scale)) {
    const diff = Math.abs(color.L - targetL);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestShade = Number(shadeStr) as ShadeIndex;
    }
  }
  return bestShade;
}

// ──────────────────────────────────────────────────────────────────────────
// ColorRef rebind helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * 사용자가 고른 색 → ColorRef를 돌려준다. 가까운 primitive를 찾으면 그 안 shade,
 * 없으면 새 primitive 생성 후 그것을 참조.
 * 호출자는 반환된 IR로 state를 갈아끼운 뒤 ColorRef를 symbol/attribute/slot에 꽂는다.
 */
export function colorToRef(
  ir: IR,
  color: OKLCH,
  fallbackShade: ShadeIndex,
): { ir: IR; ref: ColorRef } {
  const nearest = findNearestPrimitive(ir, color);
  if (nearest) {
    const shade = findNearestShade(nearest, color.L);
    return {
      ir,
      ref: { kind: 'primitive', primitive: nearest.id, shade },
    };
  }
  const { ir: next, primitiveId } = addPrimitive(ir, color, fallbackShade);
  return {
    ir: next,
    ref: { kind: 'primitive', primitive: primitiveId, shade: fallbackShade },
  };
}
