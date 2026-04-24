import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  description?: string;
};

export function HoverCardShape({ title, description }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedTitle = title ?? t('hoverCard.title');
  const resolvedDescription = description ?? t('hoverCard.description');
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('hover-card.background', 'default')})`,
    color: `var(--${slotVarName('hover-card.text', 'default')})`,
    border: `1px solid var(--${slotVarName('hover-card.border', 'default')})`,
  };

  return (
    <div
      className="w-full max-w-[240px] rounded-md p-4 shadow-md"
      style={style}
      data-posa-slot="hover-card.background"
      data-posa-state="default"
    >
      <div className="text-sm font-semibold mb-1">{resolvedTitle}</div>
      <div className="text-xs opacity-80">{resolvedDescription}</div>
    </div>
  );
}
