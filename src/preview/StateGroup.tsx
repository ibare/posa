import type { ReactNode } from 'react';
import type { StateId } from '../ir/types';

type Props = {
  label: string;
  states: StateId[];
  children: (state: StateId) => ReactNode;
};

/**
 * 한 variant의 모든 state를 나란히 정적으로 렌더한다.
 * 일반 UI 라이브러리는 interaction으로 state를 보여주지만,
 * Posa preview는 "모든 상태를 동시에" 보여주는 것이 요점이다.
 */
export function StateGroup({ label, states, children }: Props) {
  return (
    <div className="flex flex-wrap items-start gap-6">
      {states.map((state) => (
        <div key={state} className="flex flex-col items-start gap-2">
          {children(state)}
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            {label} · {state}
          </div>
        </div>
      ))}
    </div>
  );
}
