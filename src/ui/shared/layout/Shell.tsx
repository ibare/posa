import type { ReactNode } from 'react';
import { usePosaStore } from '../../../store/posa-store';
import { ProgressBadge } from '../ProgressBadge';

type Props = { children: ReactNode };

export function Shell({ children }: Props) {
  const phase = usePosaStore((s) => s.phase);
  const universe = usePosaStore((s) => s.universe);
  const ir = usePosaStore((s) => s.ir);
  const resetAll = usePosaStore((s) => s.resetAll);

  const totalRoles = universe?.roles.length ?? 0;
  const filledRoles = universe
    ? universe.roles.filter((r) => ir.roles[r.id] !== undefined).length
    : 0;

  return (
    <div className="min-h-screen bg-cream text-stone-900 font-body antialiased">
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-cream/90 backdrop-blur px-6 py-3 flex items-center gap-4">
        <h1 className="font-display italic text-2xl leading-none tracking-tight select-none">
          Posa
        </h1>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
          {phase}
        </span>
        <div className="flex-1" />
        {phase !== 'onboarding' && universe && (
          <>
            <ProgressBadge
              filled={filledRoles}
              total={totalRoles}
              label="색이 지정된 role"
            />
            <button
              type="button"
              onClick={resetAll}
              className="text-xs text-stone-500 hover:text-stone-900 px-2.5 py-1 rounded border border-stone-200 hover:border-stone-400 transition"
            >
              Reset
            </button>
          </>
        )}
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
