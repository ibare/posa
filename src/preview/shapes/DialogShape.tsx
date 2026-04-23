import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  description?: string;
};

export function DialogShape({
  title = 'Dialog title',
  description = 'Short description of the dialog.',
}: Props) {
  const stageStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('dialog.overlay', 'default')})`,
  };
  const cardStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('dialog.background', 'default')})`,
    color: `var(--${slotVarName('dialog.text', 'default')})`,
    border: `1px solid var(--${slotVarName('dialog.border', 'default')})`,
  };

  return (
    <div
      className="relative w-[300px] h-[180px] rounded-md overflow-hidden"
      style={stageStyle}
      data-posa-slot="dialog.overlay"
      data-posa-state="default"
    >
      <div
        className="absolute left-1/2 top-1/2 w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-lg p-4 shadow-lg"
        style={cardStyle}
      >
        <div className="text-sm font-semibold mb-1">{title}</div>
        <div className="text-xs opacity-80">{description}</div>
      </div>
    </div>
  );
}
