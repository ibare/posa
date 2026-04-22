import { useMemo } from 'react';
import { oklchToHex } from '../../color/oklch';
import type { OKLCH } from '../../ir/types';

type Props = {
  value: OKLCH | null;
  onChange: (c: OKLCH) => void;
  onClear?: () => void;
};

const FALLBACK: OKLCH = { L: 0.58, C: 0.12, H: 220 };
const C_MAX = 0.37;

function buildGradient(sampler: (t: number) => string, steps: number): string {
  const stops: string[] = [];
  for (let i = 0; i <= steps; i++) {
    stops.push(sampler(i / steps));
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export function ColorPicker({ value, onChange, onClear }: Props) {
  const v = value ?? FALLBACK;
  const hex = oklchToHex(v.L, v.C, v.H);

  const lGradient = useMemo(
    () => buildGradient((t) => oklchToHex(t, v.C, v.H), 12),
    [v.C, v.H],
  );
  const cGradient = useMemo(
    () => buildGradient((t) => oklchToHex(v.L, t * C_MAX, v.H), 12),
    [v.L, v.H],
  );
  const hGradient = useMemo(
    () => buildGradient((t) => oklchToHex(v.L, v.C, t * 360), 24),
    [v.L, v.C],
  );

  return (
    <div className="space-y-4">
      <div
        className="h-20 w-full rounded-md ring-1 ring-stone-200 shadow-inner"
        style={{ backgroundColor: hex }}
        aria-label={`current color ${hex}`}
      />

      <SliderRow
        label="L"
        min={0}
        max={1}
        step={0.001}
        value={v.L}
        format={(x) => x.toFixed(3)}
        gradient={lGradient}
        onChange={(L) => onChange({ ...v, L })}
      />
      <SliderRow
        label="C"
        min={0}
        max={C_MAX}
        step={0.001}
        value={v.C}
        format={(x) => x.toFixed(3)}
        gradient={cGradient}
        onChange={(C) => onChange({ ...v, C })}
      />
      <SliderRow
        label="H"
        min={0}
        max={360}
        step={0.5}
        value={v.H}
        format={(x) => x.toFixed(1)}
        gradient={hGradient}
        onChange={(H) => onChange({ ...v, H })}
      />

      <div className="flex items-center justify-between text-xs font-mono text-stone-600">
        <span className="tabular-nums">{hex}</span>
        <span className="tabular-nums">
          oklch({v.L.toFixed(3)} {v.C.toFixed(3)} {v.H.toFixed(1)})
        </span>
      </div>

      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2"
        >
          Clear (inherit)
        </button>
      )}
    </div>
  );
}

type SliderProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (x: number) => string;
  gradient: string;
  onChange: (v: number) => void;
};

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  format,
  gradient,
  onChange,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-mono text-stone-500">{label}</span>
        <span className="text-xs font-mono tabular-nums text-stone-700">
          {format(value)}
        </span>
      </div>
      <div className="relative h-3 rounded-full ring-1 ring-stone-200" style={{ background: gradient }}>
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
