import { create } from 'zustand';
import { deriveUniverse, type Universe } from '../catalog/universe';
import type { IR, OKLCH, RoleId, SlotId } from '../ir/types';

/**
 * Posa 인스턴스의 런타임 상태.
 * IR(사용자 결정)과 탐색 컨텍스트(layer, 선택, focus)를 모두 담지만, 카탈로그(마스터 그래프)는 건드리지 않는다.
 */

export type Phase = 'onboarding' | 'exploration' | 'export';
export type Layer = 'z0' | 'z1' | 'z2';
export type LayerDirection = 'ascend' | 'descend' | 'neutral';

type PosaState = {
  phase: Phase;
  universe: Universe | null;
  ir: IR;
  layer: Layer;
  selectedRole: RoleId | null;
  selectedSlot: SlotId | null;
  focusedNode: string | null;
  lastDirection: LayerDirection;

  startWithComponents: (componentIds: string[]) => void;
  resetAll: () => void;

  descendTo: (targetId: string) => void;
  ascend: () => void;
  jumpToLayer: (layer: Layer) => void;
  setFocus: (nodeId: string | null) => void;

  setRoleColor: (roleId: RoleId, color: OKLCH | null) => void;
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

export const usePosaStore = create<PosaState>((set, get) => ({
  phase: 'onboarding',
  universe: null,
  ir: emptyIR(),
  layer: 'z0',
  selectedRole: null,
  selectedSlot: null,
  focusedNode: null,
  lastDirection: 'neutral',

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

  setRoleColor: (_roleId, _color) => {
    // Prompt 04에서 primitive 자동 생성 + role assign 로직과 함께 완성된다.
    // 지금은 skeleton만 둔다.
    console.warn('setRoleColor: primitive 생성 로직은 Prompt 04에서 연결됩니다.');
  },
}));
