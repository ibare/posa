import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { findComponentBySlotId } from '../../catalog/components';
import {
  computeUsedShadesByPrimitive,
  getAttributeFromSlotId,
  resolveAttributeColor,
  resolveSlotStateColor,
  resolveSymbolColor,
} from '../../ir/selectors';
import {
  type AttributeId,
  type ColorRef,
  type OKLCH,
  type ShadeIndex,
  type SlotId,
  type StateId,
  type SymbolId,
} from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { ColorExplorer } from './ColorExplorer';

/**
 * Inspector body. 현재 focus된 node의 타입(symbol / attribute / slot / slot-state)을
 * 찾아 ColorExplorer에 binding한다. Focus id 관례:
 *   Z0 attributes 섹션 → `attr:<attributeId>`
 *   Z0 symbols 섹션    → `sym:<symbolId>`
 *   Z1 / ZX slot card  → `slot:<slotId>`
 *   Z2 state card      → `state:<state>` (selectedSlotId가 컨텍스트)
 */
export function InspectorBody() {
  const { t } = useTranslation('inspector');
  const layer = usePosaStore((s) => s.layer);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const selectedSlotId = usePosaStore((s) => s.selectedSlotId);
  const selectedComponentId = usePosaStore((s) => s.selectedComponentId);
  const selectedGroupId = usePosaStore((s) => s.selectedGroupId);
  const ir = usePosaStore((s) => s.ir);
  // 단일 컴포넌트 ZX 또는 그룹 ZX — 둘 다 slot focus가 default state 편집으로 연결된다.
  const inZxMode =
    (selectedComponentId != null || selectedGroupId != null) && layer !== 'z2';

  const setSymbolColor = usePosaStore((s) => s.setSymbolColor);
  const setSymbolShade = usePosaStore((s) => s.setSymbolShade);
  const setSymbolAssignment = usePosaStore((s) => s.setSymbolAssignment);

  const setAttributeColor = usePosaStore((s) => s.setAttributeColor);
  const setAttributeShade = usePosaStore((s) => s.setAttributeShade);
  const setAttributeAssignment = usePosaStore((s) => s.setAttributeAssignment);

  const setSlotColor = usePosaStore((s) => s.setSlotColor);
  const setSlotShade = usePosaStore((s) => s.setSlotShade);
  const setSlotAssignment = usePosaStore((s) => s.setSlotAssignment);
  const setSlotSymbol = usePosaStore((s) => s.setSlotSymbol);

  const setSlotStateColor = usePosaStore((s) => s.setSlotStateColor);
  const setSlotStateShade = usePosaStore((s) => s.setSlotStateShade);
  const setSlotStateAssignment = usePosaStore((s) => s.setSlotStateAssignment);
  const setSlotStateSymbol = usePosaStore((s) => s.setSlotStateSymbol);

  const descendToSlot = usePosaStore((s) => s.descendToSlot);

  const usedShadesByPrimitive = useMemo(
    () => computeUsedShadesByPrimitive(ir),
    [ir],
  );

  type Context = {
    label: string;
    nodeLabel: string;
    seaKey: string;
    color: OKLCH | null;
    assignment: ColorRef | null;
    isDirect: boolean;
    canClear: boolean;
    supportsSymbolRef: boolean;
    onChange: (c: OKLCH) => void;
    onClear: () => void;
    onSelectShade: (shade: ShadeIndex) => void;
    onSelectPrimitive: (primitiveId: string, shade: ShadeIndex) => void;
    onSelectSymbol?: (symbolId: SymbolId) => void;
    descendSlot?: SlotId;
  };

  const context = useMemo<Context | null>(() => {
    if (!focusedNode) return null;

    // Z1 / ZX: slot default (layer에 상관없이 slot: focus는 default state 편집)
    if (
      focusedNode.startsWith('slot:') &&
      (layer === 'z1' || inZxMode)
    ) {
      const slotId = focusedNode.slice(5);
      const slot = ir.slots[slotId];
      const assignment = slot?.ref ?? null;
      const component = findComponentBySlotId(slotId);
      const hasMultipleStates = (component?.states.length ?? 0) > 1;
      const attrId = getAttributeFromSlotId(slotId);
      return {
        label: t('context.slot'),
        nodeLabel: slotId,
        seaKey: attrId,
        color: resolveSlotStateColor(ir, slotId, 'default'),
        assignment,
        isDirect: assignment !== null,
        canClear: assignment !== null,
        supportsSymbolRef: true,
        onChange: (c) => setSlotColor(slotId, c),
        onClear: () => setSlotColor(slotId, null),
        onSelectShade: (shade) => setSlotShade(slotId, shade),
        onSelectPrimitive: (primitiveId, shade) =>
          setSlotAssignment(slotId, primitiveId, shade),
        onSelectSymbol: (symbolId) => setSlotSymbol(slotId, symbolId),
        descendSlot: hasMultipleStates ? slotId : undefined,
      };
    }

    // Z0: symbol | attribute
    if (layer === 'z0' && !inZxMode) {
      if (focusedNode.startsWith('sym:')) {
        const symbolId = focusedNode.slice(4) as SymbolId;
        const assignment = ir.symbols[symbolId];
        const ref: ColorRef | null =
          assignment && assignment.kind === 'primitive'
            ? { kind: 'primitive', primitive: assignment.primitive, shade: assignment.shade }
            : null;
        return {
          label: t('context.symbol'),
          nodeLabel: symbolId,
          seaKey: symbolId,
          color: resolveSymbolColor(ir, symbolId),
          assignment: ref,
          isDirect: Boolean(assignment),
          canClear: Boolean(assignment),
          supportsSymbolRef: false,
          onChange: (c) => setSymbolColor(symbolId, c),
          onClear: () => setSymbolColor(symbolId, null),
          onSelectShade: (shade) => setSymbolShade(symbolId, shade),
          onSelectPrimitive: (primitiveId, shade) =>
            setSymbolAssignment(symbolId, primitiveId, shade),
        };
      }
      if (focusedNode.startsWith('attr:')) {
        const attrId = focusedNode.slice(5) as AttributeId;
        const assignment = ir.attributes[attrId];
        const ref: ColorRef | null =
          assignment && assignment.kind === 'primitive'
            ? { kind: 'primitive', primitive: assignment.primitive, shade: assignment.shade }
            : null;
        return {
          label: t('context.attribute'),
          nodeLabel: attrId,
          seaKey: attrId,
          color: resolveAttributeColor(ir, attrId),
          assignment: ref,
          isDirect: Boolean(assignment),
          canClear: Boolean(assignment),
          // attribute는 라이브 링크는 못 갖지만, "이 symbol의 현재 색을 가져오기"
          // 어포던스는 유지. 클릭 시 그 시점 primitive로 스냅샷 저장.
          supportsSymbolRef: true,
          onChange: (c) => setAttributeColor(attrId, c),
          onClear: () => setAttributeColor(attrId, null),
          onSelectShade: (shade) => setAttributeShade(attrId, shade),
          onSelectPrimitive: (primitiveId, shade) =>
            setAttributeAssignment(attrId, primitiveId, shade),
          onSelectSymbol: (symbolId) => {
            const sa = ir.symbols[symbolId];
            if (!sa) return;
            if (sa.kind === 'primitive') {
              setAttributeAssignment(attrId, sa.primitive, sa.shade);
              return;
            }
            // System symbol alias — rebindColor가 system symbol로 라우팅하도록 literal 색을 넘긴다.
            setAttributeColor(attrId, sa.color);
          },
        };
      }
      return null;
    }

    // Z2: slot state (default uses setSlot*, non-default uses setSlotState*)
    if (layer !== 'z2') return null;
    if (!selectedSlotId || !focusedNode.startsWith('state:')) return null;
    const state = focusedNode.slice(6) as StateId;
    const slot = ir.slots[selectedSlotId];
    const attrId = getAttributeFromSlotId(selectedSlotId);

    if (state === 'default') {
      const assignment = slot?.ref ?? null;
      return {
        label: t('stateDefault'),
        nodeLabel: `${selectedSlotId} / default`,
        seaKey: attrId,
        color: resolveSlotStateColor(ir, selectedSlotId, 'default'),
        assignment,
        isDirect: assignment !== null,
        canClear: assignment !== null,
        supportsSymbolRef: true,
        onChange: (c) => setSlotColor(selectedSlotId, c),
        onClear: () => setSlotColor(selectedSlotId, null),
        onSelectShade: (shade) => setSlotShade(selectedSlotId, shade),
        onSelectPrimitive: (primitiveId, shade) =>
          setSlotAssignment(selectedSlotId, primitiveId, shade),
        onSelectSymbol: (symbolId) => setSlotSymbol(selectedSlotId, symbolId),
      };
    }

    const nonDefault = state as Exclude<StateId, 'default'>;
    const override = slot?.states?.[nonDefault] ?? null;
    return {
      label: t('state', { state }),
      nodeLabel: `${selectedSlotId} / ${state}`,
      seaKey: attrId,
      color: resolveSlotStateColor(ir, selectedSlotId, state),
      assignment: override,
      isDirect: override !== null && override !== undefined,
      canClear: override !== null && override !== undefined,
      supportsSymbolRef: true,
      onChange: (c) => setSlotStateColor(selectedSlotId, nonDefault, c),
      onClear: () => setSlotStateColor(selectedSlotId, nonDefault, null),
      onSelectShade: (shade) =>
        setSlotStateShade(selectedSlotId, nonDefault, shade),
      onSelectPrimitive: (primitiveId, shade) =>
        setSlotStateAssignment(selectedSlotId, nonDefault, primitiveId, shade),
      onSelectSymbol: (symbolId) =>
        setSlotStateSymbol(selectedSlotId, nonDefault, symbolId),
    };
  }, [
    focusedNode,
    layer,
    inZxMode,
    selectedSlotId,
    ir,
    t,
    setSymbolColor,
    setSymbolShade,
    setSymbolAssignment,
    setAttributeColor,
    setAttributeShade,
    setAttributeAssignment,
    setSlotColor,
    setSlotShade,
    setSlotAssignment,
    setSlotSymbol,
    setSlotStateColor,
    setSlotStateShade,
    setSlotStateAssignment,
    setSlotStateSymbol,
  ]);

  if (!focusedNode || !context) return null;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            {inZxMode ? t('layer.zx') : t(`layer.${layer}`)} · {context.label}
          </div>
          <div className="font-mono text-sm text-stone-900 mt-0.5 break-all">
            {context.nodeLabel}
          </div>
        </div>
      </header>

      <ColorExplorer
        seaKey={context.seaKey}
        value={context.color}
        onChange={context.onChange}
        assignment={context.assignment}
        primitives={ir.primitives}
        usedShadesByPrimitive={usedShadesByPrimitive}
        onSelectShade={context.onSelectShade}
        onSelectPrimitive={context.onSelectPrimitive}
        onSelectSymbol={context.supportsSymbolRef ? context.onSelectSymbol : undefined}
        ir={ir}
      />

      {context.canClear && (
        <button
          type="button"
          onClick={context.onClear}
          className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2 self-start"
        >
          {t('clearInherit')}
        </button>
      )}

      {context.descendSlot && (
        <button
          type="button"
          onClick={() => descendToSlot(context.descendSlot!)}
          className="w-full inline-flex items-center justify-center gap-2 text-xs font-mono text-stone-700 px-3 py-2 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
        >
          <span>{t('descendStates')}</span>
          <svg
            viewBox="0 0 12 12"
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4,2 8,6 4,10" />
          </svg>
        </button>
      )}
    </div>
  );
}
