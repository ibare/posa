import { create } from 'zustand';
import {
  mergePrimitive as mergePrimitiveOp,
  removePrimitive as removePrimitiveOp,
} from '../color/atlas-ops';
import {
  addPrimitive,
  adjustPrimitiveAnchor,
  findNearestPrimitive,
  findNearestShade,
  isWithinScale,
  replaceRolePrimitive,
} from '../color/primitive-ops';
import { deriveUniverse, type Universe } from '../catalog/universe';
import type {
  IR,
  OKLCH,
  PrimitiveId,
  RoleAssignment,
  RoleId,
  ShadeIndex,
  SlotAssignment,
  SlotId,
  StateId,
} from '../ir/types';

/**
 * Posa 인스턴스의 런타임 상태.
 * IR(사용자 결정)과 탐색 컨텍스트(layer, 선택, focus)를 모두 담지만, 카탈로그(마스터 그래프)는 건드리지 않는다.
 */

export type Phase = 'onboarding' | 'exploration' | 'atlas' | 'export';
export type Layer = 'z0' | 'z1' | 'z2';
export type LayerDirection = 'ascend' | 'descend' | 'neutral';

export type PendingPrimitiveDecision = {
  roleId: RoleId;
  newAnchor: OKLCH;
  currentPrimitiveId: PrimitiveId;
  shadeForAnchor: ShadeIndex;
};

type PosaState = {
  phase: Phase;
  universe: Universe | null;
  ir: IR;
  layer: Layer;
  selectedRole: RoleId | null;
  selectedSlot: SlotId | null;
  focusedNode: string | null;
  lastDirection: LayerDirection;
  pendingPrimitiveDecision: PendingPrimitiveDecision | null;

  startWithComponents: (componentIds: string[]) => void;
  resetAll: () => void;

  descendTo: (targetId: string) => void;
  ascend: () => void;
  jumpToLayer: (layer: Layer) => void;
  setFocus: (nodeId: string | null) => void;

  setRoleColor: (roleId: RoleId, color: OKLCH | null) => void;
  setRoleShade: (roleId: RoleId, shade: ShadeIndex) => void;
  setRoleAssignment: (roleId: RoleId, assignment: RoleAssignment) => void;
  setSlotStateColor: (
    slotId: SlotId,
    state: StateId,
    color: OKLCH | null,
  ) => void;
  resolvePendingPrimitive: (choice: 'adjust' | 'replace') => void;
  cancelPendingPrimitive: () => void;

  goToPhase: (phase: Phase) => void;
  removePrimitive: (primitiveId: PrimitiveId) => void;
  mergePrimitive: (sourceId: PrimitiveId, targetId: PrimitiveId) => void;
};

const IR_VERSION = '1.0';

const LAYER_INDEX: Record<Layer, number> = { z0: 0, z1: 1, z2: 2 };

function emptyIR(): IR {
  const now = Date.now();
  return {
    meta: { version: IR_VERSION, createdAt: now, updatedAt: now, componentTypes: [] },
    primitives: {},
    roles: {},
    slots: {},
  };
}

function createInitialIR(universe: Universe): IR {
  const now = Date.now();
  return {
    meta: {
      version: IR_VERSION,
      createdAt: now,
      updatedAt: now,
      componentTypes: [...universe.componentTypes],
    },
    primitives: {},
    roles: {},
    slots: {},
  };
}

function roleDefaultShade(universe: Universe | null, roleId: RoleId): ShadeIndex {
  const role = universe?.roles.find((r) => r.id === roleId);
  return role?.defaultShade ?? 500;
}

function slotShadeFor(
  universe: Universe | null,
  slotId: SlotId,
  fallback: ShadeIndex,
): ShadeIndex {
  const slot = universe?.slots.find((s) => s.id === slotId);
  if (slot?.shadeOverride) return slot.shadeOverride;
  if (slot) return roleDefaultShade(universe, slot.role);
  return fallback;
}

function ensureSlotShell(
  ir: IR,
  slotId: SlotId,
  universe: Universe | null,
): { ir: IR; slot: SlotAssignment } {
  const existing = ir.slots[slotId];
  if (existing) return { ir, slot: existing };
  const slotDef = universe?.slots.find((s) => s.id === slotId);
  const role = slotDef?.role ?? '';
  const fresh: SlotAssignment = { role, states: {} };
  return {
    ir: {
      ...ir,
      slots: { ...ir.slots, [slotId]: fresh },
    },
    slot: fresh,
  };
}

