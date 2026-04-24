import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  mergePrimitive as mergePrimitiveOp,
  rebindShade as rebindShadeOp,
  removePrimitive as removePrimitiveOp,
} from '../color/atlas-ops';
import {
  addPrimitive,
  findNearestPrimitive,
  findNearestShade,
  isWithinScale,
  pruneOrphanPrimitives,
} from '../color/primitive-ops';
import { nearestShadeForL } from '../color/primitive';
import {
  COMPONENT_DEFINITIONS,
  type ComponentGroupId,
} from '../catalog/components';
import { DEFAULT_LOCALE, i18n, type Locale } from '../i18n';
import { FIXED_PALETTES } from '../color/fixed-palettes';
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

export type Layer = 'z0' | 'z1' | 'z2';
export type LayerDirection = 'ascend' | 'descend' | 'neutral';

type PosaState = {
  /**
   * 온보딩에서 사용자가 선택한 컴포넌트 id 목록. 색 지정 대상 스코프.
   * 빈 배열이면 아직 온보딩 전으로 간주되어 라우트 가드에 쓰인다.
   */
  activeComponentIds: ComponentId[];
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

  /** UI locale. i18next와 동기화된다. */
  locale: Locale;

  /**
   * Atlas에서 사용자가 선택한 (primitive, shade) 앵커.
   * 이 선택이 살아있는 동안 프리뷰 스코프가 이 스텝의 소비자 집합으로 좁혀지고
   * 플로팅 프리뷰 오버레이도 띄워진다. 드래그로 shade를 다른 스텝으로 옮기면
   * selection도 함께 이동한다. 다른 셀을 선택하거나 밖을 클릭하면 해제.
   */
  atlasSelection: { primitiveId: PrimitiveId; shade: ShadeIndex } | null;

  /**
   * Live Preview 패널의 폭(px). 사용자가 왼쪽 보더의 리사이즈 핸들을 드래그해 변경한다.
   * 영속화되므로 다음 세션에서도 그대로 복원된다.
   */
  previewPanelWidth: number;

  // Lifecycle
  startFresh: () => void;
  addActiveComponents: (ids: ComponentId[]) => void;
  removeActiveComponents: (ids: ComponentId[]) => void;
  resetNavigation: () => void;
  setLocale: (locale: Locale) => void;

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

  // Atlas
  removePrimitive: (primitiveId: PrimitiveId) => void;
  mergePrimitive: (sourceId: PrimitiveId, targetId: PrimitiveId) => void;
  /**
   * 같은 primitive 내에서 fromShade를 참조하던 모든 소비자를 toShade로 일괄 이동.
   * Atlas의 참조 숫자 드래그가 hover를 바꿀 때마다 호출된다.
   */
  rebindPrimitiveShade: (
    primitiveId: PrimitiveId,
    fromShade: ShadeIndex,
    toShade: ShadeIndex,
  ) => void;
  /** Atlas 셀을 mousedown한 순간 — selection을 해당 (primitive, shade)로 세팅/교체. */
  selectAtlasShade: (primitiveId: PrimitiveId, shade: ShadeIndex) => void;
  /** 드래그 중 같은 primitive의 다른 shade로 selection이 옮겨갈 때. */
  moveAtlasSelection: (shade: ShadeIndex) => void;
  /** 밖을 클릭했거나 명시적으로 해제할 때. */
  clearAtlasSelection: () => void;

  /** Live Preview 패널 폭을 지정 폭으로 조정. 내부에서 clamp되어 저장된다. */
  setPreviewPanelWidth: (width: number) => void;

  /** ColorExplorer Fine-Tune 상단 고정 팔레트 row의 현재 팔레트 index. */
  finePaletteIndex: number;
  /** 다음 팔레트로 순환. FIXED_PALETTES 길이 기준 modulo. */
  cycleFinePalette: () => void;
};

export const PREVIEW_PANEL_MIN_WIDTH = 280;
export const PREVIEW_PANEL_MAX_WIDTH = 720;
export const PREVIEW_PANEL_DEFAULT_WIDTH = 380;

function clampPreviewPanelWidth(w: number): number {
  if (!Number.isFinite(w)) return PREVIEW_PANEL_DEFAULT_WIDTH;
  return Math.max(
    PREVIEW_PANEL_MIN_WIDTH,
    Math.min(PREVIEW_PANEL_MAX_WIDTH, Math.round(w)),
  );
}

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
 *
 * 새 primitive 생성 시 anchorShade는 color.L에 가장 가까운 TARGET_L의 shade로 결정한다.
 * 이전엔 호출자의 fallback(직전 ref shade)을 썼지만, 그 shade의 TARGET_L과 color.L이
 * 동떨어지면 주변 블렌드가 V자로 꺾여 50이 가장 밝지 않거나 hue가 튀어 보이는 scale이
 * 생성되는 문제가 있었다.
 */
