import type { SymbolId } from '../ir/types';

export type SymbolDefinition = {
  id: SymbolId;
  label: string;
  description: string;
};

export const SYMBOL_DEFINITIONS: SymbolDefinition[] = [
  { id: 'primary', label: 'Primary', description: 'Main brand color' },
  { id: 'secondary', label: 'Secondary', description: 'Secondary brand color' },
  { id: 'accent', label: 'Accent', description: 'Highlight or emphasis color' },
  { id: 'success', label: 'Success', description: 'Positive confirmation' },
  { id: 'info', label: 'Info', description: 'Neutral information' },
  { id: 'warning', label: 'Warning', description: 'Caution or attention' },
  { id: 'error', label: 'Error', description: 'Danger or error' },
];
