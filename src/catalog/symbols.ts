import type { SymbolId } from '../ir/types';

export type SymbolDefinition = {
  id: SymbolId;
};

export const SYMBOL_DEFINITIONS: SymbolDefinition[] = [
  { id: 'primary' },
  { id: 'secondary' },
  { id: 'accent' },
  { id: 'success' },
  { id: 'info' },
  { id: 'warning' },
  { id: 'error' },
];
