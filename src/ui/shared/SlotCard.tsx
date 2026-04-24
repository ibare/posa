import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { findComponentBySlotId } from '../../catalog/components';
import {
  getDirectChildColorsForSlot,
  getSlotDisplayName,
  resolveSlotStateColor,
} from '../../ir/selectors';
import type { SlotId } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { InspectorBody } from './InspectorBody';
import { InspectorPopover } from './InspectorPopover';
import { Swatch } from './Swatch';

/**
 * Z1과 ZX에서 공통으로 쓰는 slot 카드.
 * 단일 모드(하위 state override 없음): 단색 + 클릭 시 인스펙터.
 * 다중 모드(multi-state slot이고 override 1개 이상): 분할 swatch + 클릭 시 즉시 Z2로 descend.
 */
export type SlotCardProps = {
  slotId: SlotId;
  focused: boolean;
  onFocusToggle: () => void;
};

export function SlotCard({ slotId, focused, onFocusToggle }: SlotCardProps) {
  const ir = usePosaStore((s) => s.ir);
  const descendToSlot = usePosaStore((s) => s.descendToSlot);
  const { t } = useTranslation('inspector');
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const color = resolveSlotStateColor(ir, slotId, 'default');
  const component = findComponentBySlotId(slotId);
  const multiState = (component?.states.length ?? 0) > 1;
  const slot = ir.slots[slotId];
  const isDirect = Boolean(slot?.ref);
  const displayName = getSlotDisplayName(slotId, ir);
  const directStateColors = useMemo(
    () => (multiState ? getDirectChildColorsForSlot(ir, slotId) : []),
    [ir, slotId, multiState],
  );
  const isMultiMode = multiState && directStateColors.length > 1;

  const onRowClick = isMultiMode ? () => descendToSlot(slotId) : onFocusToggle;
  const showInspector = focused && !isMultiMode;

  return (
    <div>
      <div
        ref={setAnchorEl}
        className={[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/80 border transition-all duration-150 cursor-pointer',
          focused && !isMultiMode
            ? 'border-stone-900 -translate-y-px'
            : 'border-stone-200 hover:border-stone-400 hover:-translate-y-px',
        ].join(' ')}
        onClick={onRowClick}
      >
        {isMultiMode ? (
          <Swatch colors={directStateColors} size="md" />
        ) : (
          <Swatch color={color} size="md" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm text-stone-900 break-all">
            {displayName}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
            {isMultiMode
              ? `${t('slotCard.directColors', { count: directStateColors.length })} — ${t('slotCard.clickToDescend')}`
              : isDirect
                ? t('slotCard.setDirectly')
                : t('slotCard.inheritsAttribute')}
          </div>
        </div>
        {multiState && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              descendToSlot(slotId);
            }}
            className="flex-none inline-flex items-center gap-2 text-xs font-mono text-stone-600 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
            title={t('slotCard.descendToState')}
          >
            <span>{t('slotCard.states')}</span>
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
      <InspectorPopover anchor={anchorEl} open={showInspector}>
        <InspectorBody />
      </InspectorPopover>
    </div>
  );
}
