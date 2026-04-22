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
            이 색은 기존 {currentFamily} 팔레트에서 벗어나 있습니다
          </h2>
          <p className="text-sm text-stone-500 mt-1">어떻게 처리할까요?</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-6 pb-4">
          <OptionCard
            badge="A"
            title={`Adjust ${currentFamily}`}
            description={`기존 ${primitive.id}의 anchor를 새 색으로 조정합니다. 같은 scale의 다른 shade들도 함께 재계산됩니다. 이 primitive를 참조하는 다른 slot들도 영향을 받습니다.`}
            before={primitive.scale}
            after={newScale}
            footer={
              <>
                <span className="text-stone-500">참조 중인 slot</span>{' '}
                <span className="tabular-nums text-stone-800">{refCount}</span>
              </>
            }
            onClick={() => resolve('adjust')}
          />
          <OptionCard
            badge="B"
            title={`Replace with new ${family}`}
            description="새 primitive를 생성합니다. 현재 role은 새 primitive를 참조하고, 기존 primitive는 이전 상태 그대로 보존됩니다. 다른 slot의 참조는 영향받지 않습니다."
            after={newScale}
            footer={
              otherRefCount > 0 ? (
                <>
                  <span className="text-stone-500">
                    기존 {primitive.id}는 여전히{' '}
                  </span>
                  <span className="tabular-nums text-stone-800">
                    {otherRefCount}
                  </span>{' '}
                  <span className="text-stone-500">곳에서 참조됨</span>
                </>
              ) : (
                <span className="text-amber-700">
                  기존 {primitive.id}는 고아 primitive가 됩니다
                </span>
              )
            }
            onClick={() => resolve('replace')}
          />
        </div>

        <footer className="flex items-center justify-between px-6 py-4 border-t border-stone-100">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            A · Adjust · Enter &nbsp; B · Replace &nbsp; Esc · 취소
          </div>
          <button
            type="button"
            onClick={cancel}
            className="text-xs px-3 py-1.5 rounded border border-stone-200 text-stone-600 hover:border-stone-500 hover:text-stone-900"
          >
            취소
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
