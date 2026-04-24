import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import { FIXED_PALETTES } from '../../../color/fixed-palettes';
import { oklchToHex } from '../../../color/oklch';
import type { OKLCH } from '../../../ir/types';
import { usePosaStore } from '../../../store/posa-store';
import { matchesOKLCH } from './utils';

const PALETTE_ROLL_DURATION = 0.35;
const PALETTE_ROLL_EASE = [0.4, 0, 0.2, 1] as const;

type Props = {
  value: OKLCH | null;
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
  return (
    <div className="space-y-4">
      <FixedPaletteRow value={value} onChange={onChange} />
      {value && <Sliders value={value} onChange={onChange} />}
    </div>
  );
}

type SlidersProps = {
  value: OKLCH;
  onChange: (color: OKLCH) => void;
};

function Sliders({ value, onChange }: SlidersProps) {
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
    <>
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
    </>
  );
}

type FixedPaletteRowProps = {
  value: OKLCH | null;
  onChange: (color: OKLCH) => void;
};

function FixedPaletteRow({ value, onChange }: FixedPaletteRowProps) {
  const { t } = useTranslation('explorer');
  const idx = usePosaStore((s) => s.finePaletteIndex);
  const cyclePalette = usePosaStore((s) => s.cycleFinePalette);
  const palette = FIXED_PALETTES[idx % FIXED_PALETTES.length];
  const paletteName = t(`grayscale.palettes.${palette.id}`);

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.15em] text-stone-600 font-mono">
          {t('grayscale.label')}
        </span>
        <span className="text-[10px] text-stone-400 italic">
          {paletteName}
        </span>
      </div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
      >
        <div className="col-span-11 relative overflow-hidden">
          {/* sizer: 보이지 않는 1칸으로 wrapper 높이를 tile 한 칸 높이에 맞춤 */}
          <div
            aria-hidden
            className="grid gap-1.5 invisible"
            style={{ gridTemplateColumns: 'repeat(11, minmax(0, 1fr))' }}
          >
            <div className="aspect-square" />
          </div>
          <AnimatePresence initial={false}>
            <motion.div
              key={palette.id}
              initial={{ y: 'calc(100% + 2px)' }}
              animate={{ y: 0 }}
              exit={{ y: 'calc(-100% - 2px)' }}
              transition={{
                duration: PALETTE_ROLL_DURATION,
                ease: PALETTE_ROLL_EASE,
              }}
              className="absolute inset-0 grid gap-1.5"
              style={{ gridTemplateColumns: 'repeat(11, minmax(0, 1fr))' }}
            >
              {palette.tiles.map((tile, i) => {
                const hex = oklchToHex(tile.L, tile.C, tile.H);
                const isSelected = value ? matchesOKLCH(tile, value) : false;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={t('grayscale.tileAria', {
                      palette: paletteName,
                      index: i + 1,
                    })}
                    onClick={() => onChange(tile)}
                    className={[
                      'aspect-square rounded-md transition-transform',
                      'hover:scale-[1.08] hover:z-10 relative',
                      isSelected
                        ? 'ring-2 ring-stone-900 ring-offset-2 ring-offset-white scale-105 z-10'
                        : '',
                    ].join(' ')}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={cyclePalette}
          aria-label={t('grayscale.cycleAria')}
          title={t('grayscale.cycle')}
          className={[
            'aspect-square rounded-md flex items-center justify-center',
            'text-stone-500 hover:text-stone-900 hover:bg-stone-100',
            'ring-1 ring-stone-200 transition',
          ].join(' ')}
        >
          <motion.span
            animate={{ rotate: idx * 360 }}
            transition={{
              duration: PALETTE_ROLL_DURATION,
              ease: PALETTE_ROLL_EASE,
            }}
            className="flex"
          >
            <RotateCw className="w-3 h-3" strokeWidth={1.75} />
          </motion.span>
        </button>
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
