import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { usePosaStore } from '../../../store/posa-store';
import { ConfirmDialog } from '../ConfirmDialog';
import { PaletteRibbon } from '../PaletteRibbon';
import { LocaleToggle } from './LocaleToggle';

type Props = { children: ReactNode };

const NAV: { to: string; key: string }[] = [
  { to: '/explore', key: 'nav.explore' },
  { to: '/atlas', key: 'nav.atlas' },
  { to: '/review', key: 'nav.review' },
];

export function Shell({ children }: Props) {
  const ir = usePosaStore((s) => s.ir);
  const startFresh = usePosaStore((s) => s.startFresh);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const confirmReset = () => {
    startFresh();
    setResetConfirmOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream text-stone-900 font-body antialiased">
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-cream/90 backdrop-blur px-6 py-3 flex items-center gap-4">
        <h1 className="font-display italic text-2xl leading-none tracking-tight select-none">
          {t('app.title')}
        </h1>
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, key }) => (
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
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
        <PaletteRibbon ir={ir} />
        <LocaleToggle />
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs text-stone-600 hover:text-stone-900 px-2.5 py-1 rounded border border-stone-200 hover:border-stone-400 transition"
        >
          {t('nav.editComponents')}
        </button>
        <button
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          className="text-xs text-stone-500 hover:text-stone-900 px-2.5 py-1 rounded border border-stone-200 hover:border-stone-400 transition"
        >
          {t('action.reset')}
        </button>
      </header>
      <main className="px-6 py-6">{children}</main>
      <ConfirmDialog
        open={resetConfirmOpen}
        destructive
        title={t('confirm.reset.title')}
        description={t('confirm.reset.description')}
        confirmLabel={t('confirm.reset.confirm')}
        onConfirm={confirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
}
