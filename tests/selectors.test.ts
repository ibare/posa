import { describe, expect, it } from 'vitest';
import { addPrimitive } from '../src/color/primitive-ops';
import { COMPONENT_DEFINITIONS } from '../src/catalog/components';
import {
  enumerateAllSlotIds,
  getAttributeFromSlotId,
  getSlotDisplayName,
  getSlotsByAttribute,
  isSlotStateDirectlyAssigned,
  resolveAttributeColor,
  resolveSlotStateColor,
  resolveSymbolColor,
} from '../src/ir/selectors';
import {
  ATTRIBUTE_IDS,
  BLACK_OKLCH,
  WHITE_OKLCH,
  createEmptyIR,
  type IR,
} from '../src/ir/types';

function seed(): { ir: IR; pid: string } {
  const { ir: ir1, primitiveId: pid } = addPrimitive(
    createEmptyIR(),
    { L: 0.6, C: 0.18, H: 145 },
    500,
  );
  return { ir: ir1, pid };
}

describe('enumerateAllSlotIds', () => {
  it('모든 component × (기본형 + variant들) × attribute 조합을 나열한다', () => {
    const ids = enumerateAllSlotIds(COMPONENT_DEFINITIONS);
    let expected = 0;
    for (const c of COMPONENT_DEFINITIONS) {
      // 기본형 1 + variant 수
      const lanes = 1 + (c.variants?.length ?? 0);
      expected += lanes * c.attributes.length;
    }
    expect(ids.length).toBe(expected);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 slot id는 등록된 attribute id로 끝난다', () => {
    const valid = new Set<string>(ATTRIBUTE_IDS);
    for (const id of enumerateAllSlotIds(COMPONENT_DEFINITIONS)) {
      expect(valid.has(getAttributeFromSlotId(id))).toBe(true);
    }
  });
});

describe('getSlotsByAttribute', () => {
  it('주어진 attribute로 끝나는 활성 slot만 반환', () => {
    const { ir } = seed();
    const slots = getSlotsByAttribute(COMPONENT_DEFINITIONS, 'background', ir);
    for (const s of slots) expect(s.endsWith('.background')).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
  });

  it('symbol 미할당 시 그 symbol을 이름으로 가진 variant slot은 제외된다', () => {
    const ir = createEmptyIR();
    const slots = getSlotsByAttribute(COMPONENT_DEFINITIONS, 'background', ir);
    expect(slots).not.toContain('button.primary.background');
    expect(slots).not.toContain('badge.error.background');
    // 기본형 slot과 variants 없는 컴포넌트는 남는다.
    expect(slots).toContain('button.background');
    expect(slots).toContain('card.background');
  });

  it('symbol을 할당하면 해당 variant slot이 활성화된다', () => {
    const { ir: ir1, pid } = seed();
    const ir2: IR = {
      ...ir1,
      symbols: { ...ir1.symbols, primary: { kind: 'primitive', primitive: pid, shade: 500 } },
    };
    const slots = getSlotsByAttribute(COMPONENT_DEFINITIONS, 'background', ir2);
    expect(slots).toContain('button.primary.background');
  });
});

describe('resolveSymbolColor', () => {
  it('정의되지 않은 symbol은 null', () => {
    const ir = createEmptyIR();
    expect(resolveSymbolColor(ir, 'primary')).toBeNull();
  });

  it('primitive를 가리키는 symbol은 scale[shade]를 돌려준다', () => {
    const { ir: ir1, pid } = seed();
    const ir2: IR = {
      ...ir1,
      symbols: { ...ir1.symbols, primary: { kind: 'primitive', primitive: pid, shade: 500 } },
    };
    expect(resolveSymbolColor(ir2, 'primary')).toEqual(
      ir1.primitives[pid].scale[500],
    );
  });

  it('symbol이 참조하는 primitive가 없으면 null', () => {
    const ir = createEmptyIR();
    const ir2: IR = {
      ...ir,
      symbols: { ...ir.symbols, primary: { kind: 'primitive', primitive: 'missing', shade: 500 } },
    };
    expect(resolveSymbolColor(ir2, 'primary')).toBeNull();
  });

  it('system symbol white/black은 createEmptyIR에 항상 심겨 있다', () => {
    const ir = createEmptyIR();
    expect(resolveSymbolColor(ir, 'white')).toEqual(WHITE_OKLCH);
    expect(resolveSymbolColor(ir, 'black')).toEqual(BLACK_OKLCH);
  });
});

