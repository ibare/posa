/**
 * Posa IR — 색 공간과 참조 관계만 담는 순수 데이터 모델.
 * UI 상태(선택/포커스/펼침 등)는 이 타입에 절대 넣지 않는다.
 */

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

export type RoleId = string;

export type RoleAssignment = {
  primitive: PrimitiveId;
  shade: ShadeIndex;
};

export type SlotId = string;
export type StateId = string;

export type SlotAssignment = {
  role: RoleId;
  states: Partial<Record<StateId, RoleAssignment>>;
};

export type IR = {
  meta: {
    version: string;
    createdAt: number;
    updatedAt: number;
    componentTypes: string[];
  };
  primitives: Record<PrimitiveId, PrimitiveScale>;
  roles: Record<RoleId, RoleAssignment>;
  slots: Record<SlotId, SlotAssignment>;
};
