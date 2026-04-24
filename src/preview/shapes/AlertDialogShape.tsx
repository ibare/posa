import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  description?: string;
  fill?: boolean;
};

/**
 * shadcn의 AlertDialog 외형 — Dialog와 동일 구조에 footer 액션 영역 추가.
 * 액션 버튼 자체는 Button 컴포넌트 재사용 맥락이지만, AlertDialog의 색 축엔
 * 버튼 slot이 없으므로 여기선 가벼운 outline 박스로만 시각화한다.
 */
export function AlertDialogShape({
  title = 'Are you absolutely sure?',
  description = 'This action cannot be undone.',
  fill = false,
}: Props) {
  const stageStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('alert-dialog.overlay', 'default')})`,
  };
  const cardStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('alert-dialog.background', 'default')})`,
    color: `var(--${slotVarName('alert-dialog.text', 'default')})`,
    border: `1px solid var(--${slotVarName('alert-dialog.border', 'default')})`,
  };
  const buttonBorder = `1px solid var(--${slotVarName('alert-dialog.border', 'default')})`;
  const stageClass = fill
    ? 'relative w-full h-full overflow-hidden'
    : 'relative w-full max-w-[300px] h-[200px] rounded-md overflow-hidden';

  return (
    <div
      className={stageClass}
      style={stageStyle}
      data-posa-slot="alert-dialog.overlay"
      data-posa-state="default"
    >
      <div
        className="absolute left-1/2 top-1/2 w-[80%] max-w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-lg p-4 shadow-lg"
        style={cardStyle}
      >
        <div className="text-sm font-semibold mb-1">{title}</div>
        <div className="text-xs opacity-80 mb-3">{description}</div>
        <div className="flex justify-end gap-2">
          <div
            className="text-[10px] px-2.5 py-1 rounded opacity-70"
            style={{ border: buttonBorder }}
          >
            Cancel
          </div>
          <div
            className="text-[10px] px-2.5 py-1 rounded"
            style={{ border: buttonBorder }}
          >
            Continue
          </div>
        </div>
      </div>
    </div>
  );
}
