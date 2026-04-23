import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

/**
 * shadcn Skeleton — 로딩 중 자리표시자. muted 색상의 블록 여러 줄.
 */
export function SkeletonShape() {
  const mutedColor = `var(--${slotVarName('skeleton.muted', 'default')})`;
  const bar: CSSProperties = { backgroundColor: mutedColor };
  return (
    <div
      className="inline-flex w-48 flex-col gap-2"
      data-posa-slot="skeleton.muted"
      data-posa-state="default"
    >
      <div className="h-3 w-full rounded" style={bar} />
      <div className="h-3 w-5/6 rounded" style={bar} />
      <div className="h-3 w-2/3 rounded" style={bar} />
    </div>
  );
}
