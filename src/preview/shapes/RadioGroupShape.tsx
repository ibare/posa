import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn RadioGroup — 여러 옵션 중 하나 선택.
 * 첫 라디오가 현재 state 색으로 렌더되고, 나머지는 기본형.
 * `checked` state일 때만 dot 마크가 보인다.
 */
export function RadioGroupShape({ state = 'default' }: Props) {
  return (
    <div
      className="flex flex-col gap-2"
      data-posa-slot="radio-group.background"
      data-posa-state={state}
    >
      <RadioRow state={state} label="Option one" />
      <RadioRow state="default" label="Option two" />
      <RadioRow state="default" label="Option three" />
    </div>
  );
}

function RadioRow({ state, label }: { state: StateId; label: string }) {
  const circleStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('radio-group.background', state)})`,
    borderColor: `var(--${slotVarName('radio-group.border', state)})`,
  };
  const dotStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('radio-group.mark', state)})`,
  };
  const showDot = state === 'checked';

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border"
        style={circleStyle}
      >
        {showDot && <div className="h-2 w-2 rounded-full" style={dotStyle} />}
      </div>
      <span>{label}</span>
    </div>
  );
}
