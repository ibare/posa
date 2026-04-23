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
  pruneOrphanPrimitives,
} from '../color/primitive-ops';
import {
  createEmptyIR,
  type AttributeId,
  type ColorRef,
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

export type PendingPrimitiveTarget =
  | { kind: 'symbol'; symbolId: SymbolId }
  | { kind: 'attribute'; attributeId: AttributeId }
  | { kind: 'slot'; slotId: SlotId }
  | { kind: 'slot-state'; slotId: SlotId; state: Exclude<StateId, 'default'> };

export type PendingPrimitiveDecision = {
  target: PendingPrimitiveTarget;
  newAnchor: OKLCH;
  currentPrimitiveId: PrimitiveId;
  shadeForAnchor: ShadeIndex;
};

type PosaState = {
  phase: Phase;
  ir: IR;

  // Navigation
  layer: Layer;
  selectedAttributeId: AttributeId | null; // Z1 descent target
  selectedSlotId: SlotId | null; // Z2 descent target
  focusedNode: string | null; // 현재 평면에서 inspector 열린 node id
  lastDirection: LayerDirection;
  pendingPrimitiveDecision: PendingPrimitiveDecision | null;

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

  // Attribute assignment (Z0 default)
  setAttributeColor: (attrId: AttributeId, color: OKLCH | null) => void;
  setAttributeShade: (attrId: AttributeId, shade: ShadeIndex) => void;
  setAttributeAssignment: (
    attrId: AttributeId,
    primitive: PrimitiveId,
    shade: ShadeIndex,
  ) => void;
  setAttributeSymbol: (attrId: AttributeId, symbolId: SymbolId) => void;

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

  // Pending primitive decisions (scale-외 색 선택 시)
  resolvePendingPrimitive: (choice: 'adjust' | 'replace') => void;
  cancelPendingPrimitive: () => void;

  // Navigation
  descendToAttribute: (attrId: AttributeId) => void;
  descendToSlot: (slotId: SlotId) => void;
  ascend: () => void;
  jumpToLayer: (layer: Layer) => void;
  setFocus: (nodeId: string | null) => void;

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
 * color → IR 패치.
 * 가까운 기존 primitive가 있으면 그걸 재사용, 없으면 새 primitive 생성.
 * scale 내부에 있으면 anchor 조정 path를 선택하고, 외부면 caller가 pending decision을 띄울 수 있도록
 * 결과에 `needsDecision` 플래그를 단다.
 */
function rebindColor(
  ir: IR,
  color: OKLCH,
  currentPrimitiveId: PrimitiveId | null,
  fallbackShade: ShadeIndex,
): {
  ir: IR;
  ref: ColorRef;
  needsDecision: boolean;
  currentPrimitiveId: PrimitiveId | null;
} {
  // 기존 참조 primitive가 있고 scale 내부면 anchor 조정. 그대로 그 primitive 재사용.
  if (currentPrimitiveId) {
    const current = ir.primitives[currentPrimitiveId];
    if (current && isWithinScale(color, current)) {
      const nextIr = adjustPrimitiveAnchor(ir, current.id, color);
      // shade는 target L에서 재계산 — 사용자가 anchor를 옮겨 기존 shade가 색을 덜 대표하게 되었을 수 있음.
      const nextPrim = nextIr.primitives[current.id];
      const shade = nextPrim ? findNearestShade(nextPrim, color.L) : fallbackShade;
      return {
        ir: nextIr,
        ref: { kind: 'primitive', primitive: current.id, shade },
        needsDecision: false,
        currentPrimitiveId: current.id,
      };
    }
    // scale 외부 — 결정 필요.
    if (current) {
      return {
        ir,
        ref: { kind: 'primitive', primitive: current.id, shade: fallbackShade },
        needsDecision: true,
        currentPrimitiveId: current.id,
      };
    }
  }

  // 기존 참조가 없거나 손실됨. 가장 가까운 primitive 재사용 or 생성.
  const nearest = findNearestPrimitive(ir, color);
  if (nearest) {
    const shade = findNearestShade(nearest, color.L);
    return {
      ir,
      ref: { kind: 'primitive', primitive: nearest.id, shade },
      needsDecision: false,
      currentPrimitiveId: nearest.id,
    };
  }
  const { ir: next, primitiveId } = addPrimitive(ir, color, fallbackShade);
  return {
    ir: next,
    ref: { kind: 'primitive', primitive: primitiveId, shade: fallbackShade },
    needsDecision: false,
    currentPrimitiveId: primitiveId,
  };
}

function refToPrimitiveId(ref: ColorRef | null | undefined): PrimitiveId | null {
  if (!ref) return null;
  if (ref.kind !== 'primitive') return null;
  return ref.primitive;
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
  focusedNode: null,
  lastDirection: 'neutral',
  pendingPrimitiveDecision: null,

  startFresh: () => {
    set({
      phase: 'exploration',
      ir: createEmptyIR(),
      layer: 'z0',
      selectedAttributeId: null,
      selectedSlotId: null,
      focusedNode: null,
      lastDirection: 'neutral',
      pendingPrimitiveDecision: null,
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

    const current = ir.symbols[symbolId];
    const currentPrimitiveId = current?.primitive ?? null;
    const fallbackShade = current?.shade ?? DEFAULT_SHADE;

    const { ir: nextIr, ref, needsDecision, currentPrimitiveId: nextPrim } =
      rebindColor(ir, color, currentPrimitiveId, fallbackShade);

    if (needsDecision && nextPrim) {
      set({
        pendingPrimitiveDecision: {
          target: { kind: 'symbol', symbolId },
          newAnchor: color,
          currentPrimitiveId: nextPrim,
          shadeForAnchor: fallbackShade,
        },
      });
      return;
    }

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

    const current = ir.attributes[attrId];
    const currentPrimitiveId = refToPrimitiveId(current);
    const fallbackShade =
      current?.kind === 'primitive' ? current.shade : DEFAULT_SHADE;

    const { ir: nextIr, ref, needsDecision, currentPrimitiveId: nextPrim } =
      rebindColor(ir, color, currentPrimitiveId, fallbackShade);

    if (needsDecision && nextPrim) {
      set({
        pendingPrimitiveDecision: {
          target: { kind: 'attribute', attributeId: attrId },
          newAnchor: color,
          currentPrimitiveId: nextPrim,
          shadeForAnchor: fallbackShade,
        },
      });
      return;
    }

    const nextAttrs = { ...nextIr.attributes, [attrId]: ref };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...nextIr, attributes: nextAttrs })) });
  },

  setAttributeShade: (attrId, shade) => {
    const { ir } = get();
    const current = ir.attributes[attrId];
    if (!current || current.kind !== 'primitive' || current.shade === shade) return;
    const nextAttrs = { ...ir.attributes, [attrId]: { ...current, shade } };
    set({ ir: bumpMeta({ ...ir, attributes: nextAttrs }) });
  },

  setAttributeAssignment: (attrId, primitive, shade) => {
    const { ir } = get();
    if (!ir.primitives[primitive]) return;
    const nextAttrs = {
      ...ir.attributes,
      [attrId]: { kind: 'primitive' as const, primitive, shade },
    };
    set({ ir: pruneOrphanPrimitives(bumpMeta({ ...ir, attributes: nextAttrs })) });
  },

  setAttributeSymbol: (attrId, symbolId) => {
    const { ir } = get();
    const nextAttrs = {
      ...ir.attributes,
      [attrId]: { kind: 'symbol' as const, symbol: symbolId },
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

    const currentPrimitiveId = refToPrimitiveId(slot.ref);
    const fallbackShade =
      slot.ref?.kind === 'primitive' ? slot.ref.shade : DEFAULT_SHADE;

    const { ir: nextIr, ref, needsDecision, currentPrimitiveId: nextPrim } =
      rebindColor(withShell, color, currentPrimitiveId, fallbackShade);

    if (needsDecision && nextPrim) {
      set({
        pendingPrimitiveDecision: {
          target: { kind: 'slot', slotId },
          newAnchor: color,
          currentPrimitiveId: nextPrim,
          shadeForAnchor: fallbackShade,
        },
      });
      return;
    }

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
    const currentPrimitiveId = refToPrimitiveId(existing);
    const fallbackShade =
      existing?.kind === 'primitive' ? existing.shade : DEFAULT_SHADE;

    const { ir: nextIr, ref, needsDecision, currentPrimitiveId: nextPrim } =
      rebindColor(withShell, color, currentPrimitiveId, fallbackShade);

    if (needsDecision && nextPrim) {
      set({
        pendingPrimitiveDecision: {
          target: { kind: 'slot-state', slotId, state },
          newAnchor: color,
          currentPrimitiveId: nextPrim,
          shadeForAnchor: fallbackShade,
        },
      });
      return;
    }

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

  // ── Pending decision ──────────────────────────────────────────────────
  resolvePendingPrimitive: (choice) => {
    const { pendingPrimitiveDecision: pending, ir } = get();
    if (!pending) return;

    if (choice === 'adjust') {
      const next = adjustPrimitiveAnchor(ir, pending.currentPrimitiveId, pending.newAnchor);
      const prim = next.primitives[pending.currentPrimitiveId];
      const shade = prim
        ? findNearestShade(prim, pending.newAnchor.L)
        : pending.shadeForAnchor;
      const applied = applyRef(next, pending.target, {
        kind: 'primitive',
        primitive: pending.currentPrimitiveId,
        shade,
      });
      set({ ir: applied, pendingPrimitiveDecision: null });
      return;
    }

    // replace: 새 primitive 생성 후 target이 새 것을 참조.
    const { ir: withNew, primitiveId } = addPrimitive(
      ir,
      pending.newAnchor,
      pending.shadeForAnchor,
    );
    const applied = applyRef(withNew, pending.target, {
      kind: 'primitive',
      primitive: primitiveId,
      shade: pending.shadeForAnchor,
    });
    set({ ir: pruneOrphanPrimitives(applied), pendingPrimitiveDecision: null });
  },

  cancelPendingPrimitive: () => set({ pendingPrimitiveDecision: null }),

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

  // ── Phase / atlas ─────────────────────────────────────────────────────
  goToPhase: (phase) => {
    set({ phase, focusedNode: null, pendingPrimitiveDecision: null });
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

// ──────────────────────────────────────────────────────────────────────────
// Target에 ref를 꽂는 helper.
// ──────────────────────────────────────────────────────────────────────────
function applyRef(ir: IR, target: PendingPrimitiveTarget, ref: ColorRef): IR {
  if (target.kind === 'symbol') {
    if (ref.kind !== 'primitive') return ir;
    const nextSymbols = {
      ...ir.symbols,
      [target.symbolId]: { primitive: ref.primitive, shade: ref.shade },
    };
    return bumpMeta({ ...ir, symbols: nextSymbols });
  }
  if (target.kind === 'attribute') {
    const nextAttrs = { ...ir.attributes, [target.attributeId]: ref };
    return bumpMeta({ ...ir, attributes: nextAttrs });
  }
  if (target.kind === 'slot') {
    const withShell = ensureSlot(ir, target.slotId);
    const slot = withShell.slots[target.slotId];
    const nextSlots = {
      ...withShell.slots,
      [target.slotId]: { ...slot, ref },
    };
    return bumpMeta({ ...withShell, slots: nextSlots });
  }
  // slot-state
  const withShell = ensureSlot(ir, target.slotId);
  const slot = withShell.slots[target.slotId];
  const nextSlots = {
    ...withShell.slots,
    [target.slotId]: {
      ...slot,
      states: { ...slot.states, [target.state]: ref },
    },
  };
  return bumpMeta({ ...withShell, slots: nextSlots });
}
