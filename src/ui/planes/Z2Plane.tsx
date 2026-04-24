import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { findComponentBySlotId } from '../../catalog/components';
import {
  getSlotDisplayName,
  isSlotStateDirectlyAssigned,
  resolveSlotStateColor,
} from '../../ir/selectors';
import type { OKLCH, StateId } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { InspectorBody } from '../shared/InspectorBody';
import { InspectorPopover } from '../shared/InspectorPopover';
import { Swatch } from '../shared/Swatch';

export function Z2Plane() {
  const ir = usePosaStore((s) => s.ir);
  const selectedSlotId = usePosaStore((s) => s.selectedSlotId);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const setFocus = usePosaStore((s) => s.setFocus);
  const { t } = useTranslation('planes');

  if (!selectedSlotId) return null;

  const component = findComponentBySlotId(selectedSlotId);
  if (!component) return null;

  const displayName = getSlotDisplayName(selectedSlotId, ir);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="px-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
          {t('z2.label')}
        </div>
        <div className="font-mono text-lg text-stone-900 break-all">
          {displayName}
        </div>
        <div className="text-xs text-stone-500 mt-0.5">
          {t('z2.stateCount', { count: component.states.length })}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {component.states.map((state) => {
          const color = resolveSlotStateColor(ir, selectedSlotId, state);
          const isDirect = isSlotStateDirectlyAssigned(
            ir,
            selectedSlotId,
            state,
          );
          return (
            <StateCard
              key={state}
              state={state}
              color={color}
              isDirect={isDirect}
              focused={focusedNode === `state:${state}`}
              onFocusToggle={() =>
                setFocus(
                  focusedNode === `state:${state}` ? null : `state:${state}`,
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
}

type StateCardProps = {
  state: StateId;
  color: OKLCH | null;
  isDirect: boolean;
  focused: boolean;
  onFocusToggle: () => void;
};

function StateCard({
  state,
  color,
  isDirect,
  focused,
  onFocusToggle,
}: StateCardProps) {
  const { t } = useTranslation('planes');
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  return (
    <div>
      <div
        ref={setAnchorEl}
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
          <div className="font-mono text-sm text-stone-900">{state}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
            {isDirect ? t('z2.assigned') : t('z2.inheritsDefault')}
          </div>
        </div>
        <span
          className={[
            'flex-none text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full',
            isDirect ? 'bg-stone-900 text-cream' : 'bg-stone-100 text-stone-500',
          ].join(' ')}
        >
          {isDirect ? t('z2.set') : t('z2.inherit')}
        </span>
      </div>
      <InspectorPopover
        anchor={anchorEl}
        open={focused}
        onDismiss={onFocusToggle}
      >
        <InspectorBody />
      </InspectorPopover>
    </div>
  );
}
