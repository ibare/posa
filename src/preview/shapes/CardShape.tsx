import type { CSSProperties, ReactNode } from 'react';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  body?: string;
  children?: ReactNode;
};

export function CardShape({ title = 'Card title', body = 'Card body copy goes here.', children }: Props) {
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('card.background', 'default')})`,
    color: `var(--${slotVarName('card.text', 'default')})`,
    border: `1px solid var(--${slotVarName('card.border', 'default')})`,
  };

  return (
    <div
      className="w-[240px] rounded-lg p-6 shadow-sm"
      style={style}
      data-posa-slot="card.background"
      data-posa-state="default"
    >
      <div className="text-sm font-semibold mb-1">{title}</div>
      <div className="text-xs opacity-80">{body}</div>
      {children}
    </div>
  );
}
