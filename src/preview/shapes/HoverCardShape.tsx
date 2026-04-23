import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  description?: string;
};

export function HoverCardShape({
  title = '@shadcn',
  description = 'The creator of shadcn/ui. Joined December 2021.',
}: Props) {
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('hover-card.background', 'default')})`,
    color: `var(--${slotVarName('hover-card.text', 'default')})`,
    border: `1px solid var(--${slotVarName('hover-card.border', 'default')})`,
  };

  return (
    <div
      className="w-[240px] rounded-md p-4 shadow-md"
      style={style}
      data-posa-slot="hover-card.background"
      data-posa-state="default"
    >
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs opacity-80">{description}</div>
    </div>
  );
}
