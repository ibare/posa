import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

export type ButtonVariant = 'primary' | 'secondary' | 'error';

type Props = {
  /** 미지정 시 기본형 slot(`button.{attr}`)을 사용한다. */
  variant?: ButtonVariant;
  state?: StateId;
  label?: string;
};

/**
 * ButtonShape — 치수/레이아웃은 단일 외형 하나. 색은 IR slot 할당으로 결정된다.
 */
export function ButtonShape({ variant, state = 'default', label }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedLabel = label ?? t('button.label');
  const slotBase = variant ? `button.${variant}` : 'button';
  const bgVar = `var(--${slotVarName(`${slotBase}.background`, state)})`;
  const textVar = `var(--${slotVarName(`${slotBase}.text`, state)})`;
  const borderVar = `var(--${slotVarName(`${slotBase}.border`, state)})`;

  const style: CSSProperties = {
    backgroundColor: bgVar,
    color: textVar,
    border: `1px solid ${borderVar}`,
  };

  return (
    <div
      className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
      style={style}
      data-posa-slot={`${slotBase}.background`}
      data-posa-state={state}
    >
      {resolvedLabel}
    </div>
  );
}
