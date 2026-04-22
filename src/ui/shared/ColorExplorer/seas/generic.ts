import { c, fullHueRing, type SeaRow } from './shared';

export function tierA(): SeaRow[] {
  return [
    {
      label: 'Rich tones',
      hint: 'Vivid across the spectrum',
      tiles: fullHueRing(0.58, 0.18),
    },
    {
      label: 'Soft tones',
      hint: 'Gentler alternatives',
      tiles: fullHueRing(0.72, 0.1),
    },
    {
      label: 'Pastel tones',
      hint: 'Quietest tints',
      tiles: fullHueRing(0.86, 0.05),
    },
  ];
}

export function tierB(): SeaRow[] {
  return [
    {
      label: 'Neutral anchors',
      hint: 'Grayscale',
      tiles: [0.1, 0.3, 0.5, 0.7, 0.9, 0.98].map((L) => c(L, 0, 0)),
    },
    {
      label: 'Deep spectrum',
      hint: 'Darker across the wheel',
      tiles: fullHueRing(0.35, 0.14),
    },
  ];
}
