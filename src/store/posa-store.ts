import { create } from 'zustand';
import {
  mergePrimitive as mergePrimitiveOp,
  removePrimitive as removePrimitiveOp,
} from '../color/atlas-ops';
import {
  addPrimitive,
  findNearestPrimitive,
  findNearestShade,
  isWithinScale,
  pruneOrphanPrimitives,
} from '../color/primitive-ops';
import type { ComponentGroupId } from '../catalog/components';
import {
  createEmptyIR,
  type AttributeId,
  type ColorRef,
  type ComponentId,
  type IR,
  type OKLCH,
  type PrimitiveId,
  type ShadeIndex,
  type SlotId,
  type StateId,
  type SymbolId,
} from '../ir/types';

/**
 * Posa 인스턴스의 런타임 상태.
 * IR(사용자 결정)과 탐색 컨텍스트(layer, 선택, focus)를 모두 담는다.
 * 카탈로그(Symbol/Attribute/Component 정의)는 정적이라 여기 들어오지 않는다.
 */

export type Phase = 'exploration' | 'atlas' | 'export';
export type Layer = 'z0' | 'z1' | 'z2';
export type LayerDirection = 'ascend' | 'descend' | 'neutral';

type PosaState = {
  phase: Phase;
  ir: IR;

  // Navigation
  layer: Layer;
  selectedAttributeId: AttributeId | null; // Z1 descent target
  selectedSlotId: SlotId | null; // Z2 descent target
  /** ZX(Component 모드) 진입 target. null이면 일반 Z0~Z2. 프리뷰에서 컴포넌트를 선택하면 세팅된다. */
  selectedComponentId: ComponentId | null;
  /**
   * 프리뷰 범위를 그룹 멤버로 좁히는 필터. null이면 전체.
   *   - layer / selectedComponentId 와 독립적으로 적용된다(교집합).
   *   - 그룹 선택 상태에서 그룹 내 컴포넌트를 ZX로 더 파고들 수도 있다.
   */
  selectedGroupId: ComponentGroupId | null;
  focusedNode: string | null; // 현재 평면에서 inspector 열린 node id
  lastDirection: LayerDirection;

  // Lifecycle
  startFresh: () => void;

  // Symbol assignment
  setSymbolColor: (symbolId: SymbolId, color: OKLCH | null) => void;
  setSymbolShade: (symbolId: SymbolId, shade: ShadeIndex) => void;
  setSymbolAssignment: (
    symbolId: SymbolId,
    primitive: PrimitiveId,
    shade: ShadeIndex,
  ) => void;

  // Attribute assignment (Z0 default) — primitive only; symbol live link 금지
  setAttributeColor: (attrId: AttributeId, color: OKLCH | null) => void;
  setAttributeShade: (attrId: AttributeId, shade: ShadeIndex) => void;
  setAttributeAssignment: (
    attrId: AttributeId,
    primitive: PrimitiveId,
    shade: ShadeIndex,
  ) => void;

  // Slot default ref (Z1)
  setSlotColor: (slotId: SlotId, color: OKLCH | null) => void;
  setSlotShade: (slotId: SlotId, shade: ShadeIndex) => void;
  setSlotAssignment: (
    slotId: SlotId,
    primitive: PrimitiveId,
    shade: ShadeIndex,
  ) => void;
  setSlotSymbol: (slotId: SlotId, symbolId: SymbolId) => void;

  // Slot state override (Z2)
  setSlotStateColor: (
    slotId: SlotId,
    state: Exclude<StateId, 'default'>,
    color: OKLCH | null,
  ) => void;
  setSlotStateShade: (
    slotId: SlotId,
    state: Exclude<StateId, 'default'>,
    shade: ShadeIndex,
  ) => void;
  setSlotStateAssignment: (
    slotId: SlotId,
    state: Exclude<StateId, 'default'>,
    primitive: PrimitiveId,
    shade: ShadeIndex,
  ) => void;
  setSlotStateSymbol: (
    slotId: SlotId,
    state: Exclude<StateId, 'default'>,
    symbolId: SymbolId,
  ) => void;

  // Navigation
  descendToAttribute: (attrId: AttributeId) => void;
  descendToSlot: (slotId: SlotId) => void;
  ascend: () => void;
  jumpToLayer: (layer: Layer) => void;
  setFocus: (nodeId: string | null) => void;

  // ZX (Component mode)
  selectComponent: (componentId: ComponentId) => void;
  clearSelectedComponent: () => void;

  // Group scope (preview filter)
  selectGroup: (groupId: ComponentGroupId) => void;
  clearSelectedGroup: () => void;

  // Phase / atlas
  goToPhase: (phase: Phase) => void;
  removePrimitive: (primitiveId: PrimitiveId) => void;
  mergePrimitive: (sourceId: PrimitiveId, targetId: PrimitiveId) => void;
};

