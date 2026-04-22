import { describe, expect, it } from 'vitest';
import { addPrimitive } from '../src/color/primitive-ops';
import {
  COMPILERS,
  cssVariablesCompiler,
  dtcgCompiler,
  tailwindConfigCompiler,
} from '../src/compilers';
import type { IR } from '../src/ir/types';

function emptyIR(): IR {
  const now = 0;
  return {
    meta: { version: '1.0', createdAt: now, updatedAt: now, componentTypes: [] },
    primitives: {},
    roles: {},
    slots: {},
  };
}

function seedIR(): { ir: IR; primitiveId: string } {
  const base = emptyIR();
  const { ir: ir1, primitiveId } = addPrimitive(
    base,
    { L: 0.58, C: 0.18, H: 145 },
    500,
  );
  const ir2: IR = {
    ...ir1,
    roles: {
      primary: { primitive: primitiveId, shade: 500 },
      'primary-fg': { primitive: primitiveId, shade: 50 },
    },
    slots: {
      'button.primary.bg': {
        role: 'primary',
        states: {
          hover: { primitive: primitiveId, shade: 600 },
        },
      },
    },
  };
  return { ir: ir2, primitiveId };
}

describe('COMPILERS 등록', () => {
  it('3개 컴파일러가 있고 각각 고유 id', () => {
    expect(COMPILERS).toHaveLength(3);
    const ids = new Set(COMPILERS.map((c) => c.id));
    expect(ids.size).toBe(3);
  });
});

describe('cssVariablesCompiler', () => {
  it('빈 IR이어도 에러 없이 :root를 반환', () => {
    const out = cssVariablesCompiler.compile(emptyIR());
    expect(out.language).toBe('css');
    expect(out.filename).toBe('posa-tokens.css');
    expect(out.content).toMatch(/:root\s*{/);
    expect(out.content).toMatch(/}/);
  });

  it('primitive + role + slot state를 포함한 IR을 올바르게 변환', () => {
    const { ir, primitiveId } = seedIR();
    const out = cssVariablesCompiler.compile(ir);
    expect(out.content).toContain(`--${primitiveId}-500`);
    expect(out.content).toContain(`--primary: var(--${primitiveId}-500)`);
    expect(out.content).toContain(`--primary-fg: var(--${primitiveId}-50)`);
    expect(out.content).toContain(
      `--button-primary-bg-hover: var(--${primitiveId}-600)`,
    );
  });

  it('고아 primitive는 주석 처리되어 나감', () => {
    const { ir: ir0 } = addPrimitive(
      emptyIR(),
      { L: 0.5, C: 0.2, H: 20 },
      500,
    );
    const out = cssVariablesCompiler.compile(ir0);
    expect(out.content).toContain('/* orphan */');
    expect(out.content).toMatch(/\/\* --[a-z]+-a-500:/);
  });
});

describe('tailwindConfigCompiler', () => {
  it('빈 IR에서 빈 colors 블록 반환', () => {
    const out = tailwindConfigCompiler.compile(emptyIR());
    expect(out.language).toBe('javascript');
    expect(out.content).toContain('export default');
    expect(out.content).toContain('colors:');
  });

  it('primitive 11단이 모두 출력되고 role은 CSS var 참조', () => {
    const { ir, primitiveId } = seedIR();
    const out = tailwindConfigCompiler.compile(ir);
    expect(out.content).toContain(`'${primitiveId}': {`);
    for (const shade of [50, 100, 500, 900, 950]) {
      expect(out.content).toContain(`'${shade}':`);
    }
    expect(out.content).toContain(`'primary': 'var(--primary)'`);
    expect(out.content).toContain(
      `'button-primary-bg-hover': 'var(--button-primary-bg-hover)'`,
    );
  });
});

describe('dtcgCompiler', () => {
  it('빈 IR에서도 parse 가능한 JSON', () => {
    const out = dtcgCompiler.compile(emptyIR());
    expect(out.language).toBe('json');
    expect(out.filename).toBe('posa-tokens.json');
    expect(() => JSON.parse(out.content)).not.toThrow();
  });

  it('role은 primitive 리프를 reference alias로 가리킨다', () => {
    const { ir, primitiveId } = seedIR();
    const out = dtcgCompiler.compile(ir);
    const parsed = JSON.parse(out.content);
    expect(parsed.color[primitiveId]).toBeTypeOf('object');
    expect(parsed.color[primitiveId]['500'].$value).toMatch(/^oklch\(/);
    expect(parsed.color.primary.$value).toBe(`{color.${primitiveId}.500}`);
    expect(parsed.color['primary-fg'].$value).toBe(`{color.${primitiveId}.50}`);
    // 존재하지 않는 primitive 키를 참조하지 않는다.
    const refMatches = Array.from(
      out.content.matchAll(/\{color\.([^.}]+)\.(\d+)\}/g),
    );
    for (const m of refMatches) {
      const [, fam, shade] = m;
      expect(parsed.color[fam]).toBeDefined();
      expect(parsed.color[fam][shade]).toBeDefined();
    }
  });

  it('slot state override도 포함', () => {
    const { ir, primitiveId } = seedIR();
    const out = dtcgCompiler.compile(ir);
    const parsed = JSON.parse(out.content);
    const slotState =
      parsed.color.slots?.button?.primary?.bg?.hover?.$value;
    expect(slotState).toBe(`{color.${primitiveId}.600}`);
  });
});
