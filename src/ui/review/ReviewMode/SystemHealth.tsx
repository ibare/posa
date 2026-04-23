import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { oklchToHex } from '../../../color/oklch';
import type { ContrastVerdict } from '../../../color/contrast';
import {
  computeContrastPairs,
  computePrimitiveUsage,
  type ContrastPair,
  type PrimitiveReferenceBucket,
} from '../../../ir/analysis';
import { SHADE_INDICES, type IR } from '../../../ir/types';
import {
  useActiveAttributeIds,
  useActiveComponentDefs,
  useActiveSymbolIds,
} from '../../../store/hooks';
import { SectionCard, SubCard } from './shared';

type Props = { ir: IR };

export function SystemHealth({ ir }: Props) {
  const { t } = useTranslation('review');
  const components = useActiveComponentDefs();
  const activeSymbolIds = useActiveSymbolIds();
  const activeAttributeIds = useActiveAttributeIds();

  const primitiveUsage = useMemo(() => computePrimitiveUsage(ir), [ir]);
  const contrastPairs = useMemo(
    () => computeContrastPairs(ir, components),
    [ir, components],
  );

  const assignedSymbols = activeSymbolIds.filter(
    (id) => ir.symbols[id] != null,
  ).length;
  const assignedAttributes = activeAttributeIds.filter(
    (id) => ir.attributes[id] != null,
  ).length;

  return (
    <SectionCard
      eyebrow={t('health.eyebrow')}
      title={t('health.title')}
      description={t('health.description')}
    >
      <div className="space-y-5">
        <Distribution
          ir={ir}
          primitiveUsage={primitiveUsage}
          totalSymbols={activeSymbolIds.length}
          assignedSymbols={assignedSymbols}
          totalAttributes={activeAttributeIds.length}
          assignedAttributes={assignedAttributes}
        />
        <Readability pairs={contrastPairs} />
      </div>
    </SectionCard>
  );
}

// ───── Distribution ─────

function Distribution({
  ir,
  primitiveUsage,
  totalSymbols,
  assignedSymbols,
  totalAttributes,
  assignedAttributes,
}: {
  ir: IR;
  primitiveUsage: PrimitiveReferenceBucket[];
  totalSymbols: number;
  assignedSymbols: number;
  totalAttributes: number;
  assignedAttributes: number;
}) {
  const { t } = useTranslation('review');
  const totalRefs = primitiveUsage.reduce((sum, b) => sum + b.totalRefs, 0);
  const top = primitiveUsage[0];
  const topShare = top && totalRefs > 0 ? top.totalRefs / totalRefs : 0;
  const primitiveIds = Object.keys(ir.primitives);

  let leadBadge: { label: string; tone: 'neutral' | 'warn' } | null = null;
  if (top && totalRefs > 0) {
    const pct = Math.round(topShare * 100);
    if (topShare >= 0.6) {
      leadBadge = {
        label: t('health.distribution.leadWarn', { id: top.primitiveId, pct }),
        tone: 'warn',
      };
    } else {
      leadBadge = {
        label: t('health.distribution.leadNeutral', {
          id: top.primitiveId,
          pct,
        }),
        tone: 'neutral',
      };
    }
  }

  return (
    <SubCard
      title={t('health.distribution.title')}
      hint={t('health.distribution.hint')}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <StatTile
            label={t('health.distribution.stats.primitives')}
            value={`${primitiveIds.length}`}
            sub={t('health.distribution.stats.totalRefs', { count: totalRefs })}
          />
          <StatTile
            label={t('health.distribution.stats.symbols')}
            value={`${assignedSymbols}/${totalSymbols || 0}`}
            sub={t('health.distribution.stats.assigned')}
          />
          <StatTile
            label={t('health.distribution.stats.attributes')}
            value={`${assignedAttributes}/${totalAttributes || 0}`}
            sub={t('health.distribution.stats.assigned')}
          />
        </div>

        {primitiveUsage.length === 0 ? (
          <div className="rounded-md border border-dashed border-stone-300 px-3 py-4 text-center text-[12px] italic text-stone-400">
            {t('health.distribution.empty')}
          </div>
        ) : (
          <div className="space-y-1.5">
            {primitiveUsage.map((bucket) => (
              <DistributionRow
                key={bucket.primitiveId}
                bucket={bucket}
                totalRefs={totalRefs}
              />
            ))}
          </div>
        )}

        {leadBadge && (
          <div
            className={[
              'rounded-md border px-3 py-2 text-[12px]',
              leadBadge.tone === 'warn'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-stone-200 bg-stone-50 text-stone-700',
            ].join(' ')}
          >
            {leadBadge.label}
          </div>
        )}
      </div>
    </SubCard>
  );
}

