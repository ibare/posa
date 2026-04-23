import { useMemo } from 'react';
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
 *   Z1 slot card       → `slot:<slotId>`
 *   Z2 state card      → `state:<state>` (selectedSlotId가 컨텍스트)
 */
export function InspectorBody() {
  const layer = usePosaStore((s) => s.layer);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const selectedSlotId = usePosaStore((s) => s.selectedSlotId);
  const ir = usePosaStore((s) => s.ir);

  const setSymbolColor = usePosaStore((s) => s.setSymbolColor);
  const setSymbolShade = usePosaStore((s) => s.setSymbolShade);
  const setSymbolAssignment = usePosaStore((s) => s.setSymbolAssignment);

  const setAttributeColor = usePosaStore((s) => s.setAttributeColor);
  const setAttributeShade = usePosaStore((s) => s.setAttributeShade);
  const setAttributeAssignment = usePosaStore((s) => s.setAttributeAssignment);
  const setAttributeSymbol = usePosaStore((s) => s.setAttributeSymbol);

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

    // Z0: symbol | attribute
    if (layer === 'z0') {
      if (focusedNode.startsWith('sym:')) {
        const symbolId = focusedNode.slice(4) as SymbolId;
        const assignment = ir.symbols[symbolId];
        const ref: ColorRef | null = assignment
          ? { kind: 'primitive', primitive: assignment.primitive, shade: assignment.shade }
          : null;
        return {
          label: 'symbol',
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
        const assignment = ir.attributes[attrId] ?? null;
        return {
          label: 'attribute',
          nodeLabel: attrId,
          seaKey: attrId,
          color: resolveAttributeColor(ir, attrId),
          assignment,
          isDirect: assignment !== null,
          canClear: assignment !== null,
          supportsSymbolRef: true,
          onChange: (c) => setAttributeColor(attrId, c),
          onClear: () => setAttributeColor(attrId, null),
          onSelectShade: (shade) => setAttributeShade(attrId, shade),
          onSelectPrimitive: (primitiveId, shade) =>
            setAttributeAssignment(attrId, primitiveId, shade),
          onSelectSymbol: (symbolId) => setAttributeSymbol(attrId, symbolId),
        };
      }
      return null;
    }

    // Z1: slot default
    if (layer === 'z1') {
      if (!focusedNode.startsWith('slot:')) return null;
      const slotId = focusedNode.slice(5);
      const slot = ir.slots[slotId];
      const assignment = slot?.ref ?? null;
      const component = findComponentBySlotId(slotId);
      const hasMultipleStates = (component?.states.length ?? 0) > 1;
      const attrId = getAttributeFromSlotId(slotId);
      return {
        label: 'slot',
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

    // Z2: slot state (default uses setSlot*, non-default uses setSlotState*)
    if (!selectedSlotId || !focusedNode.startsWith('state:')) return null;
    const state = focusedNode.slice(6) as StateId;
    const slot = ir.slots[selectedSlotId];
    const attrId = getAttributeFromSlotId(selectedSlotId);

    if (state === 'default') {
      const assignment = slot?.ref ?? null;
      return {
        label: 'state · default',
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
      label: `state · ${state}`,
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
    selectedSlotId,
    ir,
    setSymbolColor,
    setSymbolShade,
    setSymbolAssignment,
    setAttributeColor,
    setAttributeShade,
    setAttributeAssignment,
    setAttributeSymbol,
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
            {layer} · {context.label}
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
          Clear (inherit)
        </button>
      )}

      {context.descendSlot && (
        <button
          type="button"
          onClick={() => descendToSlot(context.descendSlot!)}
          className="w-full inline-flex items-center justify-center gap-2 text-xs font-mono text-stone-700 px-3 py-2 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
        >
          <span>Descend (states)</span>
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
