import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  description?: string;
};

export function PopoverShape({ title, description }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedTitle = title ?? t('popover.title');
  const resolvedDescription = description ?? t('popover.description');
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('popover.background', 'default')})`,
    color: `var(--${slotVarName('popover.text', 'default')})`,
    border: `1px solid var(--${slotVarName('popover.border', 'default')})`,
  };

  return (
    <div
      className="w-full max-w-[240px] rounded-md p-4 shadow-md"
      style={style}
      data-posa-slot="popover.background"
      data-posa-state="default"
    >
      <div className="text-sm font-semibold mb-1">{resolvedTitle}</div>
      <div className="text-xs opacity-80">{resolvedDescription}</div>
    </div>
  );
}
