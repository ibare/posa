import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePosaStore } from '../../../store/posa-store';
import { PaletteRibbon } from '../PaletteRibbon';

type Props = { children: ReactNode };

const NAV: { to: string; label: string }[] = [
  { to: '/explore', label: 'Explore' },
  { to: '/atlas', label: 'Atlas' },
  { to: '/review', label: 'Review' },
];

export function Shell({ children }: Props) {
  const ir = usePosaStore((s) => s.ir);
  const startFresh = usePosaStore((s) => s.startFresh);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream text-stone-900 font-body antialiased">
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-cream/90 backdrop-blur px-6 py-3 flex items-center gap-4">
        <h1 className="font-display italic text-2xl leading-none tracking-tight select-none">
          Posa
        </h1>
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'text-xs px-2.5 py-1 rounded border transition',
                  isActive
                    ? 'border-stone-900 bg-stone-900 text-cream'
                    : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
        <PaletteRibbon ir={ir} />
        <button
          type="button"
          onClick={() => {
            startFresh();
            navigate('/');
          }}
          className="text-xs text-stone-500 hover:text-stone-900 px-2.5 py-1 rounded border border-stone-200 hover:border-stone-400 transition"
        >
          Reset
        </button>
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
