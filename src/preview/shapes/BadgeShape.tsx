import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

type Props = {
  variant: BadgeVariant;
  label?: string;
};

export function BadgeShape({ variant, label = 'Badge' }: Props) {
  const bgVar = `var(--${slotVarName(`badge.${variant}.background`, 'default')})`;
  const textVar = `var(--${slotVarName(`badge.${variant}.text`, 'default')})`;
  const borderVar = `var(--${slotVarName(`badge.${variant}.border`, 'default')})`;

  const style: CSSProperties = {
    backgroundColor: bgVar,
    color: textVar,
    border: `1px solid ${borderVar}`,
  };

  return (
    <div
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={style}
      data-posa-slot={`badge.${variant}.background`}
      data-posa-state="default"
    >
      {label}
    </div>
  );
}
