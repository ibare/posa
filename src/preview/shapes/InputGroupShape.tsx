import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = {
  state?: StateId;
  placeholder?: string;
  value?: string;
};

/** shadcn Input Group — 앞쪽에 icon addon이 붙은 Input. */
export function InputGroupShape({ state = 'default', placeholder, value }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedPlaceholder = placeholder ?? t('inputGroup.placeholder');
  const showValue = value !== undefined && value !== '';
  const bg = `var(--${slotVarName('input-group.background', state)})`;
  const textVar = `var(--${slotVarName('input-group.text', state)})`;
  const placeholderVar = `var(--${slotVarName('input-group.placeholder', state)})`;
  const borderVar = `var(--${slotVarName('input-group.border', state)})`;
  const outlineVar = `var(--${slotVarName('input-group.outline', state)})`;
  const iconVar = `var(--${slotVarName('input-group.icon', state)})`;

  const style: CSSProperties = {
    backgroundColor: bg,
    color: showValue ? textVar : placeholderVar,
    border: `1px solid ${borderVar}`,
    boxShadow: state === 'focus' ? `0 0 0 2px ${outlineVar}` : undefined,
  };

  return (
    <div
      className="inline-flex h-9 min-w-[200px] items-center gap-2 rounded-md px-3 text-sm"
      style={style}
      data-posa-slot="input-group.background"
      data-posa-state={state}
    >
      <span style={{ color: iconVar }}>⌕</span>
      <span>{showValue ? value : resolvedPlaceholder}</span>
    </div>
  );
}
