import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      else if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
        <h3
          id="confirm-dialog-title"
          className="font-display italic text-2xl text-stone-900 leading-tight"
        >
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            {description}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-mono px-3 py-1.5 rounded border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 transition"
          >
            {cancelLabel ?? t('action.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              'text-xs font-mono px-3 py-1.5 rounded border transition',
              destructive
                ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700'
                : 'bg-stone-900 border-stone-900 text-cream hover:-translate-y-px',
            ].join(' ')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
