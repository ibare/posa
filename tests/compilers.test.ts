import { describe, expect, it } from 'vitest';
import {
  COMPONENT_DEFINITIONS,
  type ComponentDefinition,
} from '../src/catalog/components';
import { addPrimitive } from '../src/color/primitive-ops';
import {
  COMPILERS,
  cssVariablesCompiler,
  dtcgCompiler,
  tailwindConfigCompiler,
} from '../src/compilers';
import { createEmptyIR, type IR } from '../src/ir/types';

/** 테스트 스코프: seedIR가 쓰는 button을 포함하는 카탈로그 부분 집합. */
const SEED_COMPONENTS: ComponentDefinition[] = COMPONENT_DEFINITIONS.filter(
  (c) => c.id === 'button',
);
const EMPTY_COMPONENTS: ComponentDefinition[] = [];

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
      text: { primitive: primitiveId, shade: 900 },
      background: { primitive: primitiveId, shade: 500 },
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
    const out = cssVariablesCompiler.compile({ ir: createEmptyIR(), components: EMPTY_COMPONENTS });
    expect(out.language).toBe('css');
    expect(out.filename).toBe('posa-tokens.css');
    expect(out.content).toMatch(/:root\s*{/);
    expect(out.content).toMatch(/}/);
  });

  it('primitive + symbol + attribute + slot state를 포함한 IR을 올바르게 변환', () => {
    const { ir, primitiveId } = seedIR();
    const out = cssVariablesCompiler.compile({ ir, components: SEED_COMPONENTS });
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
    const out = cssVariablesCompiler.compile({
      ir: ir0,
      components: EMPTY_COMPONENTS,
    });
    expect(out.content).toContain('/* orphan */');
    expect(out.content).toMatch(/\/\* --[a-z]+-a-500:/);
  });
});

describe('tailwindConfigCompiler', () => {
  it('빈 IR에서 colors 블록을 안전하게 반환', () => {
    const out = tailwindConfigCompiler.compile({ ir: createEmptyIR(), components: EMPTY_COMPONENTS });
    expect(out.language).toBe('javascript');
    expect(out.content).toContain('export default');
    expect(out.content).toContain('colors:');
  });

  it('primitive 11단이 모두 출력되고 symbol/attribute/slot은 CSS var 참조', () => {
    const { ir, primitiveId } = seedIR();
    const out = tailwindConfigCompiler.compile({ ir, components: SEED_COMPONENTS });
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
    const out = dtcgCompiler.compile({ ir: createEmptyIR(), components: EMPTY_COMPONENTS });
    expect(out.language).toBe('json');
    expect(out.filename).toBe('posa-tokens.json');
    expect(() => JSON.parse(out.content)).not.toThrow();
  });

  it('symbol은 primitive leaf를 alias로, attribute는 항상 primitive를 alias로', () => {
    const { ir, primitiveId } = seedIR();
    const out = dtcgCompiler.compile({ ir, components: SEED_COMPONENTS });
    const parsed = JSON.parse(out.content);
    expect(parsed.color[primitiveId]['500'].$value).toMatch(/^oklch\(/);
    expect(parsed.color.symbols.primary.$value).toBe(
      `{color.${primitiveId}.500}`,
    );
    expect(parsed.color.attributes.text.$value).toBe(
      `{color.${primitiveId}.900}`,
    );
    expect(parsed.color.attributes.background.$value).toBe(
      `{color.${primitiveId}.500}`,
    );
  });

  it('slot.ref와 slot state override가 alias로 들어간다', () => {
    const { ir, primitiveId } = seedIR();
    const out = dtcgCompiler.compile({ ir, components: SEED_COMPONENTS });
    const parsed = JSON.parse(out.content);
    const slotNode = parsed.color.slots.button.primary.background;
    expect(slotNode.default.$value).toBe(`{color.${primitiveId}.500}`);
    expect(slotNode.hover.$value).toBe(`{color.${primitiveId}.600}`);
  });

  it('생성된 모든 alias는 실제 존재하는 키를 가리킨다', () => {
    const { ir } = seedIR();
    const out = dtcgCompiler.compile({ ir, components: SEED_COMPONENTS });
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

describe('compiler 스코프 격리', () => {
  // card는 background/text/border만 선언. IR에 있는 text·background는 포함,
  // button.primary.background slot과 primary symbol은 card 스코프 밖이므로 누락.
  it('스코프 밖 symbol/slot은 출력에 포함되지 않는다', () => {
    const { ir } = seedIR();
    const cardOnly: ComponentDefinition[] = COMPONENT_DEFINITIONS.filter(
      (c) => c.id === 'card',
    );

    const css = cssVariablesCompiler.compile({ ir, components: cardOnly });
    expect(css.content).not.toContain('--posa-symbol-primary');
    expect(css.content).not.toContain(
      '--posa-slot-button-primary-background',
    );
    expect(css.content).toContain('--posa-attr-text');
    expect(css.content).toContain('--posa-attr-background');

    const tw = tailwindConfigCompiler.compile({ ir, components: cardOnly });
    expect(tw.content).not.toContain("'symbol-primary'");
    expect(tw.content).not.toContain("'slot-button-primary-background'");

    const dtcg = dtcgCompiler.compile({ ir, components: cardOnly });
    const parsed = JSON.parse(dtcg.content);
    expect(parsed.color.symbols).toBeUndefined();
    expect(parsed.color.slots).toBeUndefined();
    expect(parsed.color.attributes.text).toBeDefined();
  });

  it('빈 스코프면 primitive만 남고 상위 alias는 전부 생략', () => {
    const { ir } = seedIR();

    const css = cssVariablesCompiler.compile({
      ir,
      components: EMPTY_COMPONENTS,
    });
    expect(css.content).not.toContain('--posa-symbol-');
    expect(css.content).not.toContain('--posa-attr-');
    expect(css.content).not.toContain('--posa-slot-');

    const dtcg = dtcgCompiler.compile({
      ir,
      components: EMPTY_COMPONENTS,
    });
    const parsed = JSON.parse(dtcg.content);
    expect(parsed.color.symbols).toBeUndefined();
    expect(parsed.color.attributes).toBeUndefined();
    expect(parsed.color.slots).toBeUndefined();
  });
});
