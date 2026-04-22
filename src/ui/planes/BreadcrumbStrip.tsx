import { useMemo } from 'react';
import { oklchToHex } from '../../color/oklch';
import { resolveRoleColor, resolveSlotColor } from '../../color/resolve';
import type { RoleDefinition } from '../../catalog/roles';
import type { SlotDefinition } from '../../catalog/slots';
import { usePosaStore, type Layer } from '../../store/posa-store';

const LAYER_LABEL: Record<Layer, string> = {
  z0: 'Z0 · role',
  z1: 'Z1 · slot',
  z2: 'Z2 · state',
};

export function BreadcrumbStrip() {
  const layer = usePosaStore((s) => s.layer);
  const selectedRole = usePosaStore((s) => s.selectedRole);
  const selectedSlot = usePosaStore((s) => s.selectedSlot);
  const jumpToLayer = usePosaStore((s) => s.jumpToLayer);

  return (
    <div className="mx-auto max-w-5xl mb-6 flex items-center gap-3 flex-wrap">
      {layer !== 'z0' && (
        <button
          type="button"
          onClick={() => jumpToLayer('z0')}
          className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-stone-200/60 transition"
          title="Z0로 돌아가기"
        >
          <MiniZ0 />
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 group-hover:text-stone-800">
            roles
          </span>
        </button>
      )}

      {layer === 'z2' && selectedRole && (
        <>
          <Divider />
          <button
            type="button"
            onClick={() => jumpToLayer('z1')}
            className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-stone-200/60 transition"
            title="Z1로 돌아가기"
          >
            <MiniZ1 />
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 group-hover:text-stone-800">
              {selectedRole}
            </span>
          </button>
        </>
      )}

      {(layer === 'z1' || layer === 'z2') && (
        <>
          <Divider />
          <span className="font-mono text-xs text-stone-900 px-2 py-1 bg-stone-100 rounded">
            {layer === 'z1' ? selectedRole : selectedSlot}
          </span>
        </>
      )}

      <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
        {LAYER_LABEL[layer]}
      </span>
    </div>
  );
}

function Divider() {
  return <span className="text-stone-300">·</span>;
}

/** Universe의 모든 role dot grid. selectedRole이 링으로 강조. */
function MiniZ0() {
  const universe = usePosaStore((s) => s.universe);
  const ir = usePosaStore((s) => s.ir);
  const selectedRole = usePosaStore((s) => s.selectedRole);

  const rows = useMemo(() => {
    if (!universe) return [] as RoleDefinition[][];
    const cols = 4;
    const out: RoleDefinition[][] = [];
    for (let i = 0; i < universe.roles.length; i += cols) {
      out.push(universe.roles.slice(i, i + cols));
    }
    return out;
  }, [universe]);

  if (!universe) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-0.5">
          {row.map((role) => {
            const c = resolveRoleColor(ir, role.id);
            const hex = c ? oklchToHex(c.L, c.C, c.H) : '#e7e5e4';
            const isActive = role.id === selectedRole;
            return (
              <span
                key={role.id}
                className={[
                  'w-2 h-2 rounded-[1px]',
                  isActive ? 'ring-2 ring-stone-900 ring-offset-1 ring-offset-cream' : '',
                ].join(' ')}
                style={{ backgroundColor: hex }}
                title={role.id}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** 현재 selectedRole의 slot들을 가로 막대 stack. */
function MiniZ1() {
  const universe = usePosaStore((s) => s.universe);
  const ir = usePosaStore((s) => s.ir);
  const selectedRole = usePosaStore((s) => s.selectedRole);
  const selectedSlot = usePosaStore((s) => s.selectedSlot);

  const slots = useMemo<SlotDefinition[]>(() => {
    if (!universe || !selectedRole) return [];
    return universe.slots.filter((s) => s.role === selectedRole);
  }, [universe, selectedRole]);

  if (slots.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 w-10">
      {slots.slice(0, 8).map((slot) => {
        const c = resolveSlotColor(ir, slot.id, 'default');
        const hex = c ? oklchToHex(c.L, c.C, c.H) : '#e7e5e4';
        const isActive = slot.id === selectedSlot;
        return (
          <span
            key={slot.id}
            className={[
              'h-1.5 rounded-[1px]',
              isActive
                ? 'ring-2 ring-stone-900 ring-offset-1 ring-offset-cream'
                : '',
            ].join(' ')}
            style={{ backgroundColor: hex }}
            title={slot.id}
          />
        );
      })}
    </div>
  );
}
