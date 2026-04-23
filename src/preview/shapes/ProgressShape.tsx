import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

type Props = { value?: number };

/** shadcn Progress — 트랙 위에 fill이 value(0~100)% 만큼 채워진다. */
export function ProgressShape({ value = 70 }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const trackStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('progress.track', 'default')})`,
  };
  const fillStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('progress.fill', 'default')})`,
    width: `${clamped}%`,
  };

  return (
    <div
      className="relative h-2 w-[200px] overflow-hidden rounded-full"
      style={trackStyle}
      data-posa-slot="progress.track"
      data-posa-state="default"
    >
      <div className="h-full" style={fillStyle} />
    </div>
  );
}
