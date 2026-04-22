import { hueSweep, type SeaRow } from './shared';

export function tierA(): SeaRow[] {
  return [
    {
      label: 'Amber — rich',
      hint: 'Clear caution signal',
      tiles: hueSweep(35, 75, 5, 0.72, 0.17),
    },
    {
      label: 'Amber — deep',
      hint: 'Stronger warning',
      tiles: hueSweep(35, 75, 5, 0.58, 0.17),
    },
  ];
}

export function tierB(): SeaRow[] {
  return [
    {
      label: 'Amber — soft',
      hint: 'Softer warning',
      tiles: hueSweep(35, 75, 5, 0.82, 0.1),
    },
    {
      label: 'Orange — alternative',
      hint: 'Red-leaning orange',
      tiles: hueSweep(15, 28, 3, 0.65, 0.18),
    },
  ];
}
