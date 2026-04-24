import { useEffect, useState } from 'react';
import { useToastStore } from './toast';

const VISIBLE_MS = 1500;
const FADE_MS = 180;

export function ToastHost() {
  const message = useToastStore((s) => s.message);
  const token = useToastStore((s) => s.token);
  const clear = useToastStore((s) => s.clear);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message === null) return;
    setVisible(true);
    const hideTimer = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    const clearTimer = window.setTimeout(() => clear(), VISIBLE_MS + FADE_MS);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [token, message, clear]);

  if (message === null) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div
        className={[
          'pointer-events-auto rounded-md bg-stone-900 px-3 py-1.5 shadow-lg ring-1 ring-black/5',
          'text-[12px] font-mono text-cream transition-opacity',
          visible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        {message}
      </div>
    </div>
  );
}
