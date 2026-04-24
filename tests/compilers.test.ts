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
      primary: { kind: 'primitive', primitive: primitiveId, shade: 500 },
    },
    attributes: {
      ...ir1.attributes,
      text: { kind: 'primitive', primitive: primitiveId, shade: 900 },
      background: { kind: 'primitive', primitive: primitiveId, shade: 500 },
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
    const out = cssVariablesCompiler.compile({
      ir: createEmptyIR(),
      components: EMPTY_COMPONENTS,
    });
    expect(out.language).toBe('css');
    expect(out.filename).toBe('posa-tokens.css');
    expect(out.content).toMatch(/:root\s*{/);
    expect(out.content).toMatch(/}/);
  });

  it('시스템 심볼은 항상 raw oklch로 출력', () => {
    const out = cssVariablesCompiler.compile({
      ir: createEmptyIR(),
      components: EMPTY_COMPONENTS,
    });
    expect(out.content).toMatch(/--symbol-white:\s*oklch\(/);
    expect(out.content).toMatch(/--symbol-black:\s*oklch\(/);
  });

  it('primitive + symbol + attribute + slot state는 alias 체인으로 나간다', () => {
    const { ir, primitiveId } = seedIR();
    const out = cssVariablesCompiler.compile({
      ir,
      components: SEED_COMPONENTS,
    });
    // primitive는 raw OKLCH
    expect(out.content).toMatch(
      new RegExp(`--${primitiveId}-500:\\s*oklch\\(`),
    );
    // user symbol → primitive var
    expect(out.content).toContain(
      `--symbol-primary: var(--${primitiveId}-500);`,
    );
    // attribute → primitive var
    expect(out.content).toContain(`--attr-text: var(--${primitiveId}-900);`);
    expect(out.content).toContain(
      `--attr-background: var(--${primitiveId}-500);`,
    );
    // slot default → primitive var (slot.ref 있는 경우)
    expect(out.content).toContain(
      `--slot-button-primary-background: var(--${primitiveId}-500);`,
    );
    // slot state override (state 이름 앞에 `--`)
    expect(out.content).toContain(
      `--slot-button-primary-background--hover: var(--${primitiveId}-600);`,
    );
  });

  it('slot.ref가 없으면 attribute var로 자동 상속된다', () => {
    const { ir } = seedIR();
    const out = cssVariablesCompiler.compile({
      ir,
      components: COMPONENT_DEFINITIONS.filter((c) => c.id === 'card'),
    });
    expect(out.content).toContain(`--slot-card-background: var(--attr-background);`);
    expect(out.content).toContain(`--slot-card-text: var(--attr-text);`);
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
    const out = tailwindConfigCompiler.compile({
      ir: createEmptyIR(),
      components: EMPTY_COMPONENTS,
    });
    expect(out.language).toBe('javascript');
    expect(out.content).toContain('export default');
    expect(out.content).toContain('colors:');
  });

  it('primitive 11단은 var alias로, symbol/attr/slot도 var alias로', () => {
    const { ir, primitiveId } = seedIR();
    const out = tailwindConfigCompiler.compile({
      ir,
      components: SEED_COMPONENTS,
    });
    expect(out.content).toContain(`'${primitiveId}': {`);
    // 11단 shade 전부 var alias
    for (const shade of [50, 100, 500, 900, 950]) {
      expect(out.content).toContain(
        `'${shade}': 'var(--${primitiveId}-${shade})'`,
      );
    }
    expect(out.content).toContain(`'symbol-primary': 'var(--symbol-primary)'`);
    expect(out.content).toContain(`'symbol-white': 'var(--symbol-white)'`);
    expect(out.content).toContain(`'attr-text': 'var(--attr-text)'`);
    expect(out.content).toContain(
      `'slot-button-primary-background': 'var(--slot-button-primary-background)'`,
    );
    // state 토큰은 single-dash (Tailwind 이름 규약), CSS var는 double-dash
    expect(out.content).toContain(
      `'slot-button-primary-background-hover': 'var(--slot-button-primary-background--hover)'`,
    );
  });
});

