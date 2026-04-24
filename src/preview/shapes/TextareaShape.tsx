import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = {
  state?: StateId;
  placeholder?: string;
  value?: string;
};

export function TextareaShape({ state = 'default', placeholder, value }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedPlaceholder = placeholder ?? t('textarea.placeholder');
  const showValue = value !== undefined && value !== '';
  const bg = `var(--${slotVarName('textarea.background', state)})`;
  const textVar = `var(--${slotVarName('textarea.text', state)})`;
  const placeholderVar = `var(--${slotVarName('textarea.placeholder', state)})`;
  const borderVar = `var(--${slotVarName('textarea.border', state)})`;
  const outlineVar = `var(--${slotVarName('textarea.outline', state)})`;

  const style: CSSProperties = {
    backgroundColor: bg,
    color: showValue ? textVar : placeholderVar,
    border: `1px solid ${borderVar}`,
    boxShadow: state === 'focus' ? `0 0 0 2px ${outlineVar}` : undefined,
  };

  return (
    <div
      className="w-full max-w-[220px] h-[72px] rounded-md px-3 py-2 text-sm"
      style={style}
      data-posa-slot="textarea.background"
      data-posa-state={state}
    >
      {showValue ? value : resolvedPlaceholder}
    </div>
  );
}
