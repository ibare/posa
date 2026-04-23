import { useMemo, useState } from 'react';
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
          No primitives have been created yet
        </div>
        <p className="text-sm text-stone-500 mt-2">
          Pick a color for a symbol, attribute, or slot in Exploration and the primitive will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="px-1 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            Primitive Atlas
          </div>
          <div className="font-display italic text-2xl text-stone-900 mt-0.5">
            {primitives.length} primitive{primitives.length === 1 ? '' : 's'} total, {usedCount} in use, {orphanIds.size} orphan{orphanIds.size === 1 ? '' : 's'}
          </div>
          <div className="text-xs text-stone-500 mt-1 font-mono tabular-nums">
            {hueSpread.toFixed(0)}° spread across {families.size} hue famil
            {families.size === 1 ? 'y' : 'ies'}
          </div>
        </div>
        {mergeSource && (
          <div className="text-xs text-stone-600 font-mono">
            Selecting merge target · source: <b>{mergeSource}</b>
            <button
              type="button"
              onClick={() => setMergeSource(null)}
              className="ml-2 underline underline-offset-2 text-stone-500 hover:text-stone-900"
            >
              Cancel
            </button>
          </div>
        )}
      </header>

      <div className="space-y-8">
        {grouped.map(({ family, primitives: list }) => (
          <section key={family}>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">
              {family} ({list.length} variant{list.length === 1 ? '' : 's'})
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
