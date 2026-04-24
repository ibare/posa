import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Label — form field 라벨. text 색상 하나만 살핀다.
 */
export function LabelShape({ state = 'default' }: Props) {
  const { t } = useTranslation('shapes');
  const color = `var(--${slotVarName('label.text', state)})`;
  return (
    <label
      className="inline-flex text-xs font-medium"
      style={{ color }}
      data-posa-slot="label.text"
      data-posa-state={state}
    >
      {t('label.email')}
    </label>
  );
}
