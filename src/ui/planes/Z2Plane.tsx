import { useMemo, type KeyboardEvent } from 'react';
import { resolveSlotColor } from '../../color/resolve';
import { oklchToHex } from '../../color/oklch';
import type { OKLCH } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { Swatch } from '../shared/Swatch';

export function Z2Plane() {
  const universe = usePosaStore((s) => s.universe);
  const ir = usePosaStore((s) => s.ir);
  const selectedSlot = usePosaStore((s) => s.selectedSlot);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const setFocus = usePosaStore((s) => s.setFocus);

  const slotDef = useMemo(() => {
    if (!universe || !selectedSlot) return null;
    return universe.slots.find((s) => s.id === selectedSlot) ?? null;
  }, [universe, selectedSlot]);

  if (!slotDef || !selectedSlot) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="px-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
          Z2 · state
        </div>
        <div className="font-mono text-lg text-stone-900 break-all">
          {selectedSlot}
        </div>
        <div className="text-xs text-stone-500 mt-0.5">
          role <span className="font-mono text-stone-700">{slotDef.role}</span>{' '}
          · {slotDef.states.length} state{slotDef.states.length === 1 ? '' : 's'}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {slotDef.states.map((state) => {
          const isDirect = Boolean(ir.slots[selectedSlot]?.states[state]);
          const color = resolveSlotColor(ir, selectedSlot, state);
          return (
            <StateCard
              key={state}
              state={state}
              color={color}
              isDirect={isDirect}
              focused={focusedNode === state}
              onFocusToggle={() => setFocus(focusedNode === state ? null : state)}
            />
          );
        })}
      </div>
    </div>
  );
}

type StateCardProps = {
  state: string;
  color: OKLCH | null;
  isDirect: boolean;
  focused: boolean;
  onFocusToggle: () => void;
};

function StateCard({
  state,
  color,
  isDirect,
  focused,
  onFocusToggle,
}: StateCardProps) {
  const glow =
    focused && color ? `${oklchToHex(color.L, color.C, color.H)}55` : undefined;

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onFocusToggle();
    }
  };

  return (
    <div
      role="group"
      tabIndex={0}
      onClick={onFocusToggle}
      onKeyDown={handleKey}
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/80 border transition-all duration-150',
        focused
          ? 'border-stone-700 -translate-y-px'
          : 'border-stone-200 hover:border-stone-400 hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:border-stone-800 cursor-pointer',
      ].join(' ')}
      style={glow ? { boxShadow: `0 0 0 4px ${glow}` } : undefined}
    >
      <Swatch color={color} size="md" />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm text-stone-900">{state}</div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
          {isDirect ? 'set directly' : 'inherited'}
        </div>
      </div>
      <span
        className={[
          'flex-none text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full',
          isDirect
            ? 'bg-stone-900 text-cream'
            : 'bg-stone-100 text-stone-500',
        ].join(' ')}
      >
        {isDirect ? 'set' : 'inherit'}
      </span>
    </div>
  );
}
