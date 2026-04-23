import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId; label?: string };

/**
 * shadcn Toggle — 단일 pressable 버튼. `active`가 pressed(on) 상태.
 */
export function ToggleShape({ state = 'default', label = 'B' }: Props) {
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('toggle.background', state)})`,
    color: `var(--${slotVarName('toggle.text', state)})`,
    border: `1px solid var(--${slotVarName('toggle.border', state)})`,
  };

  return (
    <div
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold"
      style={style}
      data-posa-slot="toggle.background"
      data-posa-state={state}
    >
      {label}
    </div>
  );
}