function rebindColor(ir: IR, color: OKLCH): { ir: IR; ref: ColorRef } {
  const nearest = findNearestPrimitive(ir, color);
  if (nearest && isWithinScale(color, nearest)) {
    const shade = findNearestShade(nearest, color.L);
    return {
      ir,
      ref: { kind: 'primitive', primitive: nearest.id, shade },
    };
  }
  const anchorShade = nearestShadeForL(color.L);
  const { ir: next, primitiveId } = addPrimitive(ir, color, anchorShade);
  return {
    ir: next,
    ref: { kind: 'primitive', primitive: primitiveId, shade: anchorShade },
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

export const usePosaStore = create<PosaState>()(
  persist(
    (set, get) => ({
  activeComponentIds: [],
  ir: createEmptyIR(),
  layer: 'z0',
  selectedAttributeId: null,
  selectedSlotId: null,
  selectedComponentId: null,
  selectedGroupId: null,
  focusedNode: null,
  lastDirection: 'neutral',
  locale: DEFAULT_LOCALE,
  atlasSelection: null,
  previewPanelWidth: PREVIEW_PANEL_DEFAULT_WIDTH,
  finePaletteIndex: 0,

  cycleFinePalette: () => {
    set((s) => ({
      finePaletteIndex:
        (s.finePaletteIndex + 1) % FIXED_PALETTES.length,
    }));
  },

  setLocale: (locale) => {
    void i18n.changeLanguage(locale);
    set({ locale });
  },

  resetNavigation: () => {
    set({
      layer: 'z0',
      selectedAttributeId: null,
      selectedSlotId: null,
      selectedComponentId: null,
      selectedGroupId: null,
      focusedNode: null,
      lastDirection: 'neutral',
    });
  },

  startFresh: () => {
    set({
      activeComponentIds: [],
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

  addActiveComponents: (ids) => {
    // 카탈로그 순서로 정규화 — selector·프리뷰가 이 순서대로 순회한다.
    const { activeComponentIds } = get();
    const union = new Set<ComponentId>([...activeComponentIds, ...ids]);
    const ordered = COMPONENT_DEFINITIONS.map((c) => c.id).filter((id) =>
      union.has(id),
    );
    if (ordered.length === activeComponentIds.length) return;
    set({ activeComponentIds: ordered });
  },

  removeActiveComponents: (ids) => {
    const { activeComponentIds, ir } = get();
    const removeSet = new Set(ids);
    const nextIds = activeComponentIds.filter((id) => !removeSet.has(id));
    if (nextIds.length === activeComponentIds.length) return;

    // 해당 컴포넌트가 소유한 slot만 정리 — primitives/symbols/attributes는 보존.
    // Orphan이 된 primitive는 뒤이어 prune.
    const nextSlots: typeof ir.slots = {};
    for (const [slotId, slot] of Object.entries(ir.slots)) {
      const owner = slotId.split('.')[0];
      if (!removeSet.has(owner)) {
        nextSlots[slotId] = slot;
      }
    }
    const nextIr = pruneOrphanPrimitives(
      bumpMeta({ ...ir, slots: nextSlots }),
    );

    set({
      activeComponentIds: nextIds,
      ir: nextIr,
      // 제거된 컴포넌트를 가리키던 네비게이션 컨텍스트는 무의미해지므로 정리.
      selectedComponentId:
        get().selectedComponentId && removeSet.has(get().selectedComponentId!)
          ? null
          : get().selectedComponentId,
      selectedGroupId: get().selectedGroupId,
      focusedNode: null,
    });
  },

  // ── Symbol ────────────────────────────────────────────────────────────
  setSymbolColor: (symbolId, color) => {
    const { ir } = get();

    if (color === null) {
      if (!ir.symbols[symbolId]) return;
      const nextSymbols = { ...ir.symbols };
      delete nextSymbols[symbolId];
      set({ ir: pruneOrphanPrimitives(bumpMeta({ ...ir, symbols: nextSymbols })) });
      return;
    }

    const { ir: nextIr, ref } = rebindColor(ir, color);
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
      const nextAttrs = { ...ir.attributes };
      delete nextAttrs[attrId];
      set({ ir: pruneOrphanPrimitives(bumpMeta({ ...ir, attributes: nextAttrs })) });
      return;
    }

    const { ir: nextIr, ref } = rebindColor(ir, color);
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

    const { ir: nextIr, ref } = rebindColor(withShell, color);
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

    const { ir: nextIr, ref } = rebindColor(withShell, color);

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

  // ── Atlas ─────────────────────────────────────────────────────────────
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

  rebindPrimitiveShade: (primitiveId, fromShade, toShade) => {
    if (fromShade === toShade) return;
    const { ir } = get();
    const nextIr = rebindShadeOp(ir, primitiveId, fromShade, toShade);
    if (nextIr === ir) return;
    set({ ir: nextIr });
  },

  selectAtlasShade: (primitiveId, shade) => {
    set({ atlasSelection: { primitiveId, shade } });
  },

  moveAtlasSelection: (shade) => {
    const { atlasSelection } = get();
    if (!atlasSelection || atlasSelection.shade === shade) return;
    set({ atlasSelection: { ...atlasSelection, shade } });
  },

  clearAtlasSelection: () => {
    set({ atlasSelection: null });
  },

  setPreviewPanelWidth: (width) => {
    const next = clampPreviewPanelWidth(width);
    if (get().previewPanelWidth === next) return;
    set({ previewPanelWidth: next });
  },
    }),
    {
      name: 'posa-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // IR·스코프·locale만 영속화. 네비게이션 컨텍스트(layer/selected*/focus)는
      // 세션 스코프 — 새로고침 시 Z0에서 시작하도록 의도적으로 제외.
      partialize: (s) => ({
        activeComponentIds: s.activeComponentIds,
        ir: s.ir,
        locale: s.locale,
        previewPanelWidth: s.previewPanelWidth,
        finePaletteIndex: s.finePaletteIndex,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) void i18n.changeLanguage(state.locale);
      },
    },
  ),
);
