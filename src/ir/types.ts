/**
 * Posa IR — 색 공간과 참조 관계만 담는 순수 데이터 모델.
 * UI 상태(선택/포커스/펼침 등)는 이 타입에 절대 넣지 않는다.
 *
 * 이 인스턴스의 IR은 4개 축으로 구성된다:
 *   1) primitives  : OKLCH scale들
 *   2) symbols     : Primary/Secondary/Success 등 상징색 (전역 slot)
 *   3) attributes  : background/text/border 등 컴포넌트 보편 속성 (전역 기본)
 *   4) slots       : 컴포넌트 × attribute. 개별 override.
 *
 * Role이라는 개념은 없다. "Primary는 색이냐 역할이냐"에 답할 수 없어 제거함.
 */

// ===== Color primitives =====
export type OKLCH = {
  L: number;
  C: number;
  H: number;
};

export type ShadeIndex =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 950;

export const SHADE_INDICES: ShadeIndex[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

export type PrimitiveId = string;

export type PrimitiveScale = {
  id: PrimitiveId;
  anchor: OKLCH;
  anchorShade: ShadeIndex;
  scale: Record<ShadeIndex, OKLCH>;
  createdAt: number;
};

// ===== Symbols — 상징색 =====
/**
 * User symbol — 스코프 컴포넌트의 variant에 바인딩되는 사용자 정의 상징색.
 * IR에 할당된 경우에만 노출·사용되고 삭제 가능하다.
 */
export type UserSymbolId =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'info'
  | 'warning'
  | 'error';

/**
 * System symbol — Posa가 항상 제공하는 상수 색. 어떤 primitive에도 속하지
 * 않고 literal OKLCH를 자체 보유한다. 사용자 편집·삭제 불가이며 UI에서도
 * 사용자 심볼 뒤에 항상 노출된다. cascade 위험이 없어 attribute에서도 참조 가능.
 */
export type SystemSymbolId = 'white' | 'black';

export type SymbolId = UserSymbolId | SystemSymbolId;

export const USER_SYMBOL_IDS: UserSymbolId[] = [
  'primary',
  'secondary',
  'accent',
  'success',
  'info',
  'warning',
  'error',
];

export const SYSTEM_SYMBOL_IDS: SystemSymbolId[] = ['white', 'black'];

export const SYMBOL_IDS: SymbolId[] = [
  ...USER_SYMBOL_IDS,
  ...SYSTEM_SYMBOL_IDS,
];

export function isSystemSymbolId(id: string): id is SystemSymbolId {
  return id === 'white' || id === 'black';
}

export type SymbolAssignment =
  | { kind: 'primitive'; primitive: PrimitiveId; shade: ShadeIndex }
  | { kind: 'literal'; color: OKLCH };

export const WHITE_OKLCH: OKLCH = { L: 1, C: 0, H: 0 };
export const BLACK_OKLCH: OKLCH = { L: 0, C: 0, H: 0 };

export const SYSTEM_SYMBOL_COLORS: Record<SystemSymbolId, OKLCH> = {
  white: WHITE_OKLCH,
  black: BLACK_OKLCH,
};

// ===== Attributes — 컴포넌트 보편 속성 =====
export type AttributeId =
  | 'background'
  | 'text'
  | 'placeholder'
  | 'border'
  | 'outline'
  | 'icon'
  | 'mark'
  | 'overlay'
  | 'track'
  | 'fill'
  | 'thumb'
  | 'muted';

export const ATTRIBUTE_IDS: AttributeId[] = [
  'background',
  'text',
  'placeholder',
  'border',
  'outline',
  'icon',
  'mark',
  'overlay',
  'track',
  'fill',
  'thumb',
  'muted',
];

// ColorRef — 어떤 색을 가리키느냐. primitive 직접 참조, 아니면 symbol 경유.
// User symbol은 attribute에서 가리킬 수 없다 (cascade 차단). slot/slot-state만 가능.
// System symbol(white/black)은 불변이라 cascade 없음 → attribute 참조도 허용한다.
export type ColorRef =
  | { kind: 'primitive'; primitive: PrimitiveId; shade: ShadeIndex }
  | { kind: 'symbol'; symbol: SymbolId };

// Attribute는 user symbol live link 금지. primitive 스냅샷 또는
// system symbol(white/black) 상수 참조만 허용.
export type AttributeAssignment =
  | { kind: 'primitive'; primitive: PrimitiveId; shade: ShadeIndex }
  | { kind: 'system'; name: SystemSymbolId };

// ===== Slots — 컴포넌트 × attribute =====
export type ComponentId = string;
// base form. Variant 있음: `${componentId}.${variantId}.${attributeId}`
// Variant 없음: `${componentId}.${attributeId}`
export type SlotId = string;

export type StateId =
  | 'default'
  | 'hover'
  | 'active'
  | 'disabled'
  | 'focus'
  | 'checked';

export const STATE_IDS: StateId[] = [
  'default',
  'hover',
  'active',
  'disabled',
  'focus',
  'checked',
];

export type SlotAssignment = {
  // null → attribute에서 상속. 존재하지 않으면 attribute도 미할당이면 최종 null.
  ref: ColorRef | null;
  // states에 없거나 null이면 default(=ref)에서 상속.
  states: Partial<Record<Exclude<StateId, 'default'>, ColorRef | null>>;
};

// ===== 전체 IR =====
//
// symbols/attributes는 "할당된 것만" 보관한다. 키의 존재 자체가 할당을 뜻하고,
// 부재는 미할당(또는 스코프 밖)을 뜻한다. null 상태는 더 이상 허용하지 않는다.
// 스코프는 store의 activeComponentIds가 단일 원천이며, IR은 그 스코프 안에서만
// 키를 갖도록 관리된다.
export type IR = {
  meta: {
    version: string;
    createdAt: number;
    updatedAt: number;
  };
  primitives: Record<PrimitiveId, PrimitiveScale>;
  symbols: Partial<Record<SymbolId, SymbolAssignment>>;
  attributes: Partial<Record<AttributeId, AttributeAssignment>>;
  slots: Record<SlotId, SlotAssignment>;
};

export function createEmptyIR(): IR {
  const now = Date.now();
  return {
    meta: { version: '1.0', createdAt: now, updatedAt: now },
    primitives: {},
    symbols: {
      white: { kind: 'literal', color: WHITE_OKLCH },
      black: { kind: 'literal', color: BLACK_OKLCH },
    },
    attributes: {},
    slots: {},
  };
}

/**
 * Persist 복원 시점에 system symbol(white/black)이 누락된 IR을 보정한다.
 * 신규 세션은 createEmptyIR에서 이미 심겨 있으므로 영향 없음.
 */
export function ensureSystemSymbols(ir: IR): IR {
  const symbols = { ...ir.symbols };
  let changed = false;
  for (const id of SYSTEM_SYMBOL_IDS) {
    if (!symbols[id]) {
      symbols[id] = { kind: 'literal', color: SYSTEM_SYMBOL_COLORS[id] };
      changed = true;
    }
  }
  return changed ? { ...ir, symbols } : ir;
}
