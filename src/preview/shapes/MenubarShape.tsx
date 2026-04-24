import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Menubar — 상단 툴바 (File / Edit / View / …). 첫 항목이 현재 state로 강조.
 */
export function MenubarShape({ state = 'default' }: Props) {
  const { t } = useTranslation('shapes');
  const sv = (attr: string, s: StateId = 'default') =>
    `var(--${slotVarName(`menubar.${attr}`, s)})`;

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
    <div
      className="inline-flex items-center gap-0.5 rounded-md px-1 py-1 text-xs"
      style={barStyle}
      data-posa-slot="menubar.background"
      data-posa-state={state}
    >
      <span className="rounded px-2 py-1" style={highlightedStyle}>
        {t('menubar.file')}
      </span>
      <span className="rounded px-2 py-1">{t('menubar.edit')}</span>
      <span className="rounded px-2 py-1">{t('menubar.view')}</span>
      <span className="rounded px-2 py-1" style={{ color: sv('muted') }}>
        {t('menubar.help')}
      </span>
    </div>
  );
}
