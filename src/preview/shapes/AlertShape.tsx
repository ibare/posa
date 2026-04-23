import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

export type AlertVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'info'
  | 'warning'
  | 'error';

type Props = {
  variant?: AlertVariant;
  title?: string;
  description?: string;
};

/**
 * shadcn Alert — 배너 형태. icon + title + description 블록.
 * variant가 symbol 축과 결합해 색상을 결정. state는 default 하나.
 */
export function AlertShape({
  variant,
  title = 'Notice',
  description = 'Something to keep an eye on.',
}: Props) {
  const slotFor = (attr: string) =>
    variant ? `alert.${variant}.${attr}` : `alert.${attr}`;
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName(slotFor('background'), 'default')})`,
    color: `var(--${slotVarName(slotFor('text'), 'default')})`,
    border: `1px solid var(--${slotVarName(slotFor('border'), 'default')})`,
  };
  const iconColor = `var(--${slotVarName(slotFor('icon'), 'default')})`;

  return (
    <div
      className="inline-flex w-64 items-start gap-2 rounded-md px-3 py-2 text-xs"
      style={style}
      data-posa-slot={slotFor('background')}
      data-posa-state="default"
    >
      <span className="mt-0.5 text-sm leading-none" style={{ color: iconColor }}>
        ⓘ
      </span>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-[11px] opacity-80">{description}</div>
      </div>
    </div>
  );
}
