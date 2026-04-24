import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { effectivePrimitiveReferenceCount } from '../../color/atlas-ops';
import { findOrphanPrimitives, hueFamily } from '../../color/primitive-ops';
import type { PrimitiveScale } from '../../ir/types';
import { PreviewPanel } from '../../preview/PreviewPanel';
import { useActiveComponentDefs } from '../../store/hooks';
import { usePosaStore } from '../../store/posa-store';
import { PrimitiveCard } from './PrimitiveCard';

type FamilyBucket = {
  family: string;
  primitives: PrimitiveScale[];
};

export function PrimitiveAtlas() {
  const ir = usePosaStore((s) => s.ir);
  const atlasSelection = usePosaStore((s) => s.atlasSelection);
  const clearAtlasSelection = usePosaStore((s) => s.clearAtlasSelection);
  const previewPanelWidth = usePosaStore((s) => s.previewPanelWidth);
  const components = useActiveComponentDefs();
  const { t } = useTranslation('primitives');

  // 선택 상태에서 atlas cell·preview overlay 바깥을 클릭하면 해제.
  // 다른 cell을 누르면 그 cell의 pointerdown에서 stopPropagation + selectAtlasShade가
  // 이어서 호출되므로 "다른 곳 선택"도 자연스럽게 처리된다.
  useEffect(() => {
    if (!atlasSelection) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-atlas-shade]')) return;
      if (target.closest('[data-atlas-preview-overlay]')) return;
      clearAtlasSelection();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [atlasSelection, clearAtlasSelection]);

  const primitives = useMemo(
    () =>
      Object.values(ir.primitives).sort((a, b) => a.createdAt - b.createdAt),
    [ir.primitives],
  );

  const grouped = useMemo<FamilyBucket[]>(() => {
    const map = new Map<string, PrimitiveScale[]>();
    for (const p of primitives) {
      const family = hueFamily(p.anchor);
      const bucket = map.get(family) ?? [];
      bucket.push(p);
      map.set(family, bucket);
    }
    return Array.from(map.entries())
      .map(([family, list]) => ({ family, primitives: list }))
      .sort((a, b) => a.family.localeCompare(b.family));
  }, [primitives]);

  const orphanIds = useMemo(() => new Set(findOrphanPrimitives(ir)), [ir]);
  const usedCount = primitives.length - orphanIds.size;
  const effectiveRefCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of primitives) {
      map.set(p.id, effectivePrimitiveReferenceCount(ir, components, p.id));
    }
    return map;
  }, [ir, components, primitives]);

  const families = new Set(primitives.map((p) => hueFamily(p.anchor)));
  const hueSpread = computeHueSpread(primitives);

  if (primitives.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center border border-dashed border-stone-300 rounded-lg">
        <div className="font-display italic text-xl text-stone-700">
          {t('atlas.empty')}
        </div>
        <p className="text-sm text-stone-500 mt-2">{t('atlas.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 relative">
      {atlasSelection && (
        <div
          data-atlas-preview-overlay
          className="fixed right-4 top-20 z-40 max-w-[calc(100vw-2rem)]"
          style={{ width: previewPanelWidth }}
        >
          <PreviewPanel />
        </div>
      )}
      <header className="px-1 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            {t('atlas.title')}
          </div>
          <div className="font-display italic text-2xl text-stone-900 mt-0.5">
            {t('atlas.primitiveCount', { count: primitives.length })}{' '}
            {t('atlas.total')}, {usedCount} {t('atlas.inUse')},{' '}
            {t('atlas.orphanCount', { count: orphanIds.size })}
          </div>
          <div className="text-xs text-stone-500 mt-1 font-mono tabular-nums">
            {hueSpread.toFixed(0)}° {t('atlas.spreadAcross')}{' '}
            {t('atlas.hueFamilyCount', { count: families.size })}
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {grouped.map(({ family, primitives: list }) => (
          <section key={family}>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">
              {family} ({t('atlas.variantCount', { count: list.length })})
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {list.map((p) => (
                <PrimitiveCard
                  key={p.id}
                  primitive={p}
                  refCount={effectiveRefCounts.get(p.id) ?? 0}
                  isOrphan={orphanIds.has(p.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function computeHueSpread(primitives: PrimitiveScale[]): number {
  const chromaticHues = primitives
    .filter((p) => p.anchor.C >= 0.03)
    .map((p) => ((p.anchor.H % 360) + 360) % 360)
    .sort((a, b) => a - b);
  if (chromaticHues.length <= 1) return 0;
  // 이웃 간 gap의 최댓값을 찾고, 그 gap을 뺀 나머지 360°가 spread.
  let maxGap = 0;
  for (let i = 0; i < chromaticHues.length; i++) {
    const next = chromaticHues[(i + 1) % chromaticHues.length];
    const gap = (next - chromaticHues[i] + 360) % 360;
    if (gap > maxGap) maxGap = gap;
  }
  return 360 - maxGap;
}