describe('resolveAttributeColor', () => {
  it('primitive 스냅샷을 풀어낸다', () => {
    const { ir: ir1, pid } = seed();
    const ir2: IR = {
      ...ir1,
      attributes: {
        ...ir1.attributes,
        background: { kind: 'primitive', primitive: pid, shade: 100 },
      },
    };
    expect(resolveAttributeColor(ir2, 'background')).toEqual(
      ir1.primitives[pid].scale[100],
    );
  });

  it('미정의 attribute는 null', () => {
    const ir = createEmptyIR();
    expect(resolveAttributeColor(ir, 'border')).toBeNull();
  });
});

describe('resolveSlotStateColor 상속 체인', () => {
  it('state override → slot.ref → attribute 순서로 폴백 (자동 symbol 바인딩 없음)', () => {
    const { ir: ir1, pid } = seed();
    const base = ir1.primitives[pid];

    // attribute만 있음 → attribute로 폴백
    const attrOnly: IR = {
      ...ir1,
      attributes: {
        ...ir1.attributes,
        background: { kind: 'primitive', primitive: pid, shade: 50 },
      },
      slots: {
        'button.primary.background': { ref: null, states: {} },
      },
    };
    expect(
      resolveSlotStateColor(attrOnly, 'button.primary.background'),
    ).toEqual(base.scale[50]);

    // primary symbol을 할당해도 slot.ref가 비면 attribute로 폴백 (자동 바인딩 안 됨)
    const withSymbol: IR = {
      ...attrOnly,
      symbols: { ...attrOnly.symbols, primary: { kind: 'primitive', primitive: pid, shade: 300 } },
    };
    expect(
      resolveSlotStateColor(withSymbol, 'button.primary.background'),
    ).toEqual(base.scale[50]);

    // 사용자가 명시적으로 symbol live link을 만들면 그 때 따라간다
    const withExplicitSymbolRef: IR = {
      ...withSymbol,
      slots: {
        'button.primary.background': {
          ref: { kind: 'symbol', symbol: 'primary' },
          states: {},
        },
      },
    };
    expect(
      resolveSlotStateColor(withExplicitSymbolRef, 'button.primary.background'),
    ).toEqual(base.scale[300]);

    // 명시적 primitive ref → 그 색
    const withSlotRef: IR = {
      ...withSymbol,
      slots: {
        'button.primary.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 500 },
          states: {},
        },
      },
    };
    expect(
      resolveSlotStateColor(withSlotRef, 'button.primary.background'),
    ).toEqual(base.scale[500]);

    // state override → slot.ref 보다 우선
    const withStateOverride: IR = {
      ...withSlotRef,
      slots: {
        'button.primary.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 500 },
          states: {
            hover: { kind: 'primitive', primitive: pid, shade: 600 },
          },
        },
      },
    };
    expect(
      resolveSlotStateColor(withStateOverride, 'button.primary.background', 'hover'),
    ).toEqual(base.scale[600]);
    // state override가 없는 active는 slot.ref로 폴백
    expect(
      resolveSlotStateColor(withStateOverride, 'button.primary.background', 'active'),
    ).toEqual(base.scale[500]);
  });

  it('모든 것이 비어 있으면 null', () => {
    const ir = createEmptyIR();
    expect(
      resolveSlotStateColor(ir, 'button.primary.background'),
    ).toBeNull();
  });

  it('symbol 변경은 명시적으로 그 symbol을 참조하는 slot에만 영향 (라이브 링크 시나리오)', () => {
    const { ir: ir1, pid: pidA } = seed();
    const { ir: ir2, primitiveId: pidB } = addPrimitive(
      ir1,
      { L: 0.5, C: 0.2, H: 30 },
      500,
    );
    // attribute background = pidA snapshot, primary = pidB
    // 사용자가 button.primary.background에만 명시적으로 primary symbol 라이브 링크 설정
    const ir3: IR = {
      ...ir2,
      symbols: { ...ir2.symbols, primary: { kind: 'primitive', primitive: pidB, shade: 500 } },
      attributes: {
        ...ir2.attributes,
        background: { kind: 'primitive', primitive: pidA, shade: 50 },
      },
      slots: {
        'button.primary.background': {
          ref: { kind: 'symbol', symbol: 'primary' },
          states: {},
        },
      },
    };
    // 명시적 symbol ref slot은 pidB.500
    expect(
      resolveSlotStateColor(ir3, 'button.primary.background'),
    ).toEqual(ir2.primitives[pidB].scale[500]);
    // 같은 variant라도 명시적 ref 없는 slot(border/text)은 attribute snapshot
    expect(
      resolveSlotStateColor(ir3, 'button.primary.border'),
    ).toBeNull(); // border attribute 미할당
    // outline, card 는 pidA.50 (attribute snapshot)
    expect(
      resolveSlotStateColor(ir3, 'button.outline.background'),
    ).toEqual(ir2.primitives[pidA].scale[50]);
    expect(resolveSlotStateColor(ir3, 'card.background')).toEqual(
      ir2.primitives[pidA].scale[50],
    );

    // primary 변경
    const ir4: IR = {
      ...ir3,
      symbols: { ...ir3.symbols, primary: { kind: 'primitive', primitive: pidB, shade: 700 } },
    };
    // 명시적 symbol ref만 변경
    expect(
      resolveSlotStateColor(ir4, 'button.primary.background'),
    ).toEqual(ir2.primitives[pidB].scale[700]);
    // 그 외는 그대로
    expect(
      resolveSlotStateColor(ir4, 'button.outline.background'),
    ).toEqual(ir2.primitives[pidA].scale[50]);
    expect(resolveSlotStateColor(ir4, 'card.background')).toEqual(
      ir2.primitives[pidA].scale[50],
    );
  });
});

