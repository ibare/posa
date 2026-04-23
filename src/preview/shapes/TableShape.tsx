import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Table — 헤더 + 여러 row. 첫 data row가 현재 state로 강조.
 * muted는 header row / caption 배경에 사용.
 */
export function TableShape({ state = 'default' }: Props) {
  const containerStyle: CSSProperties = {
    border: `1px solid var(--${slotVarName('table.border', 'default')})`,
    color: `var(--${slotVarName('table.text', 'default')})`,
    backgroundColor: `var(--${slotVarName('table.background', 'default')})`,
  };
  const headerRowStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('table.muted', 'default')})`,
    borderBottom: `1px solid var(--${slotVarName('table.border', 'default')})`,
  };
  const activeRowStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('table.background', state)})`,
    color: `var(--${slotVarName('table.text', state)})`,
  };
  const rowBorder = `1px solid var(--${slotVarName('table.border', 'default')})`;

  return (
    <div
      className="inline-flex w-64 flex-col overflow-hidden rounded-md text-xs"
      style={containerStyle}
      data-posa-slot="table.background"
      data-posa-state={state}
    >
      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={headerRowStyle}>
        <span>Name</span>
        <span>Role</span>
        <span className="text-right">Status</span>
      </div>
      <div className="grid grid-cols-3 px-3 py-1.5" style={activeRowStyle}>
        <span>Alice</span>
        <span>Admin</span>
        <span className="text-right">Active</span>
      </div>
      <div className="grid grid-cols-3 px-3 py-1.5" style={{ borderTop: rowBorder }}>
        <span>Bob</span>
        <span>Editor</span>
        <span className="text-right">Active</span>
      </div>
      <div className="grid grid-cols-3 px-3 py-1.5" style={{ borderTop: rowBorder }}>
        <span>Carol</span>
        <span>Viewer</span>
        <span className="text-right">Idle</span>
      </div>
    </div>
  );
}
