import { describe, expect, it } from 'vitest';
import {
  listPrimitiveReferences,
  shadeUsage,
} from '../src/color/atlas-ops';
import type { ComponentDefinition } from '../src/catalog/components';
import { addPrimitive } from '../src/color/primitive-ops';
import { createEmptyIR, type IR } from '../src/ir/types';

describe('listPrimitiveReferences', () => {
  it('symbol / attribute / slot / slot-state 참조를 모두 나열', () => {
    const { ir: ir1, primitiveId } = addPrimitive(
      createEmptyIR(),
      { L: 0.5, C: 0.15, H: 140 },
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
        background: { primitive: primitiveId, shade: 50 },
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
    const refs = listPrimitiveReferences(ir2, primitiveId);
    const kinds = refs.map((r) => r.kind).sort();
    expect(kinds).toEqual(['attribute', 'slot', 'slot-state', 'symbol']);
  });
});

describe('shadeUsage', () => {
  it('active slot × state를 상속 체인까지 resolve해 effective usage를 계산한다', () => {
    const { ir: ir1, primitiveId } = addPrimitive(
      createEmptyIR(),
      { L: 0.5, C: 0.15, H: 140 },
      500,
    );
    const components: ComponentDefinition[] = [
      {
        id: 'button',
        group: 'action',
        variants: [{ id: 'primary' }],
        attributes: ['background', 'border'],
        states: ['default', 'hover', 'active'],
      },
    ];
    // primary symbol은 500에 배정 (button.primary 슬롯이 활성화되기 위함).
    // border attribute는 700에 배정 → button.primary.border의 모든 state가 여기서 상속.
    // background는 slot.ref=500, hover override 500, active override 700.
    const ir2: IR = {
      ...ir1,
      symbols: {
        ...ir1.symbols,
        primary: { primitive: primitiveId, shade: 500 },
      },
      attributes: {
        ...ir1.attributes,
        border: { primitive: primitiveId, shade: 700 },
      },
      slots: {
        'button.primary.background': {
          ref: { kind: 'primitive', primitive: primitiveId, shade: 500 },
          states: {
            hover: { kind: 'primitive', primitive: primitiveId, shade: 500 },
            active: { kind: 'primitive', primitive: primitiveId, shade: 700 },
          },
        },
      },
    };
    const usage = shadeUsage(ir2, components, primitiveId);
    // symbol primary(500) = 1
    // background slot: default=500, hover=500, active=700
    // border slot(attribute 상속): default=700, hover=700, active=700
    expect(usage[500]).toBe(3);
    expect(usage[700]).toBe(4);
    expect(usage[50]).toBe(0);
    expect(usage[900]).toBe(0);
  });

  it('symbol이 유일한 소비자인 primitive도 소비자 수 1 이상으로 계산된다', () => {
    const { ir: ir1, primitiveId } = addPrimitive(
      createEmptyIR(),
      { L: 0.5, C: 0.15, H: 140 },
      500,
    );
    const ir2: IR = {
      ...ir1,
      symbols: {
        ...ir1.symbols,
        primary: { primitive: primitiveId, shade: 500 },
      },
    };
    // 어떤 컴포넌트도 선택되지 않은 상태라도 symbol 배정 자체는 카운트된다.
    const usage = shadeUsage(ir2, [], primitiveId);
    expect(usage[500]).toBe(1);
  });

  it('symbol이 비활성이면 해당 variant slot은 카운트하지 않는다', () => {
    const { ir, primitiveId } = addPrimitive(
      createEmptyIR(),
      { L: 0.5, C: 0.15, H: 140 },
      500,
    );
    const components: ComponentDefinition[] = [
      {
        id: 'button',
        group: 'action',
        variants: [{ id: 'primary' }],
        attributes: ['background'],
        states: ['default'],
      },
    ];
    // symbols.primary 배정 없음 → button.primary.* 전부 비활성.
    const usage = shadeUsage(ir, components, primitiveId);
    expect(usage[500]).toBe(0);
  });
});
