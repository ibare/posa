import { useMemo, useState } from 'react';
import { listPrimitiveReferences, shadeUsage } from '../../color/atlas-ops';
import { oklchToCssString, oklchToHex } from '../../color/oklch';
import { SHADE_INDICES, type PrimitiveScale } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';

type Props = {
  primitive: PrimitiveScale;
  refCount: number;
  isOrphan: boolean;
  mergeSource: string | null;
  onSelectAsMergeSource: () => void;
  onCancelMerge: () => void;
};

export function PrimitiveCard({
  primitive,
  refCount,
  isOrphan,
  mergeSource,
  onSelectAsMergeSource,
  onCancelMerge,
}: Props) {
  const ir = usePosaStore((s) => s.ir);
  const removePrimitive = usePosaStore((s) => s.removePrimitive);
  const mergePrimitive = usePosaStore((s) => s.mergePrimitive);
  const [expanded, setExpanded] = useState(false);

  const refs = useMemo(
    () => listPrimitiveReferences(ir, primitive.id),
    [ir, primitive.id],
  );
  const usage = useMemo(() => shadeUsage(ir, primitive.id), [ir, primitive.id]);

  const isMergeTargetCandidate =
    mergeSource !== null && mergeSource !== primitive.id;
  const isMergeSource = mergeSource === primitive.id;

  const handleRemove = () => {
    if (refCount > 0) return;
    if (!window.confirm(`${primitive.id}을(를) 제거하시겠습니까?`)) return;
    removePrimitive(primitive.id);
  };

  const handleMergeInto = () => {
    if (!mergeSource) return;
    const ok = window.confirm(
      `${mergeSource}의 모든 참조를 ${primitive.id}(으)로 옮기고 ${mergeSource}을(를) 제거합니다. 계속할까요?`,
    );
    if (!ok) return;
    mergePrimitive(mergeSource, primitive.id);
    onCancelMerge();
  };

  return (
    <div
      className={[
        'rounded-lg border bg-white/80 p-4 space-y-3 transition',
        isMergeSource
          ? 'border-stone-900 ring-2 ring-stone-900/30'
          : 'border-stone-200',
        isOrphan ? 'opacity-60' : '',
      ].join(' ')}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-stone-900">
              {primitive.id}
            </span>
            {isOrphan && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Orphan
              </span>
            )}
          </div>
          <div className="text-xs text-stone-500 mt-0.5 font-mono tabular-nums">
            anchor at shade {primitive.anchorShade} ·{' '}
            {oklchToCssString(primitive.anchor)}
          </div>
        </div>
        <span className="flex-none text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-stone-100 text-stone-600">
          used in {refCount} place{refCount === 1 ? '' : 's'}
        </span>
      </header>

      <div>
        <div className="flex rounded overflow-hidden ring-1 ring-stone-200">
          {SHADE_INDICES.map((shade) => {
            const c = primitive.scale[shade];
            const hex = oklchToHex(c.L, c.C, c.H);
            const isAnchor = shade === primitive.anchorShade;
            return (
              <span
                key={shade}
                className="flex-1 h-7 relative"
                style={{ backgroundColor: hex }}
                title={`${shade} · ${hex} · ${usage[shade] ?? 0}x`}
              >
                {isAnchor && (
                  <span
                    className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-stone-900/70"
                    aria-label="anchor"
                  />
                )}
              </span>
            );
          })}
        </div>
        <div className="flex text-[10px] font-mono text-stone-400 tabular-nums mt-1">
          {SHADE_INDICES.map((shade) => (
            <span key={shade} className="flex-1 text-center">
              {usage[shade] > 0 ? usage[shade] : ''}
            </span>
          ))}
        </div>
      </div>

      {refCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-stone-600 hover:text-stone-900 underline underline-offset-2"
        >
          {expanded ? '참조 숨기기' : '참조 보기'}
        </button>
      )}

      {expanded && (
        <div className="text-xs font-mono space-y-1.5 pt-2 border-t border-stone-100">
          {refs.roles.length > 0 && (
            <div>
              <span className="text-stone-400">roles: </span>
              <span className="text-stone-800">{refs.roles.join(', ')}</span>
            </div>
          )}
          {refs.slotStates.length > 0 && (
            <div>
              <span className="text-stone-400">slot states: </span>
              <span className="text-stone-800">
                {refs.slotStates
                  .map((r) => `${r.slotId} (${r.state})`)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      <footer className="flex items-center gap-2 pt-1">
        {isMergeTargetCandidate ? (
          <button
            type="button"
            onClick={handleMergeInto}
            className="text-xs px-3 py-1.5 rounded border border-stone-900 bg-stone-900 text-cream hover:opacity-90 transition"
          >
            여기로 병합
          </button>
        ) : (
          <button
            type="button"
            onClick={
              isMergeSource ? onCancelMerge : onSelectAsMergeSource
            }
            disabled={Object.keys(ir.primitives).length < 2}
            className="text-xs px-3 py-1.5 rounded border border-stone-200 text-stone-700 hover:border-stone-500 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title={
              Object.keys(ir.primitives).length < 2
                ? '병합하려면 다른 primitive가 필요합니다'
                : '다른 primitive로 병합 시작'
            }
          >
            {isMergeSource ? '병합 취소' : 'Merge…'}
          </button>
        )}
        <button
          type="button"
          onClick={handleRemove}
          disabled={refCount > 0}
          className="text-xs px-3 py-1.5 rounded border border-stone-200 text-stone-700 hover:border-red-400 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title={refCount > 0 ? '여전히 참조 중 (삭제 불가)' : '제거'}
        >
          Remove
        </button>
      </footer>
    </div>
  );
}
