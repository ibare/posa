import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Collapsible — 단일 trigger + 펼쳐지는 본문. trigger가 현재 state로 강조.
 */
export function CollapsibleShape({ state = 'default' }: Props) {
  const { t } = useTranslation('shapes');
  const triggerStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('collapsible.background', state)})`,
    color: `var(--${slotVarName('collapsible.text', state)})`,
    border: `1px solid var(--${slotVarName('collapsible.border', state)})`,
  };
  const bodyStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('collapsible.background', 'default')})`,
    color: `var(--${slotVarName('collapsible.text', 'default')})`,
    border: `1px solid var(--${slotVarName('collapsible.border', 'default')})`,
  };

  return (
    <div
      className="inline-flex w-56 flex-col gap-1.5 text-xs"
      data-posa-slot="collapsible.background"
      data-posa-state={state}
    >
      <div
        className="flex items-center justify-between rounded px-3 py-1.5"
        style={triggerStyle}
      >
        <span>{t('collapsible.trigger')}</span>
        <span>▾</span>
      </div>
      <div className="rounded px-3 py-2 text-[11px]" style={bodyStyle}>
        {t('collapsible.body')}
      </div>
    </div>
  );
}
