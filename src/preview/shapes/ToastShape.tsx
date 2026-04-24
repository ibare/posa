import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { slotVarName } from '../slotVarName';

export type ToastVariant = 'error' | 'warning' | 'success';

type Props = {
  /** 미지정 시 기본형 slot(`toast.{attr}`)을 사용한다. */
  variant?: ToastVariant;
  title?: string;
  description?: string;
};

export function ToastShape({ variant, title, description }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedTitle = title ?? t('toast.title');
  const resolvedDescription = description ?? t('toast.description');
  const slotBase = variant ? `toast.${variant}` : 'toast';
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName(`${slotBase}.background`, 'default')})`,
    color: `var(--${slotVarName(`${slotBase}.text`, 'default')})`,
    border: `1px solid var(--${slotVarName(`${slotBase}.border`, 'default')})`,
  };

  return (
    <div
      className="w-full max-w-[320px] rounded-md p-4"
      style={style}
      data-posa-slot={`${slotBase}.background`}
      data-posa-state="default"
    >
      <div className="text-sm font-semibold mb-0.5">{resolvedTitle}</div>
      <div className="text-xs opacity-80">{resolvedDescription}</div>
    </div>
  );
}
