import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';

type Props = {
  variant: ButtonVariant;
  state?: StateId;
  label?: string;
};

/**
 * ButtonShape — shadcn에서 차용한 것은 치수/레이아웃 외형뿐.
 * 어떤 색이 어디에 칠해지는지는 IR slot 할당에 따라 그대로 반영된다.
 */
export function ButtonShape({ variant, state = 'default', label = 'Button' }: Props) {
  const bgVar = `var(--${slotVarName(`button.${variant}.background`, state)})`;
  const textVar = `var(--${slotVarName(`button.${variant}.text`, state)})`;
  const borderVar = `var(--${slotVarName(`button.${variant}.border`, state)})`;

  const style: CSSProperties = {
    backgroundColor: bgVar,
    color: textVar,
    border: `1px solid ${borderVar}`,
  };

  return (
    <div
      className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
      style={style}
      data-posa-slot={`button.${variant}.background`}
      data-posa-state={state}
    >
      {label}
    </div>
  );
}
