import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Accordion — 여러 collapsible 섹션. 첫 항목이 현재 state로 강조(펼쳐짐 + 본문 표시),
 * 나머지는 default 상태로 닫혀 있음.
 */
export function AccordionShape({ state = 'default' }: Props) {
  const panelStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('accordion.background', 'default')})`,
    border: `1px solid var(--${slotVarName('accordion.border', 'default')})`,
    color: `var(--${slotVarName('accordion.text', 'default')})`,
  };
  const activeHeaderStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('accordion.background', state)})`,
    color: `var(--${slotVarName('accordion.text', state)})`,
    borderBottom: `1px solid var(--${slotVarName('accordion.border', 'default')})`,
  };
  const headerStyle: CSSProperties = {
    borderTop: `1px solid var(--${slotVarName('accordion.border', 'default')})`,
  };

  return (
    <div
      className="inline-flex w-56 flex-col overflow-hidden rounded-md text-xs"
      style={panelStyle}
      data-posa-slot="accordion.background"
      data-posa-state={state}
    >
      <div className="flex items-center justify-between px-3 py-2" style={activeHeaderStyle}>
        <span>Section 1</span>
        <span>▾</span>
      </div>
      <div className="px-3 py-2 text-[11px] opacity-80">
        Content panel body.
      </div>
      <div className="flex items-center justify-between px-3 py-2" style={headerStyle}>
        <span>Section 2</span>
        <span>▸</span>
      </div>
      <div className="flex items-center justify-between px-3 py-2" style={headerStyle}>
        <span>Section 3</span>
        <span>▸</span>
      </div>
    </div>
  );
}