describe('getSlotDisplayName', () => {
  it('명시적 symbol 참조 slot도 base id 그대로(접미사 없음)', () => {
    const ir = createEmptyIR();
    const ir2: IR = {
      ...ir,
      slots: {
        'card.background': {
          ref: { kind: 'symbol', symbol: 'primary' },
          states: {},
        },
      },
    };
    expect(getSlotDisplayName('card.background', ir2)).toBe('card.background');
  });

  it('명시적 ref가 없는 variant slot은 접미사 없이 base id', () => {
    const ir = createEmptyIR();
    expect(getSlotDisplayName('button.primary.background', ir)).toBe(
      'button.primary.background',
    );
  });

  it('명시적 primitive 참조 slot은 접미사 없음', () => {
    const { ir: ir1, pid } = seed();
    const ir2: IR = {
      ...ir1,
      slots: {
        'button.primary.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 500 },
          states: {},
        },
      },
    };
    expect(getSlotDisplayName('button.primary.background', ir2)).toBe(
      'button.primary.background',
    );
  });

  it('SymbolId가 아닌 variant slot은 접미사 없음', () => {
    const ir = createEmptyIR();
    expect(getSlotDisplayName('button.outline.background', ir)).toBe(
      'button.outline.background',
    );
    expect(getSlotDisplayName('card.background', ir)).toBe('card.background');
  });
});

describe('isSlotStateDirectlyAssigned', () => {
  it('default는 slot.ref가 있을 때만 true', () => {
    const ir = createEmptyIR();
    const { pid } = seed();
    const ir2: IR = {
      ...ir,
      slots: {
        'button.primary.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 500 },
          states: {},
        },
      },
    };
    expect(
      isSlotStateDirectlyAssigned(ir2, 'button.primary.background', 'default'),
    ).toBe(true);
    expect(
      isSlotStateDirectlyAssigned(ir2, 'button.primary.background', 'hover'),
    ).toBe(false);
  });
});
