import { cssVariablesCompiler } from './css-variables';
import { dtcgCompiler } from './dtcg';
import { tailwindConfigCompiler } from './tailwind-config';
import type { Compiler } from './types';

export { cssVariablesCompiler } from './css-variables';
export { tailwindConfigCompiler } from './tailwind-config';
export { dtcgCompiler } from './dtcg';
export type { Compiler, CompileResult, CompileLanguage } from './types';

export const COMPILERS: Compiler[] = [
  cssVariablesCompiler,
  tailwindConfigCompiler,
  dtcgCompiler,
];