function DistributionRow({
  bucket,
  totalRefs,
}: {
  bucket: PrimitiveReferenceBucket;
  totalRefs: number;
}) {
  const { t } = useTranslation('review');
  const pct = totalRefs > 0 ? bucket.totalRefs / totalRefs : 0;
  const hex = oklchToHex(
    bucket.representativeColor.L,
    bucket.representativeColor.C,
    bucket.representativeColor.H,
  );
  const shadeLabel =
    bucket.usedShades.length === 0
      ? '—'
      : bucket.usedShades.join(' · ');
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-5 w-5 flex-none rounded-sm border border-stone-200"
        style={{ background: hex }}
      />
      <div className="min-w-0 flex-none" style={{ width: 110 }}>
        <div className="truncate font-mono text-[11px] text-stone-900">
          {bucket.primitiveId}
        </div>
        <div className="truncate font-mono text-[9px] text-stone-400">
          {t('health.distribution.shadesFraction', {
            used: bucket.usedShades.length,
            total: SHADE_INDICES.length,
          })}
        </div>
      </div>
      <div className="relative h-3 flex-1 rounded-full bg-stone-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${Math.max(pct * 100, 2)}%`,
            background: hex,
            opacity: 0.75,
          }}
        />
      </div>
      <div className="w-12 flex-none text-right font-mono text-[11px] tabular-nums text-stone-700">
        {bucket.totalRefs}
      </div>
      <div
        className="hidden w-40 flex-none truncate font-mono text-[10px] text-stone-400 sm:block"
        title={shadeLabel}
      >
        {shadeLabel}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50/40 px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
        {label}
      </div>
      <div className="font-mono text-lg tabular-nums text-stone-900">
        {value}
      </div>
      <div className="font-mono text-[10px] text-stone-500">{sub}</div>
    </div>
  );
}

// ───── Readability ─────

const VERDICT_STYLE: Record<
  ContrastVerdict,
  { dot: string; badge: string }
> = {
  excellent: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700' },
  good: { dot: 'bg-lime-500', badge: 'bg-lime-50 text-lime-700' },
  'large-only': { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
  poor: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700' },
};

const VERDICT_RANGE: Record<ContrastVerdict, string> = {
  excellent: '7.0+',
  good: '4.5–6.9',
  'large-only': '3.0–4.4',
  poor: '<3.0',
};

function Readability({ pairs }: { pairs: ContrastPair[] }) {
  const { t } = useTranslation('review');
  const total = pairs.length;
  const counts: Record<ContrastVerdict, number> = {
    excellent: 0,
    good: 0,
    'large-only': 0,
    poor: 0,
  };
  for (const p of pairs) counts[p.verdict]++;
  const visiblePairs = pairs.slice(0, 20);

  return (
    <SubCard
      title={t('health.readability.title')}
      hint={t('health.readability.pairCount', { count: total })}
    >
      {total === 0 ? (
        <div className="rounded-md border border-dashed border-stone-300 px-3 py-4 text-center text-[12px] italic text-stone-400">
          {t('health.readability.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['excellent', 'good', 'large-only', 'poor'] as ContrastVerdict[]).map(
              (v) => (
                <VerdictCard key={v} verdict={v} count={counts[v]} />
              ),
            )}
          </div>
          <div className="space-y-1">
            {visiblePairs.map((p) => (
              <PairRow key={`${p.fgSlotId}|${p.bgSlotId}`} pair={p} />
            ))}
            {pairs.length > visiblePairs.length && (
              <div className="pt-1 text-center font-mono text-[10px] text-stone-400">
                {t('health.readability.more', {
                  count: pairs.length - visiblePairs.length,
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </SubCard>
  );
}

function VerdictCard({
  verdict,
  count,
}: {
  verdict: ContrastVerdict;
  count: number;
}) {
  const { t } = useTranslation('review');
  const s = VERDICT_STYLE[verdict];
  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        <span className="text-[11px] text-stone-700">
          {t(`health.readability.verdict.${verdict}`)}
        </span>
      </div>
      <div className="mt-0.5 font-mono text-xl tabular-nums text-stone-900">
        {count}
      </div>
      <div className="font-mono text-[10px] text-stone-400">
        {VERDICT_RANGE[verdict]}
      </div>
    </div>
  );
}

function PairRow({ pair }: { pair: ContrastPair }) {
  const { t } = useTranslation('review');
  const s = VERDICT_STYLE[pair.verdict];
  const fgHex = oklchToHex(pair.fgColor.L, pair.fgColor.C, pair.fgColor.H);
  const bgHex = oklchToHex(pair.bgColor.L, pair.bgColor.C, pair.bgColor.H);
  const scope = pair.variantId
    ? `${pair.componentId}.${pair.variantId}`
    : pair.componentId;
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-stone-50">
      <div
        className="flex-none rounded px-2.5 py-1 text-[11px]"
        style={{
          background: bgHex,
          color: fgHex,
          border: `1px solid ${fgHex}22`,
        }}
      >
        {t('health.readability.sample')}
      </div>
      <div className="min-w-0 flex-1 truncate font-mono text-[11px] text-stone-600">
        <span className="text-stone-500">{scope}</span>
        <span className="text-stone-300"> · </span>
        <span className="text-stone-900">{pair.fgAttributeId}</span>
        <span className="text-stone-400">
          {' '}
          {t('health.readability.on')}{' '}
        </span>
        <span className="text-stone-900">{pair.bgAttributeId}</span>
      </div>
      <div
        className={`flex-none rounded px-1.5 py-0.5 font-mono text-[10px] ${s.badge}`}
      >
        {t(`health.readability.verdict.${pair.verdict}`)}
      </div>
      <div className="w-10 flex-none text-right font-mono text-[11px] tabular-nums text-stone-400">
        {pair.ratio.toFixed(1)}
      </div>
    </div>
  );
}

