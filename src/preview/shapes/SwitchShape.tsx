import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Switch — 가로 레일(track) + 원형 손잡이(thumb).
 * `checked`면 thumb이 오른쪽 끝, 그 외엔 왼쪽 끝.
 */
export function SwitchShape({ state = 'default' }: Props) {
  const trackStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('switch.track', state)})`,
    borderColor: `var(--${slotVarName('switch.border', state)})`,
  };
  const thumbStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('switch.thumb', state)})`,
    left: state === 'checked' ? 'calc(100% - 18px)' : '2px',
  };

  return (
    <div
      className="relative inline-flex h-5 w-9 items-center rounded-full border"
      style={trackStyle}
      data-posa-slot="switch.track"
      data-posa-state={state}
    >
      <div
        className="absolute h-3.5 w-3.5 rounded-full shadow-sm transition-all"
        style={thumbStyle}
      />
    </div>
  );
}
