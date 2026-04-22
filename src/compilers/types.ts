import type { IR } from '../ir/types';

export type CompileLanguage = 'css' | 'typescript' | 'javascript' | 'json';

export type CompileResult = {
  filename: string;
  content: string;
  language: CompileLanguage;
};

export type Compiler = {
  id: string;
  label: string;
  description: string;
  compile: (ir: IR) => CompileResult;
};
