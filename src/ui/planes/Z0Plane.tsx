import { useMemo, type KeyboardEvent } from 'react';
import { resolveRoleColor } from '../../color/resolve';
import type { RoleDefinition, RoleGroup } from '../../catalog/roles';
import { usePosaStore } from '../../store/posa-store';
import type { OKLCH } from '../../ir/types';
import { oklchToHex } from '../../color/oklch';
import { Swatch } from '../shared/Swatch';

const GROUP_ORDER: RoleGroup[] = ['brand', 'structural', 'content', 'state'];

const GROUP_LABEL: Record<RoleGroup, string> = {
  brand: 'Brand',
  structural: 'Structural',
  content: 'Content',
  state: 'State',
};

export function Z0Plane() {
  const universe = usePosaStore((s) => s.universe);
  const ir = usePosaStore((s) => s.ir);
  const descendTo = usePosaStore((s) => s.descendTo);
  const setFocus = usePosaStore((s) => s.setFocus);
  const focusedNode = usePosaStore((s) => s.focusedNode);

  const slotCountByRole = useMemo(() => {
    const m: Record<string, number> = {};
    if (!universe) return m;
    for (const s of universe.slots) {
      m[s.role] = (m[s.role] ?? 0) + 1;
    }
    return m;
  }, [universe]);

  const grouped = useMemo(() => {
    const bucket: Record<RoleGroup, RoleDefinition[]> = {
      brand: [],
      structural: [],
      content: [],
      state: [],
    };
    if (!universe) return bucket;
    for (const r of universe.roles) bucket[r.group].push(r);
    return bucket;
  }, [universe]);

  if (!universe) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {GROUP_ORDER.map((group) => {
        const roles = grouped[group];
        if (roles.length === 0) return null;
        return (
          <section key={group}>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">
              {GROUP_LABEL[group]}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  focused={focusedNode === role.id}
                  color={resolveRoleColor(ir, role.id)}
                  slotCount={slotCountByRole[role.id] ?? 0}
                  onDescend={() => descendTo(role.id)}
                  onFocusToggle={() =>
                    setFocus(focusedNode === role.id ? null : role.id)
                  }
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

type RoleCardProps = {
  role: RoleDefinition;
  focused: boolean;
  color: OKLCH | null;
  slotCount: number;
  onDescend: () => void;
  onFocusToggle: () => void;
};

function RoleCard({
  role,
  focused,
  color,
  slotCount,
  onDescend,
  onFocusToggle,
}: RoleCardProps) {
  const glow =
    focused && color ? `${oklchToHex(color.L, color.C, color.H)}55` : undefined;

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onDescend();
    } else if (e.key === ' ') {
      e.preventDefault();
      onFocusToggle();
    } else if (e.key === 'Escape') {
      if (focused) {
        e.preventDefault();
        onFocusToggle();
      }
    }
  };

  return (
    <div
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
      style={glow ? ({ boxShadow: `0 0 0 4px ${glow}` } as React.CSSProperties) : undefined}
    >
      <Swatch color={color} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-stone-900">{role.id}</span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            default shade {role.defaultShade}
          </span>
        </div>
        <div className="text-xs text-stone-500 leading-snug mt-0.5">
          {role.description}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDescend();
        }}
        className="flex-none inline-flex items-center gap-2 text-xs font-mono text-stone-600 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
        title="slot 층으로 내려가기 (Enter)"
      >
        <span className="tabular-nums">{slotCount}</span>
        <span className="text-stone-400">slots</span>
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
    </div>
  );
}
