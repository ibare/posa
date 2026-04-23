import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Slider — 트랙 레일 + 진행 fill + 드래그 핸들 thumb.
 * focus 상태일 땐 thumb에 outline 링이 감싼다.
 */
export function SliderShape({ state = 'default' }: Props) {
  const trackStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('slider.track', state)})`,
  };
  const fillStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('slider.fill', state)})`,
  };
  const thumbStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('slider.thumb', state)})`,
    boxShadow:
      state === 'focus'
        ? `0 0 0 3px var(--${slotVarName('slider.outline', state)})`
        : undefined,
  };

  return (
    <div
      className="relative flex h-5 w-[160px] items-center"
      data-posa-slot="slider.track"
      data-posa-state={state}
    >
      <div className="h-1.5 w-full rounded-full" style={trackStyle} />
      <div
        className="absolute left-0 h-1.5 w-[50%] rounded-full"
        style={fillStyle}
      />
      <div
        className="absolute left-[50%] h-4 w-4 -translate-x-1/2 rounded-full"
        style={thumbStyle}
      />
    </div>
  );
}
