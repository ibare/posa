import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/** shadcn Input OTP — 고정폭 단일 문자 slot 6개. 가운데 separator. */
export function InputOTPShape({ state = 'default' }: Props) {
  const bg = `var(--${slotVarName('input-otp.background', state)})`;
  const textVar = `var(--${slotVarName('input-otp.text', state)})`;
  const placeholderVar = `var(--${slotVarName('input-otp.placeholder', state)})`;
  const borderVar = `var(--${slotVarName('input-otp.border', state)})`;
  const outlineVar = `var(--${slotVarName('input-otp.outline', state)})`;

  const cellStyle: CSSProperties = {
    backgroundColor: bg,
    border: `1px solid ${borderVar}`,
    boxShadow: state === 'focus' ? `0 0 0 2px ${outlineVar}` : undefined,
  };
  const filledText = { color: textVar };
  const emptyText = { color: placeholderVar };

  return (
    <div
      className="inline-flex items-center gap-1"
      data-posa-slot="input-otp.background"
      data-posa-state={state}
    >
      <Cell char="4" style={{ ...cellStyle, ...filledText }} />
      <Cell char="2" style={{ ...cellStyle, ...filledText }} />
      <Cell char="7" style={{ ...cellStyle, ...filledText }} />
      <span className="mx-1 text-sm opacity-40">-</span>
      <Cell char="•" style={{ ...cellStyle, ...emptyText }} />
      <Cell char="•" style={{ ...cellStyle, ...emptyText }} />
      <Cell char="•" style={{ ...cellStyle, ...emptyText }} />
    </div>
  );
}

function Cell({ char, style }: { char: string; style: CSSProperties }) {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-mono"
      style={style}
    >
      {char}
    </div>
  );
}
