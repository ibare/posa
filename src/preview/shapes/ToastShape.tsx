import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

export type ToastVariant = 'default' | 'destructive' | 'warning' | 'success';

type Props = {
  variant: ToastVariant;
  title?: string;
  description?: string;
};

export function ToastShape({
  variant,
  title = 'Toast title',
  description = 'Short description of the event.',
}: Props) {
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName(`toast.${variant}.background`, 'default')})`,
    color: `var(--${slotVarName(`toast.${variant}.text`, 'default')})`,
    border: `1px solid var(--${slotVarName(`toast.${variant}.border`, 'default')})`,
  };

  return (
    <div
      className="w-[320px] rounded-md p-4"
      style={style}
      data-posa-slot={`toast.${variant}.background`}
      data-posa-state="default"
    >
      <div className="text-sm font-semibold mb-0.5">{title}</div>
      <div className="text-xs opacity-80">{description}</div>
    </div>
  );
}
