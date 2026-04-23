import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Pagination — 이전/다음 + 번호 버튼. 현재 페이지가 state로 강조.
 */
export function PaginationShape({ state = 'default' }: Props) {
  const borderColor = `var(--${slotVarName('pagination.border', 'default')})`;
  const textColor = `var(--${slotVarName('pagination.text', 'default')})`;
  const mutedColor = `var(--${slotVarName('pagination.muted', 'default')})`;

  const itemStyle: CSSProperties = {
    border: `1px solid ${borderColor}`,
    color: textColor,
  };
  const currentStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('pagination.background', state)})`,
    color: `var(--${slotVarName('pagination.text', state)})`,
    border: `1px solid var(--${slotVarName('pagination.border', state)})`,
  };

  return (
    <nav
      className="inline-flex items-center gap-1 text-xs"
      data-posa-slot="pagination.background"
      data-posa-state={state}
    >
      <span className="rounded px-2 py-1" style={itemStyle}>
        ‹
      </span>
      <span className="rounded px-2 py-1" style={itemStyle}>
        1
      </span>
      <span className="rounded px-2 py-1" style={currentStyle}>
        2
      </span>
      <span className="rounded px-2 py-1" style={itemStyle}>
        3
      </span>
      <span className="px-1" style={{ color: mutedColor }}>
        …
      </span>
      <span className="rounded px-2 py-1" style={itemStyle}>
        ›
      </span>
    </nav>
  );
}
