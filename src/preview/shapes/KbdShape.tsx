import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

/**
 * shadcn Kbd — 인라인 키보드 키 힌트. 작은 네모.
 */
export function KbdShape() {
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('kbd.background', 'default')})`,
    color: `var(--${slotVarName('kbd.text', 'default')})`,
    border: `1px solid var(--${slotVarName('kbd.border', 'default')})`,
  };
  return (
    <span
      className="inline-flex items-center gap-1 text-xs"
      data-posa-slot="kbd.background"
      data-posa-state="default"
    >
      <kbd
        className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px]"
        style={style}
      >
        ⌘
      </kbd>
      <kbd
        className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px]"
        style={style}
      >
        K
      </kbd>
    </span>
  );
}
