import { useTranslation } from 'react-i18next';
import { slotVarName } from '../slotVarName';

/**
 * shadcn Separator — 가로 구분선. border 색상 하나만 살핀다.
 */
export function SeparatorShape() {
  const { t } = useTranslation('shapes');
  const borderColor = `var(--${slotVarName('separator.border', 'default')})`;
  return (
    <div
      className="inline-flex w-48 flex-col gap-2 text-xs"
      data-posa-slot="separator.border"
      data-posa-state="default"
    >
      <span>{t('separator.above')}</span>
      <div style={{ borderTop: `1px solid ${borderColor}` }} />
      <span>{t('separator.below')}</span>
    </div>
  );
}
