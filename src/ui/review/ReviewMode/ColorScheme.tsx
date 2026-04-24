import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { oklchToHex } from '../../../color/oklch';
import {
  computeAttributeUsage,
  computePrimitiveUsage,
  computeSymbolUsage,
  type AttributeUsage,
  type PrimitiveReferenceBucket,
  type SymbolUsage,
} from '../../../ir/analysis';
import {
  SHADE_INDICES,
  type IR,
  type ShadeIndex,
} from '../../../ir/types';
import { useActiveComponentDefs } from '../../../store/hooks';
import { useCopyHex } from '../../shared/toast';
import { SectionCard, SubCard } from './shared';

type Props = { ir: IR };

export function ColorScheme({ ir }: Props) {
  const { t } = useTranslation('review');
  const components = useActiveComponentDefs();
  const primitiveBuckets = useMemo(() => computePrimitiveUsage(ir), [ir]);
  const symbols = useMemo(
    () => computeSymbolUsage(ir, components),
    [ir, components],
  );
  const attributes = useMemo(
    () => computeAttributeUsage(ir, components),
    [ir, components],
  );

  // `computePrimitiveUsage`는 참조 많은 순. 참조 0인 primitive도 IR 순서대로 붙여 보인다.
  const ordered = useMemo(() => {
    const byId = new Map(primitiveBuckets.map((b) => [b.primitiveId, b]));
    const out: Array<{
      primitiveId: string;
      bucket: PrimitiveReferenceBucket | null;
    }> = [];
    for (const id of Object.keys(ir.primitives)) {
      out.push({ primitiveId: id, bucket: byId.get(id) ?? null });
    }
    return out;
  }, [primitiveBuckets, ir.primitives]);
  const familyCount = Object.keys(ir.primitives).length;

  return (
    <SectionCard
      eyebrow={t('scheme.eyebrow')}
      title={t('scheme.title')}
      description={t('scheme.description')}
    >
      <div className="space-y-5">
        <SubCard
          title={t('scheme.primitives')}
          hint={t('scheme.familyCount', { count: familyCount })}
        >
          <div className="space-y-4">
            {ordered.map(({ primitiveId, bucket }) => (
              <PrimitiveRow
                key={primitiveId}
                primitiveId={primitiveId}
                scale={ir.primitives[primitiveId].scale}
                usedShades={new Set(bucket?.usedShades ?? [])}
              />
            ))}
          </div>
        </SubCard>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SubCard
            title={t('scheme.symbols')}
            hint={t('scheme.assigned', { count: symbols.length })}
          >
            {symbols.length === 0 ? (
              <EmptyHint text={t('scheme.noSymbols')} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {symbols.map((s) => (
                  <SymbolChip key={s.symbolId} usage={s} ir={ir} />
                ))}
              </div>
            )}
          </SubCard>

          <SubCard
            title={t('scheme.attributes')}
            hint={t('scheme.assigned', { count: attributes.length })}
          >
            {attributes.length === 0 ? (
              <EmptyHint text={t('scheme.noAttributes')} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {attributes.map((a) => (
                  <AttributeChip key={a.attributeId} usage={a} ir={ir} />
                ))}
              </div>
            )}
          </SubCard>
        </div>
      </div>
    </SectionCard>
  );
}

function PrimitiveRow({
  primitiveId,
  scale,
  usedShades,
}: {
  primitiveId: string;
  scale: Record<ShadeIndex, { L: number; C: number; H: number }>;
  usedShades: Set<ShadeIndex>;
}) {
  const { t } = useTranslation('review');
  const copyHex = useCopyHex();
  const familyName = primitiveId.split('-')[0];
  const displayName =
    familyName.charAt(0).toUpperCase() + familyName.slice(1);
  const usedCount = usedShades.size;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display italic text-lg text-stone-900">
            {displayName}
          </span>
          <span className="text-stone-300">·</span>
          <span className="font-mono text-[11px] text-stone-500">
            {t('scheme.shadesInUse', { count: usedCount })}
          </span>
        </div>
        <span className="font-mono text-[11px] text-stone-400">
          {primitiveId}
        </span>
      </div>
      <div className="grid grid-cols-11 gap-[3px]">
        {SHADE_INDICES.map((shade) => {
          const color = scale[shade];
          const used = usedShades.has(shade);
          const hex = oklchToHex(color.L, color.C, color.H);
          const title = used
            ? t('scheme.swatchTitleUsed', {
                family: displayName,
                shade,
                hex,
              })
            : t('scheme.swatchTitleUnused', {
                family: displayName,
                shade,
                hex,
              });
          return (
            <div key={shade} className="flex flex-col items-stretch">
              <button
                type="button"
                onClick={() => copyHex(hex)}
                className={[
                  'relative rounded-[3px] cursor-copy focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900',
                  used ? '' : 'mt-2',
                ].join(' ')}
                style={{ height: used ? 56 : 40 }}
                title={title}
                aria-label={`${displayName} ${shade} ${hex}`}
              >
                <div
                  className="h-full w-full rounded-[3px]"
                  style={{
                    background: hex,
                    opacity: used ? 1 : 0.35,
                  }}
                />
                {used && (
                  <div className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-black/60" />
                )}
              </button>
              <div
                className={[
                  'mt-1 text-center font-mono text-[9px] tabular-nums',
                  used ? 'font-semibold text-stone-900' : 'text-stone-300',
                ].join(' ')}
              >
                {shade}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SymbolChip({ usage, ir }: { usage: SymbolUsage; ir: IR }) {
  const assignment = ir.symbols[usage.symbolId];
  if (!assignment) return null;
  const hex = oklchToHex(usage.color.L, usage.color.C, usage.color.H);
  const refLabel =
    assignment.kind === 'primitive'
      ? `${assignment.primitive}·${assignment.shade}`
      : 'literal';
  return (
    <div className="overflow-hidden rounded-md border border-stone-200">
      <div className="h-14 w-full" style={{ background: hex }} />
      <div className="px-2.5 py-1.5">
        <div className="font-mono text-[12px] text-stone-900">
          {usage.symbolId}
        </div>
        <div className="font-mono text-[10px] text-stone-500">{refLabel}</div>
        <div className="font-mono text-[10px] text-stone-400">{hex}</div>
      </div>
    </div>
  );
}

function AttributeChip({
  usage,
  ir,
}: {
  usage: AttributeUsage;
  ir: IR;
}) {
  const assignment = ir.attributes[usage.attributeId];
  if (!assignment || !usage.color) return null;
  const hex = oklchToHex(usage.color.L, usage.color.C, usage.color.H);
  const refLabel =
    assignment.kind === 'primitive'
      ? `${assignment.primitive}·${assignment.shade}`
      : assignment.name;
  return (
    <div className="overflow-hidden rounded-md border border-stone-200">
      <div className="h-14 w-full" style={{ background: hex }} />
      <div className="px-2.5 py-1.5">
        <div className="font-mono text-[12px] text-stone-900">
          {usage.attributeId}
        </div>
        <div className="font-mono text-[10px] text-stone-500">{refLabel}</div>
        <div className="font-mono text-[10px] text-stone-400">{hex}</div>
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-stone-300 px-3 py-4 text-center text-[12px] italic text-stone-400">
      {text}
    </div>
  );
}
