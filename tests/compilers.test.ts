import { describe, expect, it } from 'vitest';
import { addPrimitive } from '../src/color/primitive-ops';
import {
  COMPILERS,
  cssVariablesCompiler,
  dtcgCompiler,
  tailwindConfigCompiler,
} from '../src/compilers';
import { createEmptyIR, type IR } from '../src/ir/types';

function seedIR(): { ir: IR; primitiveId: string } {
  const base = createEmptyIR();
  const { ir: ir1, primitiveId } = addPrimitive(
    base,
    { L: 0.58, C: 0.18, H: 145 },
    500,
  );
  const ir2: IR = {
    ...ir1,
    symbols: {
      ...ir1.symbols,
      primary: { primitive: primitiveId, shade: 500 },
    },
    attributes: {
      ...ir1.attributes,
      text: { kind: 'primitive', primitive: primitiveId, shade: 900 },
      background: { kind: 'symbol', symbol: 'primary' },
    },
    slots: {
      'button.primary.background': {
        ref: { kind: 'primitive', primitive: primitiveId, shade: 500 },
        states: {
          hover: { kind: 'primitive', primitive: primitiveId, shade: 600 },
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
    const out = cssVariablesCompiler.compile(createEmptyIR());
    expect(out.language).toBe('css');
    expect(out.filename).toBe('posa-tokens.css');
    expect(out.content).toMatch(/:root\s*{/);
    expect(out.content).toMatch(/}/);
  });

  it('primitive + symbol + attribute + slot state를 포함한 IR을 올바르게 변환', () => {
    const { ir, primitiveId } = seedIR();
    const out = cssVariablesCompiler.compile(ir);
    expect(out.content).toContain(`--${primitiveId}-500`);
    expect(out.content).toMatch(/--posa-symbol-primary:\s*oklch\(/);
    expect(out.content).toMatch(/--posa-attr-text:\s*oklch\(/);
    // attribute가 symbol 참조여도 CSS 상에선 resolved color로 나감
    expect(out.content).toMatch(/--posa-attr-background:\s*oklch\(/);
    expect(out.content).toMatch(
      /--posa-slot-button-primary-background:\s*oklch\(/,
    );
    expect(out.content).toMatch(
      /--posa-slot-button-primary-background-hover:\s*oklch\(/,
    );
  });

  it('고아 primitive는 주석 처리되어 나감', () => {
    const { ir: ir0 } = addPrimitive(
      createEmptyIR(),
      { L: 0.5, C: 0.2, H: 20 },
      500,
    );
    const out = cssVariablesCompiler.compile(ir0);
    expect(out.content).toContain('/* orphan */');
    expect(out.content).toMatch(/\/\* --[a-z]+-a-500:/);
  });
});

describe('tailwindConfigCompiler', () => {
  it('빈 IR에서 colors 블록을 안전하게 반환', () => {
    const out = tailwindConfigCompiler.compile(createEmptyIR());
    expect(out.language).toBe('javascript');
    expect(out.content).toContain('export default');
    expect(out.content).toContain('colors:');
  });

  it('primitive 11단이 모두 출력되고 symbol/attribute/slot은 CSS var 참조', () => {
    const { ir, primitiveId } = seedIR();
    const out = tailwindConfigCompiler.compile(ir);
    expect(out.content).toContain(`'${primitiveId}': {`);
    for (const shade of [50, 100, 500, 900, 950]) {
      expect(out.content).toContain(`'${shade}':`);
    }
    expect(out.content).toContain(
      `'symbol-primary': 'var(--posa-symbol-primary)'`,
    );
    expect(out.content).toContain(`'attr-text': 'var(--posa-attr-text)'`);
    expect(out.content).toContain(
      `'slot-button-primary-background': 'var(--posa-slot-button-primary-background)'`,
    );
    expect(out.content).toContain(
      `'slot-button-primary-background-hover': 'var(--posa-slot-button-primary-background-hover)'`,
    );
  });
});

describe('dtcgCompiler', () => {
  it('빈 IR에서도 parse 가능한 JSON', () => {
    const out = dtcgCompiler.compile(createEmptyIR());
    expect(out.language).toBe('json');
    expect(out.filename).toBe('posa-tokens.json');
    expect(() => JSON.parse(out.content)).not.toThrow();
  });

  it('symbol은 primitive leaf를 alias로, attribute는 primitive 또는 symbol을 alias로', () => {
    const { ir, primitiveId } = seedIR();
    const out = dtcgCompiler.compile(ir);
    const parsed = JSON.parse(out.content);
    expect(parsed.color[primitiveId]['500'].$value).toMatch(/^oklch\(/);
    expect(parsed.color.symbols.primary.$value).toBe(
      `{color.${primitiveId}.500}`,
    );
    expect(parsed.color.attributes.text.$value).toBe(
      `{color.${primitiveId}.900}`,
    );
    expect(parsed.color.attributes.background.$value).toBe(
      `{color.symbols.primary}`,
    );
  });

  it('slot.ref와 slot state override가 alias로 들어간다', () => {
    const { ir, primitiveId } = seedIR();
    const out = dtcgCompiler.compile(ir);
    const parsed = JSON.parse(out.content);
    const slotNode = parsed.color.slots.button.primary.background;
    expect(slotNode.default.$value).toBe(`{color.${primitiveId}.500}`);
    expect(slotNode.hover.$value).toBe(`{color.${primitiveId}.600}`);
  });

  it('생성된 모든 alias는 실제 존재하는 키를 가리킨다', () => {
    const { ir } = seedIR();
    const out = dtcgCompiler.compile(ir);
    const parsed = JSON.parse(out.content);
    const primitiveRefs = Array.from(
      out.content.matchAll(/\{color\.([^.}]+)\.(\d+)\}/g),
    );
    for (const m of primitiveRefs) {
      const [, fam, shade] = m;
      expect(parsed.color[fam]).toBeDefined();
      expect(parsed.color[fam][shade]).toBeDefined();
    }
    const symbolRefs = Array.from(
      out.content.matchAll(/\{color\.symbols\.([^}]+)\}/g),
    );
    for (const m of symbolRefs) {
      const [, sym] = m;
      expect(parsed.color.symbols[sym]).toBeDefined();
    }
  });
});
