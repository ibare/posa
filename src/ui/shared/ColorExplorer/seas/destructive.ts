import { c, hueSweep, type SeaRow } from './shared';

export function tierA(): SeaRow[] {
  return [
    {
      label: 'Red — vivid',
      hint: 'Clear error signal',
      tiles: hueSweep(15, 35, 4, 0.58, 0.2),
    },
    {
      label: 'Red — deep',
      hint: 'More grave',
      tiles: hueSweep(15, 35, 4, 0.48, 0.2),
    },
  ];
}

export function tierB(): SeaRow[] {
  return [
    {
      label: 'Red — soft',
      hint: 'Less aggressive',
      tiles: hueSweep(15, 35, 4, 0.68, 0.16),
    },
    {
      label: 'Magenta — alternative',
      hint: 'Red with purple tilt',
      tiles: [340, 350, 0, 10].map((H) => c(0.55, 0.2, H)),
    },
  ];
}
