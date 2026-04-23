import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  description?: string;
};

/**
 * shadcn Drawer(vaul) — 아래쪽에서 올라오는 패널. 상단에 grab handle.
 */
export function DrawerShape({
  title = 'Drawer title',
  description = 'Short description.',
}: Props) {
  const stageStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('drawer.overlay', 'default')})`,
  };
  const panelStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('drawer.background', 'default')})`,
    color: `var(--${slotVarName('drawer.text', 'default')})`,
    borderTop: `1px solid var(--${slotVarName('drawer.border', 'default')})`,
  };
  const handleColor = `var(--${slotVarName('drawer.border', 'default')})`;

  return (
    <div
      className="relative w-[320px] h-[200px] rounded-md overflow-hidden"
      style={stageStyle}
      data-posa-slot="drawer.overlay"
      data-posa-state="default"
    >
      <div
        className="absolute left-0 right-0 bottom-0 h-[120px] rounded-t-lg p-4"
        style={panelStyle}
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full"
          style={{ backgroundColor: handleColor }}
        />
        <div className="text-sm font-semibold mb-1">{title}</div>
        <div className="text-xs opacity-80">{description}</div>
      </div>
    </div>
  );
}
