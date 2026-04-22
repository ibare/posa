import { useMemo, useRef, type KeyboardEvent } from 'react';
import { resolveRoleColor, resolveSlotColor } from '../../color/resolve';
import { oklchToHex } from '../../color/oklch';
import type { SlotDefinition } from '../../catalog/slots';
import { usePosaStore } from '../../store/posa-store';
import type { OKLCH } from '../../ir/types';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '../../components/ui/popover';
import { InspectorBody } from '../shared/InspectorBody';
import { Swatch } from '../shared/Swatch';

export function Z1Plane() {
  const universe = usePosaStore((s) => s.universe);
  const ir = usePosaStore((s) => s.ir);
  const selectedRole = usePosaStore((s) => s.selectedRole);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const setFocus = usePosaStore((s) => s.setFocus);
  const descendTo = usePosaStore((s) => s.descendTo);

  const slots = useMemo(() => {
    if (!universe || !selectedRole) return [];
    return universe.slots.filter((s) => s.role === selectedRole);
  }, [universe, selectedRole]);

  if (!universe || !selectedRole) return null;

  const roleColor = resolveRoleColor(ir, selectedRole);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center gap-4 px-1">
        <Swatch color={roleColor} size="lg" />
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            Z1 · slot
          </div>
          <div className="font-mono text-lg text-stone-900">{selectedRole}</div>
          <div className="text-xs text-stone-500 mt-0.5">
            {slots.length} slot{slots.length === 1 ? '' : 's'} reference this role
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            focused={focusedNode === slot.id}
            color={resolveSlotColor(ir, slot.id, 'default')}
            hasStateOverride={(state: string) =>
              Boolean(ir.slots[slot.id]?.states[state])
            }
            onFocusToggle={() =>
              setFocus(focusedNode === slot.id ? null : slot.id)
            }
            onDescend={() => descendTo(slot.id)}
          />
        ))}
        {slots.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-stone-500 border border-dashed border-stone-300 rounded-lg">
            No slots in the universe reference this role.
          </div>
        )}
      </div>
    </div>
  );
}

type SlotCardProps = {
  slot: SlotDefinition;
  focused: boolean;
  color: OKLCH | null;
  hasStateOverride: (state: string) => boolean;
  onFocusToggle: () => void;
  onDescend: () => void;
};

function SlotCard({
  slot,
  focused,
  color,
  hasStateOverride,
  onFocusToggle,
  onDescend,
}: SlotCardProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const multiState = slot.states.length > 1;
  const glow =
    focused && color ? `${oklchToHex(color.L, color.C, color.H)}55` : undefined;

  const setCount = slot.states.filter((s) => hasStateOverride(s)).length;

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && multiState) {
      e.preventDefault();
      onDescend();
    } else if (e.key === ' ') {
      e.preventDefault();
      onFocusToggle();
    }
  };

  return (
    <Popover
      open={focused}
      onOpenChange={(open) => {
        if (!open && focused) onFocusToggle();
      }}
    >
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          role="group"
          tabIndex={0}
          onKeyDown={handleKey}
          onClick={onFocusToggle}
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
            <div className="font-mono text-sm text-stone-900 break-all">
              {slot.id}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {slot.states.map((state) => (
                <StateDot
                  key={state}
                  label={state}
                  filled={hasStateOverride(state)}
                />
              ))}
              <span className="text-[10px] font-mono text-stone-400 ml-1 tabular-nums">
                {setCount}/{slot.states.length}
              </span>
            </div>
          </div>
          {multiState && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDescend();
              }}
              className="flex-none inline-flex items-center gap-2 text-xs font-mono text-stone-600 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
              title="Descend to state layer (Enter)"
            >
              <span>states</span>
              <svg
                viewBox="0 0 12 12"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="4,2 8,6 4,10" />
              </svg>
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-80 bg-white/95 backdrop-blur border-stone-200 text-stone-900 shadow-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <InspectorBody />
      </PopoverContent>
    </Popover>
  );
}

function StateDot({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span
      title={label}
      className={[
        'w-2 h-2 rounded-full border',
        filled ? 'bg-stone-800 border-stone-800' : 'bg-transparent border-stone-300',
      ].join(' ')}
    />
  );
}
