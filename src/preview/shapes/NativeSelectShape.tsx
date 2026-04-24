import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId; label?: string };

/** shadcn native select — Input과 거의 동일, 오른쪽에 chevron 아이콘. */
export function NativeSelectShape({ state = 'default', label }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedLabel = label ?? t('nativeSelect.label');
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('native-select.background', state)})`,
    color: `var(--${slotVarName('native-select.text', state)})`,
    border: `1px solid var(--${slotVarName('native-select.border', state)})`,
    boxShadow:
      state === 'focus'
        ? `0 0 0 2px var(--${slotVarName('native-select.outline', state)})`
        : undefined,
  };
  const iconColor = `var(--${slotVarName('native-select.icon', state)})`;

  return (
    <div
      className="inline-flex h-9 min-w-[200px] items-center justify-between gap-2 rounded-md px-3 text-sm"
      style={style}
      data-posa-slot="native-select.background"
      data-posa-state={state}
    >
      <span>{resolvedLabel}</span>
      <span style={{ color: iconColor }}>▾</span>
    </div>
  );
}