const DEFAULT_SHADE: ShadeIndex = 500;
const LAYER_INDEX: Record<Layer, number> = { z0: 0, z1: 1, z2: 2 };

// ──────────────────────────────────────────────────────────────────────────
// 내부 헬퍼 — ColorRef 세팅의 공통 파이프라인
// ──────────────────────────────────────────────────────────────────────────

/**
 * 소비자(symbol/attribute/slot/slot-state)가 새 색을 요청했을 때의 IR 패치.
 *
 * 원칙:
 *   - 원천(primitive) anchor는 절대 건드리지 않는다.
 *   - 가장 가까운 기존 primitive가 그 색의 scale 안에 들어오면 그걸 재사용 (자기 ref만 갈아끼움).
 *   - 그렇지 않으면 새 primitive를 생성해서 거기에 ref를 꽂는다.
 *
 * 이렇게 해야 "원천이 바뀌면 참조한 모두가 바뀐다, 소비자가 바꾸면 자기 연결만 바뀐다"는
 * 분리가 유지된다. (이전엔 같은 scale 안의 색을 고르면 primitive anchor를 옮겨 cascade가 발생.)
 */
function rebindColor(
  ir: IR,
  color: OKLCH,
  fallbackShade: ShadeIndex,
): { ir: IR; ref: ColorRef } {
  const nearest = findNearestPrimitive(ir, color);
  if (nearest && isWithinScale(color, nearest)) {
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

function bumpMeta(ir: IR): IR {
  return { ...ir, meta: { ...ir.meta, updatedAt: Date.now() } };
}

function ensureSlot(ir: IR, slotId: SlotId): IR {
  if (ir.slots[slotId]) return ir;
  return {
    ...ir,
    slots: {
      ...ir.slots,
      [slotId]: { ref: null, states: {} },
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────────────────────────────────

export const usePosaStore = create<PosaState>((set, get) => ({
  phase: 'exploration',
  ir: createEmptyIR(),
  layer: 'z0',
  selectedAttributeId: null,
  selectedSlotId: null,
  selectedComponentId: null,
  selectedGroupId: null,
  focusedNode: null,
  lastDirection: 'neutral',

  startFresh: () => {
    set({
      phase: 'exploration',
      ir: createEmptyIR(),
      layer: 'z0',
      selectedAttributeId: null,
      selectedSlotId: null,
      selectedComponentId: null,
      selectedGroupId: null,
      focusedNode: null,
      lastDirection: 'neutral',
    });
  },

  // ── Symbol ────────────────────────────────────────────────────────────
  setSymbolColor: (symbolId, color) => {
    const { ir } = get();

    if (color === null) {
      if (!ir.symbols[symbolId]) return;
      const nextSymbols = { ...ir.symbols, [symbolId]: null };
      set({ ir: pruneOrphanPrimitives(bumpMeta({ ...ir, symbols: nextSymbols })) });
      return;
    }

    const fallbackShade = ir.symbols[symbolId]?.shade ?? DEFAULT_SHADE;
    const { ir: nextIr, ref } = rebindColor(ir, color, fallbackShade);
    if (ref.kind !== 'primitive') return; // 방어적
    const nextSymbols = {
      ...nextIr.symbols,
      [symbolId]: { primitive: ref.primitive, shade: ref.shade },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...nextIr, symbols: nextSymbols })) });
  },

  setSymbolShade: (symbolId, shade) => {
    const { ir } = get();
    const current = ir.symbols[symbolId];
    if (!current || current.shade === shade) return;
    const nextSymbols = {
      ...ir.symbols,
      [symbolId]: { ...current, shade },
    };
    set({ ir: bumpMeta({ ...ir, symbols: nextSymbols }) });
  },

  setSymbolAssignment: (symbolId, primitive, shade) => {
    const { ir } = get();
    if (!ir.primitives[primitive]) return;
    const nextSymbols = { ...ir.symbols, [symbolId]: { primitive, shade } };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...ir, symbols: nextSymbols })) });
  },

  // ── Attribute ─────────────────────────────────────────────────────────
  setAttributeColor: (attrId, color) => {
    const { ir } = get();

    if (color === null) {
      if (!ir.attributes[attrId]) return;
      const nextAttrs = { ...ir.attributes, [attrId]: null };
      set({ ir: pruneOrphanPrimitives(bumpMeta({ ...ir, attributes: nextAttrs })) });
      return;
    }

    const fallbackShade = ir.attributes[attrId]?.shade ?? DEFAULT_SHADE;
    const { ir: nextIr, ref } = rebindColor(ir, color, fallbackShade);
    if (ref.kind !== 'primitive') return; // 방어적: rebindColor는 항상 primitive ref 반환
    const nextAttrs = {
      ...nextIr.attributes,
      [attrId]: { primitive: ref.primitive, shade: ref.shade },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...nextIr, attributes: nextAttrs })) });
  },

  setAttributeShade: (attrId, shade) => {
    const { ir } = get();
    const current = ir.attributes[attrId];
    if (!current || current.shade === shade) return;
    const nextAttrs = { ...ir.attributes, [attrId]: { ...current, shade } };
    set({ ir: bumpMeta({ ...ir, attributes: nextAttrs }) });
  },

  setAttributeAssignment: (attrId, primitive, shade) => {
    const { ir } = get();
    if (!ir.primitives[primitive]) return;
    const nextAttrs = {
      ...ir.attributes,
      [attrId]: { primitive, shade },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...ir, attributes: nextAttrs })) });
  },

  // ── Slot (default ref) ────────────────────────────────────────────────
  setSlotColor: (slotId, color) => {
    const { ir } = get();
    const withShell = ensureSlot(ir, slotId);
    const slot = withShell.slots[slotId];

    if (color === null) {
      if (!slot.ref) {
        // 그대로 inherit 상태. 실제 저장할 필요 없지만, 상태 일관성을 위해 slot을 지운다.
        if (Object.keys(slot.states).length === 0 && !ir.slots[slotId]) return;
        if (Object.keys(slot.states).length === 0) {
          const nextSlots = { ...withShell.slots };
          delete nextSlots[slotId];
          set({ ir: pruneOrphanPrimitives(bumpMeta({ ...withShell, slots: nextSlots })) });
          return;
        }
        return;
      }
      const nextSlot = { ...slot, ref: null };
      const nextSlots = { ...withShell.slots, [slotId]: nextSlot };
      set({ ir: pruneOrphanPrimitives(bumpMeta({ ...withShell, slots: nextSlots })) });
      return;
    }

    const fallbackShade =
      slot.ref?.kind === 'primitive' ? slot.ref.shade : DEFAULT_SHADE;
    const { ir: nextIr, ref } = rebindColor(withShell, color, fallbackShade);
    const nextSlots = {
      ...nextIr.slots,
      [slotId]: { ...nextIr.slots[slotId], ref },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...nextIr, slots: nextSlots })) });
  },

  setSlotShade: (slotId, shade) => {
    const { ir } = get();
    const slot = ir.slots[slotId];
    if (!slot?.ref || slot.ref.kind !== 'primitive' || slot.ref.shade === shade) return;
    const nextSlots = {
      ...ir.slots,
      [slotId]: { ...slot, ref: { ...slot.ref, shade } },
    };
    set({ ir: bumpMeta({ ...ir, slots: nextSlots }) });
  },

  setSlotAssignment: (slotId, primitive, shade) => {
    const { ir } = get();
    if (!ir.primitives[primitive]) return;
    const withShell = ensureSlot(ir, slotId);
    const slot = withShell.slots[slotId];
    const nextSlots = {
      ...withShell.slots,
      [slotId]: { ...slot, ref: { kind: 'primitive' as const, primitive, shade } },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...withShell, slots: nextSlots })) });
  },

  setSlotSymbol: (slotId, symbolId) => {
    const { ir } = get();
    const withShell = ensureSlot(ir, slotId);
    const slot = withShell.slots[slotId];
    const nextSlots = {
      ...withShell.slots,
      [slotId]: { ...slot, ref: { kind: 'symbol' as const, symbol: symbolId } },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...withShell, slots: nextSlots })) });
  },

  // ── Slot state override ───────────────────────────────────────────────
  setSlotStateColor: (slotId, state, color) => {
    const { ir } = get();
    const withShell = ensureSlot(ir, slotId);
    const slot = withShell.slots[slotId];

    if (color === null) {
      if (!slot.states[state]) return;
      const nextStates = { ...slot.states };
      delete nextStates[state];
      const nextSlots = {
        ...withShell.slots,
        [slotId]: { ...slot, states: nextStates },
      };
      set({ ir: pruneOrphanPrimitives(bumpMeta({ ...withShell, slots: nextSlots })) });
      return;
    }

    const existing = slot.states[state];
    const fallbackShade =
      existing?.kind === 'primitive' ? existing.shade : DEFAULT_SHADE;
    const { ir: nextIr, ref } = rebindColor(withShell, color, fallbackShade);

    const nextSlots = {
      ...nextIr.slots,
      [slotId]: {
        ...nextIr.slots[slotId],
        states: { ...nextIr.slots[slotId].states, [state]: ref },
      },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...nextIr, slots: nextSlots })) });
  },

  setSlotStateShade: (slotId, state, shade) => {
    const { ir } = get();
    const slot = ir.slots[slotId];
    const existing = slot?.states?.[state];
    if (!slot || !existing || existing.kind !== 'primitive' || existing.shade === shade) {
      return;
    }
    const nextSlots = {
      ...ir.slots,
      [slotId]: {
        ...slot,
        states: { ...slot.states, [state]: { ...existing, shade } },
      },
    };
    set({ ir: bumpMeta({ ...ir, slots: nextSlots }) });
  },

  setSlotStateAssignment: (slotId, state, primitive, shade) => {
    const { ir } = get();
    if (!ir.primitives[primitive]) return;
    const withShell = ensureSlot(ir, slotId);
    const slot = withShell.slots[slotId];
    const nextSlots = {
      ...withShell.slots,
      [slotId]: {
        ...slot,
        states: { ...slot.states, [state]: { kind: 'primitive' as const, primitive, shade } },
      },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...withShell, slots: nextSlots })) });
  },

  setSlotStateSymbol: (slotId, state, symbolId) => {
    const { ir } = get();
    const withShell = ensureSlot(ir, slotId);
    const slot = withShell.slots[slotId];
    const nextSlots = {
      ...withShell.slots,
      [slotId]: {
        ...slot,
        states: { ...slot.states, [state]: { kind: 'symbol' as const, symbol: symbolId } },
      },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...withShell, slots: nextSlots })) });
  },

  // ── Navigation ────────────────────────────────────────────────────────
  descendToAttribute: (attrId) => {
    set({
      layer: 'z1',
      selectedAttributeId: attrId,
      selectedSlotId: null,
      focusedNode: null,
      lastDirection: 'descend',
    });
  },

  descendToSlot: (slotId) => {
    set({
      layer: 'z2',
      selectedSlotId: slotId,
      focusedNode: null,
      lastDirection: 'descend',
    });
  },

  ascend: () => {
    const { layer } = get();
    if (layer === 'z2') {
      set({
        layer: 'z1',
        selectedSlotId: null,
        focusedNode: null,
        lastDirection: 'ascend',
      });
    } else if (layer === 'z1') {
      set({
        layer: 'z0',
        selectedAttributeId: null,
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
      patch.selectedAttributeId = null;
      patch.selectedSlotId = null;
    }
    if (targetLayer === 'z1') {
      patch.selectedSlotId = null;
    }
    set(patch);
  },

  setFocus: (nodeId) => set({ focusedNode: nodeId }),

  // ── ZX (Component mode) ──────────────────────────────────────────────
  selectComponent: (componentId) =>
    set({ selectedComponentId: componentId, focusedNode: null }),
  clearSelectedComponent: () =>
    set({ selectedComponentId: null, focusedNode: null }),

  selectGroup: (groupId) =>
    set({
      selectedGroupId: groupId,
      // 그룹 범위를 바꾸면 기존 ZX/slot/attribute 컨텍스트는 무의미해지므로 리셋.
      selectedComponentId: null,
      selectedAttributeId: null,
      selectedSlotId: null,
      focusedNode: null,
      layer: 'z0',
    }),
  clearSelectedGroup: () => set({ selectedGroupId: null }),

  // ── Phase / atlas ─────────────────────────────────────────────────────
  goToPhase: (phase) => {
    set({ phase, focusedNode: null });
  },

  removePrimitive: (primitiveId) => {
    const { ir } = get();
    try {
      set({ ir: removePrimitiveOp(ir, primitiveId) });
    } catch {
      // UI가 사전 차단 중. 조용히 무시.
    }
  },

  mergePrimitive: (sourceId, targetId) => {
    const { ir } = get();
    try {
      set({ ir: mergePrimitiveOp(ir, sourceId, targetId) });
    } catch {
      // 존재하지 않거나 동일 — 무시.
    }
  },
}));
