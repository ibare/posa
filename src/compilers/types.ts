import type { ComponentDefinition } from '../catalog/components';
import type { IR } from '../ir/types';

export type CompileLanguage = 'css' | 'typescript' | 'javascript' | 'json';

export type CompileResult = {
  filename: string;
  content: string;
  language: CompileLanguage;
};

/**
 * 사용자가 선택한 컴포넌트 집합이 export의 유일한 스코프다.
 * Compiler는 이 스코프 밖의 symbol/attribute/slot은 출력하지 않는다.
 */
export type CompileInput = {
  ir: IR;
  components: ComponentDefinition[];
};

export type Compiler = {
  id: string;
  compile: (input: CompileInput) => CompileResult;
};
