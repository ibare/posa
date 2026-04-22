import { c, fullHueRing, type SeaRow } from './shared';

export function tierA(): SeaRow[] {
  return [
    {
      label: 'Pure dark',
      hint: 'Maximum readability',
      tiles: [0.15, 0.2, 0.25, 0.3, 0.35].map((L) => c(L, 0, 0)),
    },
    {
      label: 'Warm dark',
      hint: 'Warm-toned dark text',
      tiles: [35, 55, 75, 95].map((H) => c(0.25, 0.018, H)),
    },
    {
      label: 'Cool dark',
      hint: 'Cool-toned dark text',
      tiles: [200, 230, 250, 270].map((H) => c(0.25, 0.018, H)),
    },
  ];
}

export function tierB(): SeaRow[] {
  return [
    {
      label: 'Tinted dark — brand hue',
      hint: 'Dark text with a hint of brand color',
      tiles: [20, 150, 230, 310].map((H) => c(0.22, 0.03, H)),
    },
    {
      label: 'Light text',
      hint: 'For dark backgrounds',
      tiles: [0.98, 0.94, 0.9, 0.86, 0.82].map((L) => c(L, 0, 0)),
    },
    {
      label: 'Full-color text (unusual)',
      hint: 'Rare but possible',
      tiles: fullHueRing(0.35, 0.1),
    },
  ];
}
