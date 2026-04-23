import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Checkbox — 체크 마크는 `checked` state일 때만 표시된다.
 * 다른 state(hover/focus/disabled)는 빈 네모의 색만 달라진다.
 */
export function CheckboxShape({ state = 'default' }: Props) {
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('checkbox.background', state)})`,
    borderColor: `var(--${slotVarName('checkbox.border', state)})`,
    color: `var(--${slotVarName('checkbox.mark', state)})`,
  };
  const showMark = state === 'checked';

  return (
    <div
      className="inline-flex h-4 w-4 items-center justify-center rounded-sm border"
      style={style}
      data-posa-slot="checkbox.background"
      data-posa-state={state}
    >
      {showMark && (
        <svg viewBox="0 0 16 16" className="h-3 w-3">
          <path
            d="M3 8.5l3 3 7-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
