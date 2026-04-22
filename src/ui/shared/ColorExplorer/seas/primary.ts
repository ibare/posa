import { c, fullHueRing, type SeaRow } from './shared';

export function tierA(): SeaRow[] {
  return [
    {
      label: 'Rich & vivid',
      hint: 'Most commonly chosen',
      tiles: fullHueRing(0.58, 0.18),
    },
    {
      label: 'Deep & confident',
      hint: 'Stronger, more trustworthy',
      tiles: fullHueRing(0.42, 0.16),
    },
  ];
}

export function tierB(): SeaRow[] {
  return [
    {
      label: 'Soft & approachable',
      hint: 'Friendlier tone',
      tiles: fullHueRing(0.72, 0.12),
    },
    {
      label: 'Pastel & gentle',
      hint: 'Pastel range',
      tiles: fullHueRing(0.86, 0.06),
    },
    {
      label: 'Neutral anchors',
      hint: 'Grayscale / black',
      tiles: [0.05, 0.25, 0.45, 0.65, 0.85, 0.98].map((L) => c(L, 0, 0)),
    },
  ];
}
