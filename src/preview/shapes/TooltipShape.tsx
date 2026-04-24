import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { slotVarName } from '../slotVarName';

type Props = {
  label?: string;
};

export function TooltipShape({ label }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedLabel = label ?? t('tooltip.label');
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('tooltip.background', 'default')})`,
    color: `var(--${slotVarName('tooltip.text', 'default')})`,
    border: `1px solid var(--${slotVarName('tooltip.border', 'default')})`,
  };

  return (
    <div
      className="inline-flex items-center rounded-md px-2.5 py-1 text-xs shadow-sm"
      style={style}
      data-posa-slot="tooltip.background"
      data-posa-state="default"
    >
      {resolvedLabel}
    </div>
  );
}
