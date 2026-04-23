import { slotVarName } from '../slotVarName';

/**
 * shadcn Separator — 가로 구분선. border 색상 하나만 살핀다.
 */
export function SeparatorShape() {
  const borderColor = `var(--${slotVarName('separator.border', 'default')})`;
  return (
    <div
      className="inline-flex w-48 flex-col gap-2 text-xs"
      data-posa-slot="separator.border"
      data-posa-state="default"
    >
      <span>Above</span>
      <div style={{ borderTop: `1px solid ${borderColor}` }} />
      <span>Below</span>
    </div>
  );
}
