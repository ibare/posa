import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  listPrimitiveReferences,
  shadeUsage,
  type PrimitiveReferenceLocation,
} from '../../color/atlas-ops';
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
  const { t } = useTranslation('primitives');

  const refs = useMemo(
    () => listPrimitiveReferences(ir, primitive.id),
    [ir, primitive.id],
  );
  const refGroups = useMemo(() => groupRefs(refs), [refs]);
  const usage = useMemo(() => shadeUsage(ir, primitive.id), [ir, primitive.id]);

  const isMergeTargetCandidate =
    mergeSource !== null && mergeSource !== primitive.id;
  const isMergeSource = mergeSource === primitive.id;

  const handleRemove = () => {
    if (refCount > 0) return;
    if (!window.confirm(t('card.confirmRemove', { id: primitive.id }))) return;
    removePrimitive(primitive.id);
  };

  const handleMergeInto = () => {
    if (!mergeSource) return;
    const ok = window.confirm(
      t('card.confirmMerge', { source: mergeSource, target: primitive.id }),
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
                {t('card.orphan')}
              </span>
            )}
          </div>
          <div className="text-xs text-stone-500 mt-0.5 font-mono tabular-nums">
            {t('card.anchorAtShade', { shade: primitive.anchorShade })} ·{' '}
            {oklchToCssString(primitive.anchor)}
          </div>
        </div>
        <span className="flex-none text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-stone-100 text-stone-600">
          {t('card.usedIn')} {t('card.placeCount', { count: refCount })}
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
                    aria-label={t('card.anchor')}
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
          {expanded ? t('card.hideReferences') : t('card.showReferences')}
        </button>
      )}

      {expanded && (
        <div className="text-xs font-mono space-y-1.5 pt-2 border-t border-stone-100">
          {refGroups.symbols.length > 0 && (
            <div>
              <span className="text-stone-400">{t('card.refSymbols')} </span>
              <span className="text-stone-800">
                {refGroups.symbols.join(', ')}
              </span>
            </div>
          )}
          {refGroups.attributes.length > 0 && (
            <div>
              <span className="text-stone-400">{t('card.refAttributes')} </span>
              <span className="text-stone-800">
                {refGroups.attributes.join(', ')}
              </span>
            </div>
          )}
          {refGroups.slots.length > 0 && (
            <div>
              <span className="text-stone-400">{t('card.refSlots')} </span>
              <span className="text-stone-800">
                {refGroups.slots.join(', ')}
              </span>
            </div>
          )}
          {refGroups.slotStates.length > 0 && (
            <div>
              <span className="text-stone-400">{t('card.refSlotStates')} </span>
              <span className="text-stone-800">
                {refGroups.slotStates.join(', ')}
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
            {t('card.mergeHere')}
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
                ? t('card.mergeRequires')
                : t('card.startMerging')
            }
          >
            {isMergeSource ? t('card.cancelMerge') : t('card.merge')}
          </button>
        )}
        <button
          type="button"
          onClick={handleRemove}
          disabled={refCount > 0}
          className="text-xs px-3 py-1.5 rounded border border-stone-200 text-stone-700 hover:border-red-400 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title={refCount > 0 ? t('card.stillInUse') : t('card.remove')}
        >
          {t('card.remove')}
        </button>
      </footer>
    </div>
  );
}

function groupRefs(refs: PrimitiveReferenceLocation[]) {
  const symbols: string[] = [];
  const attributes: string[] = [];
  const slots: string[] = [];
  const slotStates: string[] = [];
  for (const r of refs) {
    if (r.kind === 'symbol') symbols.push(r.symbolId);
    else if (r.kind === 'attribute') attributes.push(r.attributeId);
    else if (r.kind === 'slot') slots.push(r.slotId);
    else slotStates.push(`${r.slotId} (${r.state})`);
  }
  return { symbols, attributes, slots, slotStates };
}
