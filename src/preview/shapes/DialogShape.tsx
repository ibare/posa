import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { slotVarName } from '../slotVarName';

type Props = {
  title?: string;
  description?: string;
  /** true면 부모 박스를 꽉 채우는 stage. 온보딩 카드처럼 외곽 컨테이너가 크기를 정할 때 사용. */
  fill?: boolean;
};

export function DialogShape({ title, description, fill = false }: Props) {
  const { t } = useTranslation('shapes');
  const resolvedTitle = title ?? t('dialog.title');
  const resolvedDescription = description ?? t('dialog.description');
  const stageStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('dialog.overlay', 'default')})`,
  };
  const cardStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('dialog.background', 'default')})`,
    color: `var(--${slotVarName('dialog.text', 'default')})`,
    border: `1px solid var(--${slotVarName('dialog.border', 'default')})`,
  };
  const stageClass = fill
    ? 'relative w-full h-full overflow-hidden'
    : 'relative w-full max-w-[300px] h-[180px] rounded-md overflow-hidden';

  return (
    <div
      className={stageClass}
      style={stageStyle}
      data-posa-slot="dialog.overlay"
      data-posa-state="default"
    >
      <div
        className="absolute left-1/2 top-1/2 w-[80%] max-w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-lg p-4 shadow-lg"
        style={cardStyle}
      >
        <div className="text-sm font-semibold mb-1">{resolvedTitle}</div>
        <div className="text-xs opacity-80">{resolvedDescription}</div>
      </div>
    </div>
  );
}
