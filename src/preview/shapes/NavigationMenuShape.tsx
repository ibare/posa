import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn NavigationMenu — 상단 사이트 네비. 링크 나열 + 현재 항목 하이라이트.
 */
export function NavigationMenuShape({ state = 'default' }: Props) {
  const { t } = useTranslation('shapes');
  const sv = (attr: string, s: StateId = 'default') =>
    `var(--${slotVarName(`navigation-menu.${attr}`, s)})`;

  const barStyle: CSSProperties = {
    backgroundColor: sv('background'),
    color: sv('text'),
    border: `1px solid ${sv('border')}`,
  };
  const highlightedStyle: CSSProperties = {
    backgroundColor: sv('background', state),
    color: sv('text', state),
  };

  return (
    <nav
      className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs"
      style={barStyle}
      data-posa-slot="navigation-menu.background"
      data-posa-state={state}
    >
      <span className="rounded px-2.5 py-1" style={highlightedStyle}>
        {t('navigationMenu.gettingStarted')}
      </span>
      <span className="rounded px-2.5 py-1">{t('navigationMenu.components')}</span>
      <span className="rounded px-2.5 py-1" style={{ color: sv('muted') }}>
        {t('navigationMenu.blog')}
      </span>
    </nav>
  );
}