describe('dtcgCompiler', () => {
  it('빈 IR에서도 parse 가능한 JSON', () => {
    const out = dtcgCompiler.compile({
      ir: createEmptyIR(),
      components: EMPTY_COMPONENTS,
    });
    expect(out.language).toBe('json');
    expect(out.filename).toBe('posa-tokens.json');
    expect(() => JSON.parse(out.content)).not.toThrow();
  });

  it('$value는 resolved OKLCH, $extensions.posa.alias에 체인 보존', () => {
    const { ir, primitiveId } = seedIR();
    const out = dtcgCompiler.compile({ ir, components: SEED_COMPONENTS });
    const parsed = JSON.parse(out.content);

    // primitive — raw OKLCH, alias 없음
    expect(parsed.color[primitiveId]['500'].$value).toMatch(/^oklch\(/);
    expect(parsed.color[primitiveId]['500'].$extensions).toBeUndefined();

    // user symbol — OKLCH + alias
    const sym = parsed.color.symbols.primary;
    expect(sym.$value).toMatch(/^oklch\(/);
    expect(sym.$extensions.posa.alias).toBe(`{color.${primitiveId}.500}`);

    // system symbol — OKLCH, alias 없음
    expect(parsed.color.symbols.white.$value).toMatch(/^oklch\(/);
    expect(parsed.color.symbols.white.$extensions).toBeUndefined();

    // attribute — OKLCH + alias
    const attrText = parsed.color.attributes.text;
    expect(attrText.$value).toMatch(/^oklch\(/);
    expect(attrText.$extensions.posa.alias).toBe(
      `{color.${primitiveId}.900}`,
    );
  });

  it('slot default와 state override 모두 OKLCH + alias', () => {
    const { ir, primitiveId } = seedIR();
    const out = dtcgCompiler.compile({ ir, components: SEED_COMPONENTS });
    const parsed = JSON.parse(out.content);
    const slotNode = parsed.color.slots.button.primary.background;
    expect(slotNode.default.$value).toMatch(/^oklch\(/);
    expect(slotNode.default.$extensions.posa.alias).toBe(
      `{color.${primitiveId}.500}`,
    );
    expect(slotNode.hover.$value).toMatch(/^oklch\(/);
    expect(slotNode.hover.$extensions.posa.alias).toBe(
      `{color.${primitiveId}.600}`,
    );
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
  // 심볼/attribute는 IR 축이므로 스코프와 무관하게 항상 emit.
  // slot만 components 스코프로 제한된다.
  it('스코프 밖 slot은 출력에 포함되지 않는다', () => {
    const { ir } = seedIR();
    const cardOnly: ComponentDefinition[] = COMPONENT_DEFINITIONS.filter(
      (c) => c.id === 'card',
    );

    const css = cssVariablesCompiler.compile({ ir, components: cardOnly });
    // button slot은 card 스코프 밖
    expect(css.content).not.toContain('--slot-button-primary-background');
    // card slot은 들어있어야 함
    expect(css.content).toContain('--slot-card-background');
    expect(css.content).toContain('--slot-card-text');
    // symbol은 IR 축이라 스코프 무관하게 emit
    expect(css.content).toContain('--symbol-primary');

    const tw = tailwindConfigCompiler.compile({ ir, components: cardOnly });
    expect(tw.content).not.toContain("'slot-button-primary-background'");
    expect(tw.content).toContain("'slot-card-background'");

    const dtcg = dtcgCompiler.compile({ ir, components: cardOnly });
    const parsed = JSON.parse(dtcg.content);
    expect(parsed.color.slots.button).toBeUndefined();
    expect(parsed.color.slots.card).toBeDefined();
    expect(parsed.color.symbols.primary).toBeDefined();
  });

  it('빈 스코프면 slot·attribute는 생략, 심볼과 primitive는 유지', () => {
    const { ir } = seedIR();

    const css = cssVariablesCompiler.compile({
      ir,
      components: EMPTY_COMPONENTS,
    });
    // slot/attr 없음
    expect(css.content).not.toContain('--slot-');
    expect(css.content).not.toContain('--attr-');
    // 심볼은 여전히 IR 축으로 출력
    expect(css.content).toContain('--symbol-primary');
    expect(css.content).toContain('--symbol-white');

    const dtcg = dtcgCompiler.compile({
      ir,
      components: EMPTY_COMPONENTS,
    });
    const parsed = JSON.parse(dtcg.content);
    expect(parsed.color.slots).toBeUndefined();
    expect(parsed.color.attributes).toBeUndefined();
    // 심볼은 유지 (system + user)
    expect(parsed.color.symbols.primary).toBeDefined();
    expect(parsed.color.symbols.white).toBeDefined();
    expect(parsed.color.symbols.black).toBeDefined();
  });
});
