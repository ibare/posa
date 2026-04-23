import { useMemo } from 'react';
import { oklchToHex } from '../../../color/oklch';
import type { ContrastVerdict } from '../../../color/contrast';
import {
  computeContrastPairs,
  computePrimitiveUsage,
  findHeadsUpItems,
  type ContrastPair,
  type HeadsUpItem,
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
  const components = useActiveComponentDefs();
  const activeSymbolIds = useActiveSymbolIds();
  const activeAttributeIds = useActiveAttributeIds();

  const primitiveUsage = useMemo(() => computePrimitiveUsage(ir), [ir]);
  const contrastPairs = useMemo(
    () => computeContrastPairs(ir, components),
    [ir, components],
  );
  const headsUp = useMemo(
    () => findHeadsUpItems(ir, components),
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
      eyebrow="System health"
      title="Before you ship it"
      description="A quick sanity check on balance, readability, and anything that might surprise you later."
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
        <HeadsUp items={headsUp} />
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
  const totalRefs = primitiveUsage.reduce((sum, b) => sum + b.totalRefs, 0);
  const top = primitiveUsage[0];
  const topShare = top && totalRefs > 0 ? top.totalRefs / totalRefs : 0;
  const primitiveIds = Object.keys(ir.primitives);

  let leadBadge: { label: string; tone: 'neutral' | 'warn' } | null = null;
  if (top && totalRefs > 0) {
    const pct = Math.round(topShare * 100);
    if (topShare >= 0.6) {
      leadBadge = {
        label: `${top.primitiveId} carries ${pct}% of references — your palette leans heavily on one family`,
        tone: 'warn',
      };
    } else {
      leadBadge = {
        label: `${top.primitiveId} leads at ${pct}% of references`,
        tone: 'neutral',
      };
    }
  }

  return (
    <SubCard title="Distribution" hint="Where your references land">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <StatTile
            label="Primitives"
            value={`${primitiveIds.length}`}
            sub={`${totalRefs} total refs`}
          />
          <StatTile
            label="Symbols"
            value={`${assignedSymbols}/${totalSymbols || 0}`}
            sub="assigned"
          />
          <StatTile
            label="Attributes"
            value={`${assignedAttributes}/${totalAttributes || 0}`}
            sub="assigned"
          />
        </div>

        {primitiveUsage.length === 0 ? (
          <div className="rounded-md border border-dashed border-stone-300 px-3 py-4 text-center text-[12px] italic text-stone-400">
            Nothing references the palette yet.
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
          {bucket.usedShades.length}/{SHADE_INDICES.length} shades
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
  { dot: string; badge: string; label: string }
> = {
  excellent: {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-700',
    label: 'Excellent',
  },
  good: {
    dot: 'bg-lime-500',
    badge: 'bg-lime-50 text-lime-700',
    label: 'Good',
  },
  'large-only': {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700',
    label: 'Large only',
  },
  poor: {
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700',
    label: 'Hard to read',
  },
};

function Readability({ pairs }: { pairs: ContrastPair[] }) {
  const total = pairs.length;
  const counts: Record<ContrastVerdict, number> = {
    excellent: 0,
    good: 0,
    'large-only': 0,
    poor: 0,
  };
  for (const p of pairs) counts[p.verdict]++;

  return (
    <SubCard
      title="Readability"
      hint={`${total} text/surface ${total === 1 ? 'pair' : 'pairs'} checked (WCAG)`}
    >
      {total === 0 ? (
        <div className="rounded-md border border-dashed border-stone-300 px-3 py-4 text-center text-[12px] italic text-stone-400">
          No text/surface pairs to grade yet.
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
            {pairs.slice(0, 20).map((p) => (
              <PairRow key={`${p.fgSlotId}|${p.bgSlotId}`} pair={p} />
            ))}
            {pairs.length > 20 && (
              <div className="pt-1 text-center font-mono text-[10px] text-stone-400">
                + {pairs.length - 20} more pairs not shown
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
  const s = VERDICT_STYLE[verdict];
  const range =
    verdict === 'excellent'
      ? '7.0+'
      : verdict === 'good'
        ? '4.5–6.9'
        : verdict === 'large-only'
          ? '3.0–4.4'
          : '<3.0';
  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        <span className="text-[11px] text-stone-700">{s.label}</span>
      </div>
      <div className="mt-0.5 font-mono text-xl tabular-nums text-stone-900">
        {count}
      </div>
      <div className="font-mono text-[10px] text-stone-400">{range}</div>
    </div>
  );
}

function PairRow({ pair }: { pair: ContrastPair }) {
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
        Sample
      </div>
      <div className="min-w-0 flex-1 truncate font-mono text-[11px] text-stone-600">
        <span className="text-stone-500">{scope}</span>
        <span className="text-stone-300"> · </span>
        <span className="text-stone-900">{pair.fgAttributeId}</span>
        <span className="text-stone-400"> on </span>
        <span className="text-stone-900">{pair.bgAttributeId}</span>
      </div>
      <div
        className={`flex-none rounded px-1.5 py-0.5 font-mono text-[10px] ${s.badge}`}
      >
        {s.label}
      </div>
      <div className="w-10 flex-none text-right font-mono text-[11px] tabular-nums text-stone-400">
        {pair.ratio.toFixed(1)}
      </div>
    </div>
  );
}

// ───── Heads up ─────

function HeadsUp({ items }: { items: HeadsUpItem[] }) {
  return (
    <SubCard
      title="Heads up"
      hint={items.length === 0 ? 'All clear' : `${items.length} noted`}
    >
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-[12px] text-green-800">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Nothing stands out. Your system looks consistent.
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <HeadsUpRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </SubCard>
  );
}

function HeadsUpRow({ item }: { item: HeadsUpItem }) {
  const isWarn = item.severity === 'warn';
  return (
    <div
      className={[
        'rounded-md border px-3 py-2',
        isWarn
          ? 'border-amber-200 bg-amber-50'
          : 'border-stone-200 bg-stone-50',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <span
          className={[
            'mt-1 h-2 w-2 flex-none rounded-full',
            isWarn ? 'bg-amber-500' : 'bg-stone-400',
          ].join(' ')}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-stone-900">
            {item.title}
          </div>
          <div className="mt-0.5 text-[11px] text-stone-600">
            {item.detail}
          </div>
        </div>
      </div>
    </div>
  );
}
