import { usePosaStore } from '../../store/posa-store';

/**
 * Inspector는 focusedNode가 있을 때 우측에 슬라이드인되는 패널.
 * 실제 ColorPicker 연결은 Prompt 04에서. 지금은 focused id만 보여주는 skeleton.
 */
export function Inspector() {
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const setFocus = usePosaStore((s) => s.setFocus);
  const layer = usePosaStore((s) => s.layer);

  if (!focusedNode) return null;

  return (
    <aside
      aria-label="Inspector"
      className="fixed top-20 right-6 w-80 bg-white/95 backdrop-blur border border-stone-200 rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            {layer} · focused
          </div>
          <div className="font-mono text-sm text-stone-900 mt-0.5 break-all">
            {focusedNode}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFocus(null)}
          aria-label="close"
          className="flex-none text-stone-400 hover:text-stone-800 w-6 h-6 inline-flex items-center justify-center rounded hover:bg-stone-100"
        >
          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 3 L9 9 M9 3 L3 9" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-stone-500 leading-relaxed">
        Color picker 연결은 다음 단계(04)에서 이루어집니다.
      </p>
    </aside>
  );
}
