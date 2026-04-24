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
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-cream/90 backdrop-blur px-3 md:px-6 py-2 md:py-3 flex flex-wrap items-center gap-x-3 gap-y-2 md:gap-4">
        <h1 className="font-display italic text-xl md:text-2xl leading-none tracking-tight select-none">
          {t('app.title')}
          <sup className="relative top-[10px] ml-0.5 align-top font-mono not-italic text-[9px] uppercase tracking-[0.15em] text-stone-400">
            {t('app.beta')}
          </sup>
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
        <div className="hidden md:block">
          <PaletteRibbon ir={ir} />
        </div>
        <LocaleToggle />
        <button
          type="button"
          onClick={() => navigate('/')}
          className="hidden md:inline-flex text-xs text-stone-600 hover:text-stone-900 px-2.5 py-1 rounded border border-stone-200 hover:border-stone-400 transition"
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
        <a
          href="https://github.com/ibare/posa"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="GitHub"
          title="GitHub"
          className="inline-flex items-center justify-center text-stone-500 hover:text-stone-900 px-2 py-1 rounded border border-stone-200 hover:border-stone-400 transition"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="w-4 h-4"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
        </a>
      </header>
      <main className="px-3 py-4 md:px-6 md:py-6">{children}</main>
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
