import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = {
  state?: StateId;
  placeholder?: string;
  value?: string;
};

/**
 * InputShape — interactive 요소가 아닌 div. value가 있으면 text 색, 없으면 placeholder 색.
 * focus 상태는 CSS 변수로만 표현 (ring 색 포함).
 */
export function InputShape({ state = 'default', placeholder = 'Enter text…', value }: Props) {
  const bg = `var(--${slotVarName('input.background', state)})`;
  const textVar = `var(--${slotVarName('input.text', state)})`;
  const placeholderVar = `var(--${slotVarName('input.placeholder', state)})`;
  const borderVar = `var(--${slotVarName('input.border', state)})`;
  const outlineVar = `var(--${slotVarName('input.outline', state)})`;

  const showValue = value !== undefined && value !== '';
  const style: CSSProperties = {
    backgroundColor: bg,
    color: showValue ? textVar : placeholderVar,
    border: `1px solid ${borderVar}`,
    boxShadow: state === 'focus' ? `0 0 0 2px ${outlineVar}` : undefined,
  };

  return (
    <div
      className="inline-flex h-9 min-w-[200px] items-center rounded-md px-3 text-sm"
      style={style}
      data-posa-slot="input.background"
      data-posa-state={state}
    >
      {showValue ? value : placeholder}
    </div>
  );
}
