import type {
  IR,
  OKLCH,
  PrimitiveId,
  PrimitiveScale,
  RoleId,
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

/** OKLCH 색의 hue family를 결정. chroma가 매우 낮으면 neutral. */
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

/** 두 hue 간 원형 거리(0~180°). */
export function hueDistance(a: number, b: number): number {
  const diff = (((a - b) % 360) + 360) % 360;
  return Math.min(diff, 360 - diff);
}

/** anchor가 기존 primitive의 scale 범주 안에 있는지. chroma가 양쪽 다 neutral 수준이면 hue 무시. */
export function isWithinScale(anchor: OKLCH, primitive: PrimitiveScale): boolean {
  const bothNeutral =
    anchor.C < NEUTRAL_FAMILY_CHROMA && primitive.anchor.C < NEUTRAL_FAMILY_CHROMA;
  const chromaOk =
    Math.abs(anchor.C - primitive.anchor.C) < SCALE_CHROMA_TOLERANCE;
  if (bothNeutral) return chromaOk;
  const hueOk = hueDistance(anchor.H, primitive.anchor.H) < SCALE_HUE_TOLERANCE;
  return hueOk && chromaOk;
}

/** 알파벳 suffix 생성: 0→"a", 25→"z", 26→"aa", 27→"ab", ... */
function letterSuffix(index: number): string {
  if (index < 26) return String.fromCharCode(97 + index);
  const first = Math.floor(index / 26) - 1;
  const second = index % 26;
  return (
    String.fromCharCode(97 + first) + String.fromCharCode(97 + second)
  );
}

/** 지정 family의 다음 id ("green-a", "green-b", ...). 기존 IR을 스캔해 충돌 없는 값 선택. */
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
  // 현실적으로 도달 불가 — 같은 family로 1024개 이상을 만들 일은 없다.
  return `${prefix}${letterSuffix(Object.keys(ir.primitives).length)}`;
}

/** IR에 primitive 추가. family는 anchor의 hue로 결정. */
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

/** 기존 primitive의 anchor만 교체. anchorShade는 유지. */
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
  // createdAt는 원본 그대로 유지 — primitive의 탄생 시점은 바뀌지 않는다.
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

/**
 * Role이 가리키는 primitive를 신규 primitive로 대체.
 * 기존 primitive는 IR에 그대로 남는다 (다른 slot이 참조 중일 수 있음).
 */
export function replaceRolePrimitive(
  ir: IR,
  roleId: RoleId,
  newAnchor: OKLCH,
  shadeForAnchor: ShadeIndex,
): IR {
  const { ir: withNew, primitiveId } = addPrimitive(ir, newAnchor, shadeForAnchor);
  const existingRole = withNew.roles[roleId];
  const shade = existingRole?.shade ?? shadeForAnchor;
  return {
    ...withNew,
    roles: {
      ...withNew.roles,
      [roleId]: { primitive: primitiveId, shade },
    },
    meta: { ...withNew.meta, updatedAt: Date.now() },
  };
}

/** 특정 primitive를 참조하는 role / slot(default or state override) 총 개수. */
export function countPrimitiveReferences(
  ir: IR,
  primitiveId: PrimitiveId,
): number {
  let count = 0;
  for (const role of Object.values(ir.roles)) {
    if (role.primitive === primitiveId) count++;
  }
  for (const slot of Object.values(ir.slots)) {
    for (const override of Object.values(slot.states)) {
      if (override && override.primitive === primitiveId) count++;
    }
  }
  return count;
}

/** 참조 수가 0인 primitive id들. */
export function findOrphanPrimitives(ir: IR): PrimitiveId[] {
  const orphans: PrimitiveId[] = [];
  for (const id of Object.keys(ir.primitives)) {
    if (countPrimitiveReferences(ir, id) === 0) orphans.push(id);
  }
  return orphans;
}

/**
 * anchor와 가장 가까운 primitive를 찾는다. hue + chroma 차이의 간단한 합으로 거리 측정.
 * 없으면 null.
 */
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

/** primitive의 scale에서 target L에 가장 가까운 shade를 찾는다. */
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
