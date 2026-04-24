import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Sidebar — 수직 네비게이션 패널. 첫 항목이 현재 state로 강조.
 * muted: 섹션 헤더, icon: 항목 앞 아이콘.
 */
export function SidebarShape({ state = 'default' }: Props) {
  const { t } = useTranslation('shapes');
  const panelStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('sidebar.background', 'default')})`,
    border: `1px solid var(--${slotVarName('sidebar.border', 'default')})`,
    color: `var(--${slotVarName('sidebar.text', 'default')})`,
  };
  const mutedColor = `var(--${slotVarName('sidebar.muted', 'default')})`;
  const iconColor = `var(--${slotVarName('sidebar.icon', 'default')})`;
  const activeItemStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('sidebar.background', state)})`,
    color: `var(--${slotVarName('sidebar.text', state)})`,
  };
  const activeIconColor = `var(--${slotVarName('sidebar.icon', state)})`;

  return (
    <div
      className="inline-flex w-44 flex-col gap-1 rounded-md p-2 text-xs"
      style={panelStyle}
      data-posa-slot="sidebar.background"
      data-posa-state={state}
    >
      <span
        className="px-2 pb-0.5 pt-1 text-[10px] font-medium uppercase tracking-wider"
        style={{ color: mutedColor }}
      >
        {t('sidebar.workspace')}
      </span>
      <span className="flex items-center gap-2 rounded px-2 py-1.5" style={activeItemStyle}>
        <span style={{ color: activeIconColor }}>◆</span>
        <span>{t('sidebar.dashboard')}</span>
      </span>
      <span className="flex items-center gap-2 rounded px-2 py-1.5">
        <span style={{ color: iconColor }}>◇</span>
        <span>{t('sidebar.projects')}</span>
      </span>
      <span className="flex items-center gap-2 rounded px-2 py-1.5">
        <span style={{ color: iconColor }}>◇</span>
        <span>{t('sidebar.settings')}</span>
      </span>
    </div>
  );
}
