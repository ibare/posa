import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  countPrimitiveReferences,
  findOrphanPrimitives,
  hueFamily,
} from '../../color/primitive-ops';
import type { PrimitiveScale } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { PrimitiveCard } from './PrimitiveCard';

type FamilyBucket = {
  family: string;
  primitives: PrimitiveScale[];
};

export function PrimitiveAtlas() {
  const ir = usePosaStore((s) => s.ir);
  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const { t } = useTranslation(['primitives', 'common']);

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
    <div className="mx-auto max-w-5xl space-y-6">
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
        {mergeSource && (
          <div className="text-xs text-stone-600 font-mono">
            {t('atlas.mergeTarget', { name: mergeSource })}
            <button
              type="button"
              onClick={() => setMergeSource(null)}
              className="ml-2 underline underline-offset-2 text-stone-500 hover:text-stone-900"
            >
              {t('common:action.cancel')}
            </button>
          </div>
        )}
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
                  refCount={countPrimitiveReferences(ir, p.id)}
                  isOrphan={orphanIds.has(p.id)}
                  mergeSource={mergeSource}
                  onSelectAsMergeSource={() => setMergeSource(p.id)}
                  onCancelMerge={() => setMergeSource(null)}
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
