import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  description?: string;
};

export function PopoverShape({
  title = 'Popover title',
  description = 'Short description of the content.',
}: Props) {
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('popover.background', 'default')})`,
    color: `var(--${slotVarName('popover.text', 'default')})`,
    border: `1px solid var(--${slotVarName('popover.border', 'default')})`,
  };

  return (
    <div
      className="w-full max-w-[240px] rounded-md p-4 shadow-md"
      style={style}
      data-posa-slot="popover.background"
      data-posa-state="default"
    >
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs opacity-80">{description}</div>
    </div>
  );
}
