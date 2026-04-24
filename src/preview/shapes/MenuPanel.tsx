import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = {
  /** 'dropdown-menu' | 'context-menu' | 'command' 등 slot prefix. */
  componentId: string;
  state?: StateId;
  /** Command 계열은 상단에 검색 input을 추가한다. placeholder attribute 사용. */
  withSearchInput?: boolean;
};

/**
 * 수직 메뉴 패널 공용 뷰.
 *   - 아이템 1은 현재 state 색으로 하이라이트된다 (default state일 땐 일반 모습).
 *   - 아이템 2는 기본 + shortcut(`muted`).
 *   - separator는 `muted`, 아이콘은 `icon`.
 * 각 컴포넌트 shape은 이 뷰를 componentId만 다르게 감싸서 호출한다.
 */
export function MenuPanel({
  componentId,
  state = 'default',
  withSearchInput = false,
}: Props) {
  const { t } = useTranslation('shapes');
  const sv = (attr: string, s: StateId = 'default') =>
    `var(--${slotVarName(`${componentId}.${attr}`, s)})`;

  const panelStyle: CSSProperties = {
    backgroundColor: sv('background'),
    color: sv('text'),
    border: `1px solid ${sv('border')}`,
  };
  const highlightedStyle: CSSProperties = {
    backgroundColor: sv('background', state),
    color: sv('text', state),
  };
  const iconColor = sv('icon');
  const mutedColor = sv('muted');

  return (
    <div
      className="w-full max-w-[220px] rounded-md p-1 shadow-md"
      style={panelStyle}
      data-posa-slot={`${componentId}.background`}
      data-posa-state={state}
    >
      {withSearchInput && (
        <div
          className="mb-1 flex items-center gap-2 border-b px-2 py-1.5 text-xs"
          style={{
            borderColor: sv('border'),
            color: sv('placeholder'),
          }}
        >
          <span style={{ color: iconColor }}>⌕</span>
          {t('menuPanel.searchPlaceholder')}
        </div>
      )}
      <div
        className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"
        style={highlightedStyle}
      >
        <span style={{ color: iconColor }}>◈</span>
        <span>{t('menuPanel.selected')}</span>
        <span className="ml-auto" style={{ color: mutedColor }}>
          ⌘K
        </span>
      </div>
      <div className="flex items-center gap-2 rounded px-2 py-1.5 text-xs">
        <span style={{ color: iconColor }}>◇</span>
        <span>{t('menuPanel.another')}</span>
      </div>
      <div className="my-1 h-px" style={{ backgroundColor: mutedColor }} />
      <div className="flex items-center gap-2 rounded px-2 py-1.5 text-xs">
        <span style={{ color: iconColor }}>◎</span>
        <span>{t('menuPanel.more')}</span>
        <span className="ml-auto" style={{ color: mutedColor }}>
          ⌘M
        </span>
      </div>
    </div>
  );
}
