import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  body?: string;
  children?: ReactNode;
};

export function CardShape({ title, body, children }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedTitle = title ?? t('card.title');
  const resolvedBody = body ?? t('card.body');
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('card.background', 'default')})`,
    color: `var(--${slotVarName('card.text', 'default')})`,
    border: `1px solid var(--${slotVarName('card.border', 'default')})`,
  };

  return (
    <div
      className="w-full max-w-[240px] rounded-lg p-6 shadow-sm"
      style={style}
      data-posa-slot="card.background"
      data-posa-state="default"
    >
      <div className="text-sm font-semibold mb-1">{resolvedTitle}</div>
      <div className="text-xs opacity-80">{resolvedBody}</div>
      {children}
    </div>
  );
}
