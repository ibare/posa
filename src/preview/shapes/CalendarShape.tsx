import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * shadcn Calendar — 월 그리드. active = 오늘/선택일, muted = 이전·다음 달 날짜.
 * hover는 임의 한 날짜에 적용.
 */
export function CalendarShape({ state = 'default' }: Props) {
  const containerStyle: CSSProperties = {
    border: `1px solid var(--${slotVarName('calendar.border', 'default')})`,
    color: `var(--${slotVarName('calendar.text', 'default')})`,
    backgroundColor: `var(--${slotVarName('calendar.background', 'default')})`,
  };
  const mutedColor = `var(--${slotVarName('calendar.muted', 'default')})`;
  const headerColor = mutedColor;
  const activeDayStyle: CSSProperties = {
    backgroundColor: `var(--${slotVarName('calendar.background', state)})`,
    color: `var(--${slotVarName('calendar.text', state)})`,
  };

  // 15일이 active 날짜. 1일부터 30일까지 — 첫 주에 앞달 28,29,30, 마지막 주에 다음달 1,2 끼워 7열 6행.
  type Cell = { label: string; muted?: boolean; active?: boolean };
  const cells: Cell[] = [];
  // prev month 28,29,30
  cells.push({ label: '28', muted: true });
  cells.push({ label: '29', muted: true });
  cells.push({ label: '30', muted: true });
  for (let d = 1; d <= 30; d++) cells.push({ label: String(d), active: d === 15 });
  // pad to 35 cells with next month 1..
  let nd = 1;
  while (cells.length < 35) cells.push({ label: String(nd++), muted: true });

  return (
    <div
      className="inline-flex flex-col gap-1 rounded-md p-3 text-[11px]"
      style={containerStyle}
      data-posa-slot="calendar.background"
      data-posa-state={state}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="font-medium">April 2026</span>
        <span className="flex items-center gap-1" style={{ color: headerColor }}>
          <span>‹</span>
          <span>›</span>
        </span>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {DAY_HEADERS.map((d, i) => (
          <span
            key={`h-${i}`}
            className="flex h-6 w-6 items-center justify-center text-[10px] font-medium"
            style={{ color: headerColor }}
          >
            {d}
          </span>
        ))}
        {cells.map((c, i) => (
          <span
            key={`c-${i}`}
            className="flex h-6 w-6 items-center justify-center rounded"
            style={
              c.active
                ? activeDayStyle
                : c.muted
                  ? { color: mutedColor }
                  : undefined
            }
          >
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
