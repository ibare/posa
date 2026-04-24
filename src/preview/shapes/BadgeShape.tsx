import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { slotVarName } from '../slotVarName';

export type BadgeVariant = 'secondary' | 'error';

type Props = {
  /** 미지정 시 기본형 slot(`badge.{attr}`)을 사용한다. */
  variant?: BadgeVariant;
  label?: string;
};

export function BadgeShape({ variant, label }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedLabel = label ?? t('badge.label');
  const slotBase = variant ? `badge.${variant}` : 'badge';
  const bgVar = `var(--${slotVarName(`${slotBase}.background`, 'default')})`;
  const textVar = `var(--${slotVarName(`${slotBase}.text`, 'default')})`;
  const borderVar = `var(--${slotVarName(`${slotBase}.border`, 'default')})`;

  const style: CSSProperties = {
    backgroundColor: bgVar,
    color: textVar,
    border: `1px solid ${borderVar}`,
  };

  return (
    <div
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={style}
      data-posa-slot={`${slotBase}.background`}
      data-posa-state="default"
    >
      {resolvedLabel}
    </div>
  );
}
