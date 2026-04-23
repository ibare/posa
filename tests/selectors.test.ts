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
import { ATTRIBUTE_IDS, createEmptyIR, type IR } from '../src/ir/types';

function seed(): { ir: IR; pid: string } {
  const { ir: ir1, primitiveId: pid } = addPrimitive(
    createEmptyIR(),
    { L: 0.6, C: 0.18, H: 145 },
    500,
  );
  return { ir: ir1, pid };
}

describe('enumerateAllSlotIds', () => {
  it('모든 component × variant × attribute 조합을 나열한다', () => {
    const ids = enumerateAllSlotIds();
    let expected = 0;
    for (const c of COMPONENT_DEFINITIONS) {
      const variants = c.variants?.length ?? 1;
      expected += variants * c.attributes.length;
    }
    expect(ids.length).toBe(expected);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 slot id는 등록된 attribute id로 끝난다', () => {
    const valid = new Set<string>(ATTRIBUTE_IDS);
    for (const id of enumerateAllSlotIds()) {
      expect(valid.has(getAttributeFromSlotId(id))).toBe(true);
    }
  });
});

describe('getSlotsByAttribute', () => {
  it('주어진 attribute로 끝나는 slot만 반환', () => {
    const slots = getSlotsByAttribute('background');
    for (const s of slots) expect(s.endsWith('.background')).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
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
      symbols: { ...ir1.symbols, primary: { primitive: pid, shade: 500 } },
    };
    expect(resolveSymbolColor(ir2, 'primary')).toEqual(
      ir1.primitives[pid].scale[500],
    );
  });

  it('symbol이 참조하는 primitive가 없으면 null', () => {
    const ir = createEmptyIR();
    const ir2: IR = {
      ...ir,
      symbols: { ...ir.symbols, primary: { primitive: 'missing', shade: 500 } },
    };
    expect(resolveSymbolColor(ir2, 'primary')).toBeNull();
  });
});

describe('resolveAttributeColor', () => {
  it('primitive 참조를 풀어낸다', () => {
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

  it('symbol 참조를 한 단계 더 풀어낸다', () => {
    const { ir: ir1, pid } = seed();
    const ir2: IR = {
      ...ir1,
      symbols: { ...ir1.symbols, primary: { primitive: pid, shade: 500 } },
      attributes: {
        ...ir1.attributes,
        background: { kind: 'symbol', symbol: 'primary' },
      },
    };
    expect(resolveAttributeColor(ir2, 'background')).toEqual(
      ir1.primitives[pid].scale[500],
    );
  });

  it('미정의 attribute는 null', () => {
    const ir = createEmptyIR();
    expect(resolveAttributeColor(ir, 'border')).toBeNull();
  });
});

describe('resolveSlotStateColor 상속 체인', () => {
  it('state override → slot.ref → attribute 순서로 폴백', () => {
    const { ir: ir1, pid } = seed();
    const base = ir1.primitives[pid];

    // attribute만 있음 → attribute 색
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

    // slot.ref 추가 → slot.ref 승
    const withSlotRef: IR = {
      ...attrOnly,
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

    // state override 추가 → state override 승
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
});

describe('getSlotDisplayName', () => {
  it('symbol 참조 slot은 접미사가 붙는다', () => {
    const ir = createEmptyIR();
    const ir2: IR = {
      ...ir,
      slots: {
        'button.primary.background': {
          ref: { kind: 'symbol', symbol: 'primary' },
          states: {},
        },
      },
    };
    expect(getSlotDisplayName('button.primary.background', ir2)).toBe(
      'button.primary.background.primary',
    );
  });

  it('primitive 참조나 미할당 slot은 원본 id 그대로', () => {
    const ir = createEmptyIR();
    expect(getSlotDisplayName('button.primary.background', ir)).toBe(
      'button.primary.background',
    );
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
