import { useEffect, useMemo } from 'react';
import { oklchToHex } from '../../color/oklch';
import { deriveScale } from '../../color/primitive';
import {
  countPrimitiveReferences,
  hueFamily,
} from '../../color/primitive-ops';
import { SHADE_INDICES, type OKLCH, type ShadeIndex } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';

export function AdjustOrReplaceDialog() {
  const pending = usePosaStore((s) => s.pendingPrimitiveDecision);
  const ir = usePosaStore((s) => s.ir);
  const resolve = usePosaStore((s) => s.resolvePendingPrimitive);
  const cancel = usePosaStore((s) => s.cancelPendingPrimitive);

  const primitive = pending ? ir.primitives[pending.currentPrimitiveId] : null;

  const newScale = useMemo(() => {
    if (!pending || !primitive) return null;
    return deriveScale(pending.newAnchor, primitive.anchorShade);
  }, [pending, primitive]);

  const refCount = useMemo(() => {
    if (!pending) return 0;
    return countPrimitiveReferences(ir, pending.currentPrimitiveId);
  }, [ir, pending]);

  // 이 role을 제외한 나머지 참조 수 — replace 시 기존 primitive를 계속 참조할 slot의 수.
  const otherRefCount = useMemo(() => {
    if (!pending) return 0;
    const selfIsRole =
      ir.roles[pending.roleId]?.primitive === pending.currentPrimitiveId;
    return refCount - (selfIsRole ? 1 : 0);
  }, [ir, pending, refCount]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'Enter') {
        e.preventDefault();
        resolve('adjust');
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        resolve('replace');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, resolve, cancel]);

  if (!pending || !primitive || !newScale) return null;

  const family = hueFamily(pending.newAnchor);
  const currentFamily = hueFamily(primitive.anchor);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Adjust or Replace"
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/30 backdrop-blur-sm"
      onClick={cancel}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl border border-stone-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 pt-6 pb-3">
          <h2 className="font-display italic text-xl text-stone-900 leading-tight">
            This color is outside the existing {currentFamily} palette
          </h2>
          <p className="text-sm text-stone-500 mt-1">How would you like to handle it?</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-6 pb-4">
          <OptionCard
            badge="A"
            title={`Adjust ${currentFamily}`}
            description={`Adjust the anchor of existing ${primitive.id}. Other shades in the same scale will be recalculated. Slots referencing this primitive will be affected automatically.`}
            before={primitive.scale}
            after={newScale}
            footer={
              <>
                <span className="text-stone-500">Referenced by</span>{' '}
                <span className="tabular-nums text-stone-800">{refCount}</span>{' '}
                <span className="text-stone-500">slot{refCount === 1 ? '' : 's'}</span>
              </>
            }
            onClick={() => resolve('adjust')}
          />
          <OptionCard
            badge="B"
            title={`Replace with new ${family}`}
            description="Create a new primitive. This role will point to the new primitive, and the existing primitive stays intact. Slots still referencing the old one are unaffected."
            after={newScale}
            footer={
              otherRefCount > 0 ? (
                <>
                  <span className="text-stone-500">
                    Existing {primitive.id} is still referenced in{' '}
                  </span>
                  <span className="tabular-nums text-stone-800">
                    {otherRefCount}
                  </span>{' '}
                  <span className="text-stone-500">place{otherRefCount === 1 ? '' : 's'}</span>
                </>
              ) : (
                <span className="text-amber-700">
                  Existing {primitive.id} will become an orphan primitive
                </span>
              )
            }
            onClick={() => resolve('replace')}
          />
        </div>

        <footer className="flex items-center justify-between px-6 py-4 border-t border-stone-100">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            A · Adjust · Enter &nbsp; B · Replace &nbsp; Esc · Cancel
          </div>
          <button
            type="button"
            onClick={cancel}
            className="text-xs px-3 py-1.5 rounded border border-stone-200 text-stone-600 hover:border-stone-500 hover:text-stone-900"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}

type OptionCardProps = {
  badge: string;
  title: string;
  description: string;
  before?: Record<ShadeIndex, OKLCH>;
  after: Record<ShadeIndex, OKLCH>;
  footer: React.ReactNode;
  onClick: () => void;
};

function OptionCard({
  badge,
  title,
  description,
  before,
  after,
  footer,
  onClick,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left flex flex-col gap-3 p-4 rounded-lg border border-stone-200 hover:border-stone-700 hover:-translate-y-px transition bg-white"
    >
      <div className="flex items-start gap-2">
        <span className="flex-none w-5 h-5 rounded bg-stone-900 text-cream text-[10px] font-mono inline-flex items-center justify-center">
          {badge}
        </span>
        <div className="min-w-0">
          <div className="font-mono text-sm text-stone-900">{title}</div>
        </div>
      </div>
      <p className="text-xs text-stone-600 leading-relaxed">{description}</p>
      <div className="space-y-1">
        {before && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              before
            </div>
            <ScaleStrip scale={before} />
          </div>
        )}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-1">
            {before ? 'after' : 'new scale'}
          </div>
          <ScaleStrip scale={after} />
        </div>
      </div>
      <div className="text-xs font-mono pt-1 border-t border-stone-100">
        {footer}
      </div>
    </button>
  );
}

function ScaleStrip({ scale }: { scale: Record<ShadeIndex, OKLCH> }) {
  return (
    <div className="flex h-5 rounded overflow-hidden ring-1 ring-stone-200">
      {SHADE_INDICES.map((shade) => {
        const c = scale[shade];
        const hex = oklchToHex(c.L, c.C, c.H);
        return (
          <span
            key={shade}
            className="flex-1"
            style={{ backgroundColor: hex }}
            title={`${shade} · ${hex}`}
          />
        );
      })}
    </div>
  );
}
