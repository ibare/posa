import { useTranslation } from 'react-i18next';
import { LOCALES, type Locale } from '../../../i18n';
import { usePosaStore } from '../../../store/posa-store';

export function LocaleToggle() {
  const locale = usePosaStore((s) => s.locale);
  const setLocale = usePosaStore((s) => s.setLocale);
  const { t } = useTranslation('common');

  return (
    <div
      role="group"
      aria-label={t('locale.ariaLabel')}
      className="flex items-center rounded border border-stone-200 overflow-hidden"
    >
      {LOCALES.map((code: Locale) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            className={[
              'text-[10px] font-mono uppercase tracking-wider px-2 py-1 transition',
              active
                ? 'bg-stone-900 text-cream'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
            ].join(' ')}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
