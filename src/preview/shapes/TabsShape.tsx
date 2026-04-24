import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Tabs — 수평 탭 리스트. 첫 탭이 현재 state로 강조 (active = 선택된 탭).
 */
export function TabsShape({ state = 'default' }: Props) {
  const { t } = useTranslation('shapes');
  const listStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('tabs.background', 'default')})`,
    border: `1px solid var(--${slotVarName('tabs.border', 'default')})`,
  };
  const activeTabStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('tabs.background', state)})`,
    color: `var(--${slotVarName('tabs.text', state)})`,
  };
  const mutedColor = `var(--${slotVarName('tabs.muted', 'default')})`;

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-md p-0.5 text-xs"
      style={listStyle}
      data-posa-slot="tabs.background"
      data-posa-state={state}
    >
      <span className="rounded px-3 py-1" style={activeTabStyle}>
        {t('tabs.overview')}
      </span>
      <span className="rounded px-3 py-1" style={{ color: mutedColor }}>
        {t('tabs.analytics')}
      </span>
      <span className="rounded px-3 py-1" style={{ color: mutedColor }}>
        {t('tabs.reports')}
      </span>
    </div>
  );
}
