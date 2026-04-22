import { useMemo } from 'react';
import { resolveRoleColor, resolveSlotColor } from '../../color/resolve';
import { oklchToHex } from '../../color/oklch';
import type { OKLCH } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { ColorPicker } from '../shared/ColorPicker';

/**
 * Inspector — focusedNode가 있을 때 우측에 뜨는 패널.
 * Layer에 따라 어떤 setter가 붙는지 달라진다:
 *   Z0 → setRoleColor(roleId, ...)
 *   Z1 → setSlotStateColor(slotId, "default", ...)
 *   Z2 → setSlotStateColor(selectedSlot, state, ...)
 */
export function Inspector() {
  const layer = usePosaStore((s) => s.layer);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const selectedSlot = usePosaStore((s) => s.selectedSlot);
  const ir = usePosaStore((s) => s.ir);
  const setFocus = usePosaStore((s) => s.setFocus);
  const setRoleColor = usePosaStore((s) => s.setRoleColor);
  const setSlotStateColor = usePosaStore((s) => s.setSlotStateColor);
  const descendTo = usePosaStore((s) => s.descendTo);
  const universe = usePosaStore((s) => s.universe);

  const context = useMemo(() => {
    if (!focusedNode) return null;
    if (layer === 'z0') {
      return {
        label: 'role',
        nodeLabel: focusedNode,
        color: resolveRoleColor(ir, focusedNode),
        isDirect: Boolean(ir.roles[focusedNode]),
        onChange: (c: OKLCH) => setRoleColor(focusedNode, c),
        onClear: () => setRoleColor(focusedNode, null),
        canDescend: true,
      };
    }
    if (layer === 'z1') {
      const isDirect = Boolean(ir.slots[focusedNode]?.states['default']);
      const slotDef = universe?.slots.find((s) => s.id === focusedNode);
      const hasMultipleStates = (slotDef?.states.length ?? 1) > 1;
      return {
        label: 'slot · default',
        nodeLabel: focusedNode,
        color: resolveSlotColor(ir, focusedNode, 'default'),
        isDirect,
        onChange: (c: OKLCH) => setSlotStateColor(focusedNode, 'default', c),
        onClear: () => setSlotStateColor(focusedNode, 'default', null),
        canDescend: hasMultipleStates,
      };
    }
    // z2
    if (!selectedSlot) return null;
    const state = focusedNode;
    const isDirect = Boolean(ir.slots[selectedSlot]?.states[state]);
    return {
      label: `state · ${state}`,
      nodeLabel: `${selectedSlot} / ${state}`,
      color: resolveSlotColor(ir, selectedSlot, state),
      isDirect,
      onChange: (c: OKLCH) => setSlotStateColor(selectedSlot, state, c),
      onClear: () => setSlotStateColor(selectedSlot, state, null),
      canDescend: false,
    };
  }, [
    focusedNode,
    layer,
    selectedSlot,
    ir,
    universe,
    setRoleColor,
    setSlotStateColor,
  ]);

  if (!focusedNode || !context) return null;

  const glow =
    context.color != null
      ? `${oklchToHex(context.color.L, context.color.C, context.color.H)}55`
      : undefined;

  return (
    <aside
      aria-label="Inspector"
      className="fixed top-20 right-6 w-80 max-h-[calc(100vh-6rem)] flex flex-col bg-white/95 backdrop-blur border border-stone-200 rounded-lg shadow-sm inspector-enter"
      style={glow ? { boxShadow: `0 0 0 4px ${glow}` } : undefined}
    >
      <header className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-stone-100">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            {layer} · {context.label}
          </div>
          <div className="font-mono text-sm text-stone-900 mt-0.5 break-all">
            {context.nodeLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFocus(null)}
          aria-label="close inspector"
          className="flex-none text-stone-400 hover:text-stone-800 w-6 h-6 inline-flex items-center justify-center rounded hover:bg-stone-100"
        >
          <svg
            viewBox="0 0 12 12"
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M3 3 L9 9 M9 3 L3 9" />
          </svg>
        </button>
      </header>

      <div className="p-4 overflow-y-auto">
        <ColorPicker
          value={context.color}
          onChange={context.onChange}
          onClear={context.isDirect ? context.onClear : undefined}
        />
      </div>

      {context.canDescend && (
        <footer className="px-4 py-3 border-t border-stone-100">
          <button
            type="button"
            onClick={() => descendTo(focusedNode)}
            className="w-full inline-flex items-center justify-center gap-2 text-xs font-mono text-stone-700 px-3 py-2 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
          >
            <span>내려가기 ({layer === 'z0' ? 'slots' : 'states'})</span>
            <svg
              viewBox="0 0 12 12"
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="4,2 8,6 4,10" />
            </svg>
          </button>
        </footer>
      )}
    </aside>
  );
}
