import { usePosaStore } from '../../store/posa-store';

export function Z2Plane() {
  const selectedSlot = usePosaStore((s) => s.selectedSlot);
  const ascend = usePosaStore((s) => s.ascend);

  return (
    <div className="mx-auto max-w-3xl p-10 rounded-lg border border-dashed border-stone-300 bg-white/40 text-center">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-1">
        Z2 · state
      </div>
      <div className="font-display italic text-2xl text-stone-700">
        {selectedSlot ?? '—'}
      </div>
      <p className="text-xs text-stone-500 mt-3 leading-relaxed">
        이 평면은 다음 프롬프트(04)에서 state variant 제어와 함께 구현됩니다.
      </p>
      <button
        type="button"
        onClick={ascend}
        className="mt-5 text-xs px-3 py-1.5 rounded-full border border-stone-300 hover:border-stone-700 transition"
      >
        ← Z1로 돌아가기 (Esc)
      </button>
    </div>
  );
}