export const usePosaStore = create<PosaState>((set, get) => ({
  phase: 'onboarding',
  universe: null,
  ir: emptyIR(),
  layer: 'z0',
  selectedRole: null,
  selectedSlot: null,
  focusedNode: null,
  lastDirection: 'neutral',
  pendingPrimitiveDecision: null,

  startWithComponents: (componentIds) => {
    const universe = deriveUniverse(componentIds);
    set({
      universe,
      ir: createInitialIR(universe),
      phase: 'exploration',
      layer: 'z0',
      selectedRole: null,
      selectedSlot: null,
      focusedNode: null,
      lastDirection: 'neutral',
      pendingPrimitiveDecision: null,
    });
  },

  resetAll: () => {
    set({
      phase: 'onboarding',
      universe: null,
      ir: emptyIR(),
      layer: 'z0',
      selectedRole: null,
      selectedSlot: null,
      focusedNode: null,
      lastDirection: 'neutral',
      pendingPrimitiveDecision: null,
    });
  },

  descendTo: (targetId) => {
    const { layer } = get();
    if (layer === 'z0') {
      set({
        layer: 'z1',
        selectedRole: targetId,
        focusedNode: null,
        lastDirection: 'descend',
      });
    } else if (layer === 'z1') {
      set({
        layer: 'z2',
        selectedSlot: targetId,
        focusedNode: null,
        lastDirection: 'descend',
      });
    }
  },

  ascend: () => {
    const { layer } = get();
    if (layer === 'z2') {
      set({
        layer: 'z1',
        selectedSlot: null,
        focusedNode: null,
        lastDirection: 'ascend',
      });
    } else if (layer === 'z1') {
      set({
        layer: 'z0',
        selectedRole: null,
        focusedNode: null,
        lastDirection: 'ascend',
      });
    }
  },

  jumpToLayer: (targetLayer) => {
    const { layer } = get();
    if (targetLayer === layer) return;
    const direction: LayerDirection =
      LAYER_INDEX[targetLayer] < LAYER_INDEX[layer] ? 'ascend' : 'descend';
    const patch: Partial<PosaState> = {
      layer: targetLayer,
      focusedNode: null,
      lastDirection: direction,
    };
    if (targetLayer === 'z0') {
      patch.selectedRole = null;
      patch.selectedSlot = null;
    }
    if (targetLayer === 'z1') {
      patch.selectedSlot = null;
    }
    set(patch);
  },

  setFocus: (nodeId) => set({ focusedNode: nodeId }),

  setRoleColor: (roleId, color) => {
    const { ir, universe } = get();

    // Clear: role 참조만 제거. primitive는 보존.
    if (color === null) {
      if (!ir.roles[roleId]) return;
      const nextRoles = { ...ir.roles };
      delete nextRoles[roleId];
      set({
        ir: {
          ...ir,
          roles: nextRoles,
          meta: { ...ir.meta, updatedAt: Date.now() },
        },
      });
      return;
    }

    const shade = roleDefaultShade(universe, roleId);
    const current = ir.roles[roleId];

    // 최초 할당 — 새 primitive 생성.
    if (!current) {
      const { ir: next, primitiveId } = addPrimitive(ir, color, shade);
      set({
        ir: {
          ...next,
          roles: {
            ...next.roles,
            [roleId]: { primitive: primitiveId, shade },
          },
          meta: { ...next.meta, updatedAt: Date.now() },
        },
      });
      return;
    }

    const primitive = ir.primitives[current.primitive];

    // Primitive가 없어진 비정상 상태 — 새로 생성하고 붙인다.
    if (!primitive) {
      const { ir: next, primitiveId } = addPrimitive(ir, color, shade);
      set({
        ir: {
          ...next,
          roles: {
            ...next.roles,
            [roleId]: { primitive: primitiveId, shade },
          },
          meta: { ...next.meta, updatedAt: Date.now() },
        },
      });
      return;
    }

    // Scale 내부 → anchor 조정.
    if (isWithinScale(color, primitive)) {
      const next = adjustPrimitiveAnchor(ir, primitive.id, color);
      set({ ir: next });
      return;
    }

    // Scale 외부 → 사용자에게 물어봄.
    set({
      pendingPrimitiveDecision: {
        roleId,
        newAnchor: color,
        currentPrimitiveId: primitive.id,
        shadeForAnchor: shade,
      },
    });
  },

  // Role이 같은 primitive를 계속 참조하되 shade만 바꾼다. primitive는 건드리지 않음.
  setRoleShade: (roleId, shade) => {
    const { ir } = get();
    const current = ir.roles[roleId];
    if (!current) return;
    if (current.shade === shade) return;
    set({
      ir: {
        ...ir,
        roles: {
          ...ir.roles,
          [roleId]: { ...current, shade },
        },
        meta: { ...ir.meta, updatedAt: Date.now() },
      },
    });
  },

  // Role을 명시적으로 특정 primitive + shade로 포인팅 변경.
  // primitive가 없는 경우 no-op — 호출자는 존재하는 primitive만 전달해야 한다.
  setRoleAssignment: (roleId, assignment) => {
    const { ir } = get();
    if (!ir.primitives[assignment.primitive]) return;
    set({
      ir: {
        ...ir,
        roles: {
          ...ir.roles,
          [roleId]: assignment,
        },
        meta: { ...ir.meta, updatedAt: Date.now() },
      },
    });
  },

  setSlotStateColor: (slotId, state, color) => {
    const { ir, universe } = get();
    const { ir: withShell, slot } = ensureSlotShell(ir, slotId, universe);

    // Clear: 해당 state의 override만 제거.
    if (color === null) {
      if (!slot.states[state]) return;
      const nextStates = { ...slot.states };
      delete nextStates[state];
      set({
        ir: {
          ...withShell,
          slots: {
            ...withShell.slots,
            [slotId]: { ...slot, states: nextStates },
          },
          meta: { ...withShell.meta, updatedAt: Date.now() },
        },
      });
      return;
    }

    const fallbackShade = slotShadeFor(universe, slotId, 500);

    // 가장 가까운 기존 primitive를 찾아 재사용. 없으면 새로 만든다.
    const nearest = findNearestPrimitive(withShell, color);

    if (nearest) {
      // 가장 가까운 기존 primitive의 scale에서 L이 가장 가까운 shade를 선택.
      const shade = findNearestShade(nearest, color.L);
      set({
        ir: {
          ...withShell,
          slots: {
            ...withShell.slots,
            [slotId]: {
              ...slot,
              states: {
                ...slot.states,
                [state]: { primitive: nearest.id, shade },
              },
            },
          },
          meta: { ...withShell.meta, updatedAt: Date.now() },
        },
      });
      return;
    }

    // 새 primitive 생성.
    const { ir: withNew, primitiveId } = addPrimitive(
      withShell,
      color,
      fallbackShade,
    );
    set({
      ir: {
        ...withNew,
        slots: {
          ...withNew.slots,
          [slotId]: {
            ...slot,
            states: {
              ...slot.states,
              [state]: { primitive: primitiveId, shade: fallbackShade },
            },
          },
        },
        meta: { ...withNew.meta, updatedAt: Date.now() },
      },
    });
  },

  resolvePendingPrimitive: (choice) => {
    const { pendingPrimitiveDecision: pending, ir } = get();
    if (!pending) return;

    if (choice === 'adjust') {
      const next = adjustPrimitiveAnchor(
        ir,
        pending.currentPrimitiveId,
        pending.newAnchor,
      );
      set({ ir: next, pendingPrimitiveDecision: null });
      return;
    }

    // replace — 새 primitive 만들고 role이 그것을 참조하도록.
    const next = replaceRolePrimitive(
      ir,
      pending.roleId,
      pending.newAnchor,
      pending.shadeForAnchor,
    );
    set({ ir: next, pendingPrimitiveDecision: null });
  },

  cancelPendingPrimitive: () => set({ pendingPrimitiveDecision: null }),

  goToPhase: (phase) => {
    const { universe } = get();
    if (phase !== 'onboarding' && !universe) return;
    set({ phase, focusedNode: null, pendingPrimitiveDecision: null });
  },

  removePrimitive: (primitiveId) => {
    const { ir } = get();
    try {
      set({ ir: removePrimitiveOp(ir, primitiveId) });
    } catch {
      // 참조가 남아있거나 존재하지 않음 — 조용히 무시. UI가 사전 차단 중.
    }
  },

  mergePrimitive: (sourceId, targetId) => {
    const { ir } = get();
    try {
      set({ ir: mergePrimitiveOp(ir, sourceId, targetId) });
    } catch {
      // 동일 primitive이거나 존재하지 않음 — 조용히 무시.
    }
  },
}));
