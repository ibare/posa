import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePosaStore } from '../../store/posa-store';
import { ExportMode } from './ExportMode';
import { ReviewMode } from './ReviewMode/ReviewMode';

type Mode = 'review' | 'export';

export function ReviewView() {
  const [mode, setMode] = useState<Mode>('review');
  const primitiveCount = usePosaStore((s) => Object.keys(s.ir.primitives).length);
  const { t } = useTranslation(['review', 'export']);

  if (primitiveCount === 0) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center border border-dashed border-stone-300 rounded-lg">
        <div className="font-display italic text-xl text-stone-700">
          {t('export:empty')}
        </div>
        <p className="text-sm text-stone-500 mt-2">{t('export:emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex justify-end">
        <ModeToggle mode={mode} onChange={setMode} />
      </div>
      {mode === 'review' ? <ReviewMode /> : <ExportMode />}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const { t } = useTranslation('review');
  return (
    <div
      role="tablist"
      aria-label={t('mode.toggleAria')}
      className="inline-flex overflow-hidden rounded-full border border-stone-200 bg-white text-[12px]"
    >
      <ToggleButton
        active={mode === 'review'}
        onClick={() => onChange('review')}
        label={t('mode.review')}
      />
      <ToggleButton
        active={mode === 'export'}
        onClick={() => onChange('export')}
        label={t('mode.export')}
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'px-4 py-1.5 font-mono uppercase tracking-wider transition',
        active
          ? 'bg-stone-900 text-cream'
          : 'text-stone-500 hover:text-stone-900',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
