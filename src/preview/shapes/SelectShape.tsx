import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId; label?: string };

/**
 * shadcn Select — 트리거 버튼 부분만 정적 프리뷰.
 * `active`는 드롭다운이 열린 상태(트리거 강조색).
 */
export function SelectShape({ state = 'default', label }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedLabel = label ?? t('select.label');
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('select.background', state)})`,
    color: `var(--${slotVarName('select.text', state)})`,
    border: `1px solid var(--${slotVarName('select.border', state)})`,
    boxShadow:
      state === 'focus'
        ? `0 0 0 2px var(--${slotVarName('select.outline', state)})`
        : undefined,
  };
  const iconColor = `var(--${slotVarName('select.icon', state)})`;

  return (
    <div
      className="inline-flex h-9 min-w-[200px] items-center justify-between gap-2 rounded-md px-3 text-sm"
      style={style}
      data-posa-slot="select.background"
      data-posa-state={state}
    >
      <span>{resolvedLabel}</span>
      <span style={{ color: iconColor }}>▾</span>
    </div>
  );
}
