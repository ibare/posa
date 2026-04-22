import { c, type SeaRow } from './shared';

export function tierA(): SeaRow[] {
  return [
    {
      label: 'Pure whites',
      hint: 'Most neutral white range',
      tiles: [1.0, 0.99, 0.98, 0.97, 0.96].map((L) => c(L, 0, 0)),
    },
    {
      label: 'Warm off-whites',
      hint: 'Off-whites with a warm cast',
      tiles: [0.99, 0.98, 0.97, 0.96].map((L) => c(L, 0.012, 70)),
    },
    {
      label: 'Cool off-whites',
      hint: 'Off-whites with a cool cast',
      tiles: [0.99, 0.98, 0.97, 0.96].map((L) => c(L, 0.012, 240)),
    },
  ];
}

export function tierB(): SeaRow[] {
  return [
    {
      label: 'Soft tinted backgrounds',
      hint: 'Subtle brand tint',
      tiles: [0, 140, 200, 280, 340].map((H) => c(0.97, 0.018, H)),
    },
    {
      label: 'Dark surfaces',
      hint: 'For dark mode',
      tiles: [0.08, 0.14, 0.18, 0.22, 0.26].map((L) => c(L, 0, 0)),
    },
    {
      label: 'Tinted dark',
      hint: 'Warm or cool dark backgrounds',
      tiles: [
        c(0.16, 0.015, 60),
        c(0.2, 0.015, 60),
        c(0.16, 0.015, 240),
        c(0.2, 0.015, 240),
      ],
    },
  ];
}
