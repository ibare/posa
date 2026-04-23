import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  description?: string;
};

/**
 * shadcn Sheet — 화면 가장자리에 고정되는 슬라이드 패널. 정적 프리뷰이므로
 * 오른쪽 고정 스테이지 1컷으로 표현한다.
 */
export function SheetShape({
  title = 'Sheet title',
  description = 'Short description.',
}: Props) {
  const stageStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('sheet.overlay', 'default')})`,
  };
  const panelStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('sheet.background', 'default')})`,
    color: `var(--${slotVarName('sheet.text', 'default')})`,
    borderLeft: `1px solid var(--${slotVarName('sheet.border', 'default')})`,
  };

  return (
    <div
      className="relative w-[320px] h-[200px] rounded-md overflow-hidden"
      style={stageStyle}
      data-posa-slot="sheet.overlay"
      data-posa-state="default"
    >
      <div
        className="absolute right-0 top-0 bottom-0 w-[140px] p-4"
        style={panelStyle}
      >
        <div className="text-sm font-semibold mb-1">{title}</div>
        <div className="text-xs opacity-80">{description}</div>
      </div>
    </div>
  );
}
