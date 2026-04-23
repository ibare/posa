import { useMemo, useState } from 'react';
import { oklchToHex } from '../../color/oklch';
import { computePaletteRibbon } from '../../ir/selectors';
import { useActiveComponentDefs } from '../../store/hooks';
import type { IR } from '../../ir/types';

type Props = {
  ir: IR;
  /** Track의 전체 폭(px). 전체 slot 수를 이 폭으로 환산. */
  width?: number;
};

const TRACK_HEIGHT = 8;

// 무채색 primitive는 실제 비율보다 좁게 표시하고, 남는 폭을 유채색들에 균등 배분한다.
// 목적: 팔레트의 "톤" 인지가 흑백에 묻히지 않도록.
const NEUTRAL_CHROMA_THRESHOLD = 0.03;
const NEUTRAL_SQUASH = 0.3;

export function PaletteRibbon({ ir, width = 200 }: Props) {
  const components = useActiveComponentDefs();
  const { total, filled, segments } = useMemo(
    () => computePaletteRibbon(components, ir),
    [components, ir],
  );
  const [hovered, setHovered] = useState<string | null>(null);

  const weightedSegments = useMemo(() => {
    const decorated = segments.map((s) => ({
      ...s,
      isNeutral: s.color.C < NEUTRAL_CHROMA_THRESHOLD,
    }));
    const chromaticCount = decorated.filter((s) => !s.isNeutral).length;
    const neutralTotal = decorated
      .filter((s) => s.isNeutral)
      .reduce((acc, s) => acc + s.count, 0);
    // 유채색이 하나도 없으면 축약할 이유가 없다 (배분 대상 없음).
    const squash = chromaticCount > 0 ? NEUTRAL_SQUASH : 1;
    const bonusPerChromatic =
      chromaticCount > 0 ? (neutralTotal * (1 - squash)) / chromaticCount : 0;
    return decorated.map((s) => ({
      ...s,
      displayWeight: s.isNeutral ? s.count * squash : s.count + bonusPerChromatic,
    }));
  }, [segments]);

  const totalWeight =
    weightedSegments.reduce((acc, s) => acc + s.displayWeight, 0) || 1;

  const isEmpty = filled === 0;
  const filledRatio = total > 0 ? filled / total : 0;
  // 1 slot이라도 있으면 최소 가시 폭 보장 (2px 이상).
  const minFilledPx = filled > 0 ? 2 : 0;
  const filledPx = Math.max(filledRatio * width, minFilledPx);

  const hoveredSeg = hovered
    ? segments.find((s) => s.primitiveId === hovered) ?? null
    : null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div
          className="relative rounded-full overflow-visible"
          style={{ width, height: TRACK_HEIGHT }}
        >
          <div
            className={`absolute inset-0 rounded-full ring-1 ring-black/5 ${
              isEmpty
                ? 'border border-dashed border-stone-300'
                : 'bg-stone-100'
            }`}
          />
          {!isEmpty && (
            <div
              className="absolute top-0 bottom-0 left-0 flex overflow-hidden rounded-full"
              style={{ width: filledPx }}
            >
              {weightedSegments.map((seg) => {
                const hex = oklchToHex(seg.color.L, seg.color.C, seg.color.H);
                const segRatio = seg.displayWeight / totalWeight;
                const isHover = hovered === seg.primitiveId;
                const isDim = hovered !== null && !isHover;
                return (
                  <div
                    key={seg.primitiveId}
                    role="presentation"
                    onMouseEnter={() => setHovered(seg.primitiveId)}
                    onMouseLeave={() => setHovered(null)}
                    className="h-full transition-all duration-150 ease-out"
                    style={{
                      flex: `${segRatio} 1 0`,
                      backgroundColor: hex,
                      opacity: isDim ? 0.35 : 1,
                      transform: isHover ? 'scaleY(1.6)' : 'scaleY(1)',
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
        <span className="font-mono text-xs tabular-nums">
          <span className={isEmpty ? 'text-stone-400' : 'text-stone-900'}>
            {filled}
          </span>
          <span className="text-stone-400"> / </span>
          <span className="text-stone-500">{total}</span>
        </span>
      </div>
      {hoveredSeg && (
        <div className="absolute top-full right-0 mt-1.5 z-20 whitespace-nowrap rounded-md bg-stone-900/95 text-cream px-2 py-1 text-[10px] font-mono tabular-nums shadow-md">
          <span className="text-cream">{hoveredSeg.primitiveId}</span>
          <span className="mx-1.5 text-stone-500">·</span>
          <span>{hoveredSeg.count}</span>
          <span className="ml-0.5 text-stone-400">slots</span>
          <span className="mx-1.5 text-stone-500">·</span>
          <span>
            {total > 0 ? Math.round((hoveredSeg.count / total) * 100) : 0}%
          </span>
        </div>
      )}
    </div>
  );
}
