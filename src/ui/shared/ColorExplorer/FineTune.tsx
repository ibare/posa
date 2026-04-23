import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { oklchToHex } from '../../../color/oklch';
import type { OKLCH } from '../../../ir/types';

type Props = {
  value: OKLCH;
  onChange: (color: OKLCH) => void;
};

const C_MAX = 0.37;

function hueNameKey(H: number, C: number): string {
  if (C < 0.03) return 'neutral';
  const h = ((H % 360) + 360) % 360;
  if (h < 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 75) return 'yellow';
  if (h < 105) return 'lime';
  if (h < 150) return 'green';
  if (h < 180) return 'teal';
  if (h < 210) return 'cyan';
  if (h < 250) return 'blue';
  if (h < 285) return 'purple';
  if (h < 315) return 'magenta';
  return 'pink';
}

function buildGradient(
  sampler: (t: number) => string,
  steps: number,
): string {
  const stops: string[] = [];
  for (let i = 0; i <= steps; i++) {
    stops.push(sampler(i / steps));
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export function FineTune({ value, onChange }: Props) {
  const { t } = useTranslation('explorer');
  const lGradient = useMemo(
    () => buildGradient((t) => oklchToHex(t, value.C, value.H), 12),
    [value.C, value.H],
  );
  const cGradient = useMemo(
    () => buildGradient((t) => oklchToHex(value.L, t * C_MAX, value.H), 12),
    [value.L, value.H],
  );
  const hGradient = useMemo(
    () =>
      buildGradient(
        (t) => oklchToHex(value.L, Math.max(0.12, value.C), t * 360),
        24,
      ),
    [value.L, value.C],
  );

  const hueLabel = t('fine.hueRegion', {
    name: t(`fine.hueNames.${hueNameKey(value.H, value.C)}`),
  });

  return (
    <div className="space-y-4">
      <SliderRow
        label={t('fine.lightness')}
        sublabel={t('fine.lightnessSub')}
        valueText={value.L.toFixed(2)}
        min={0}
        max={1}
        step={0.01}
        value={value.L}
        gradient={lGradient}
        onChange={(L) => onChange({ ...value, L })}
      />
      <SliderRow
        label={t('fine.chroma')}
        sublabel={t('fine.chromaSub')}
        valueText={value.C.toFixed(2)}
        min={0}
        max={C_MAX}
        step={0.005}
        value={value.C}
        gradient={cGradient}
        onChange={(C) => onChange({ ...value, C })}
      />
      <SliderRow
        label={t('fine.hue')}
        sublabel={hueLabel}
        valueText={`${Math.round(value.H)}°`}
        min={0}
        max={360}
        step={1}
        value={value.H}
        gradient={hGradient}
        onChange={(H) => onChange({ ...value, H })}
      />
      <div className="pt-2 border-t border-stone-100 font-mono text-[10px] text-stone-400 tabular-nums">
        oklch({value.L.toFixed(3)} {value.C.toFixed(3)} {value.H.toFixed(1)})
      </div>
    </div>
  );
}

type SliderRowProps = {
  label: string;
  sublabel: string;
  valueText: string;
  min: number;
  max: number;
  step: number;
  value: number;
  gradient: string;
  onChange: (v: number) => void;
};

function SliderRow({
  label,
  sublabel,
  valueText,
  min,
  max,
  step,
  value,
  gradient,
  onChange,
}: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-stone-900">{label}</span>
          <span className="text-[10px] italic text-stone-400">{sublabel}</span>
        </div>
        <span className="text-[10px] font-mono tabular-nums text-stone-600">
          {valueText}
        </span>
      </div>
      <div
        className="relative h-3 rounded-full ring-1 ring-stone-200"
        style={{ background: gradient }}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />
        <div
          className="absolute top-1/2 w-4 h-4 -ml-2 -translate-y-1/2 rounded-full bg-white ring-1 ring-stone-500 shadow pointer-events-none"
          style={{ left: `${pct}%` }}
        />
      </div>
    </label>
  );
}
