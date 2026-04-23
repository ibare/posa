import { useMemo } from 'react';
import { ATTRIBUTE_DEFINITIONS } from '../../catalog/attributes';
import { findComponentBySlotId } from '../../catalog/components';
import {
  getSlotDisplayName,
  getSlotsByAttribute,
  resolveAttributeColor,
  resolveSlotStateColor,
} from '../../ir/selectors';
import type { OKLCH, SlotId } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { InspectorBody } from '../shared/InspectorBody';
import { Swatch } from '../shared/Swatch';

export function Z1Plane() {
  const ir = usePosaStore((s) => s.ir);
  const selectedAttributeId = usePosaStore((s) => s.selectedAttributeId);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const setFocus = usePosaStore((s) => s.setFocus);
  const descendToSlot = usePosaStore((s) => s.descendToSlot);

  const slotIds = useMemo(() => {
    if (!selectedAttributeId) return [];
    return getSlotsByAttribute(selectedAttributeId);
  }, [selectedAttributeId]);

  if (!selectedAttributeId) return null;

  const attrDef = ATTRIBUTE_DEFINITIONS.find(
    (a) => a.id === selectedAttributeId,
  );
  const attrColor = resolveAttributeColor(ir, selectedAttributeId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center gap-4 px-1">
        <Swatch color={attrColor} size="lg" />
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            Z1 · attribute
          </div>
          <div className="font-mono text-lg text-stone-900">
            {attrDef?.label ?? selectedAttributeId}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            {slotIds.length} slot{slotIds.length === 1 ? '' : 's'} across all components
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {slotIds.map((slotId) => (
          <SlotCard
            key={slotId}
            slotId={slotId}
            focused={focusedNode === `slot:${slotId}`}
            color={resolveSlotStateColor(ir, slotId, 'default')}
            onFocusToggle={() =>
              setFocus(
                focusedNode === `slot:${slotId}` ? null : `slot:${slotId}`,
              )
            }
            onDescend={() => descendToSlot(slotId)}
          />
        ))}
        {slotIds.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-stone-500 border border-dashed border-stone-300 rounded-lg">
            No component declares this attribute yet.
          </div>
        )}
      </div>
    </div>
  );
}

type SlotCardProps = {
  slotId: SlotId;
  focused: boolean;
  color: OKLCH | null;
  onFocusToggle: () => void;
  onDescend: () => void;
};

function SlotCard({
  slotId,
  focused,
  color,
  onFocusToggle,
  onDescend,
}: SlotCardProps) {
  const ir = usePosaStore((s) => s.ir);
  const component = findComponentBySlotId(slotId);
  const multiState = (component?.states.length ?? 0) > 1;
  const slot = ir.slots[slotId];
  const isDirect = Boolean(slot?.ref);
  const displayName = getSlotDisplayName(slotId, ir);

  return (
    <div className="relative">
      <div
        className={[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/80 border transition-all duration-150 cursor-pointer',
          focused
            ? 'border-stone-900 -translate-y-px'
            : 'border-stone-200 hover:border-stone-400 hover:-translate-y-px',
        ].join(' ')}
        onClick={onFocusToggle}
      >
        <Swatch color={color} size="md" />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm text-stone-900 break-all">
            {displayName}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
            {isDirect ? 'set directly' : 'inherits attribute'}
          </div>
        </div>
        {multiState && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDescend();
            }}
            className="flex-none inline-flex items-center gap-2 text-xs font-mono text-stone-600 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
            title="Descend to state layer"
          >
            <span>states</span>
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
      {focused && (
        <div className="absolute left-0 right-0 top-full mt-2 z-20 max-w-[26rem] max-h-[calc(100vh-10rem)] overflow-y-auto bg-white border border-stone-200 shadow-lg rounded-lg p-4">
          <InspectorBody />
        </div>
      )}
    </div>
  );
}
