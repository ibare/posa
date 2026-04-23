import { describe, expect, it } from 'vitest';
import { addPrimitive } from '../src/color/primitive-ops';
import { contrastRatio, verdictOf } from '../src/color/contrast';
import { COMPONENT_DEFINITIONS } from '../src/catalog/components';
import {
  computeAttributeUsage,
  computeContrastPairs,
  computePrimitiveUsage,
  computeSymbolUsage,
  findHeadsUpItems,
} from '../src/ir/analysis';
import { createEmptyIR, type IR } from '../src/ir/types';

function seedGreen(): { ir: IR; pid: string } {
  const { ir, primitiveId } = addPrimitive(
    createEmptyIR(),
    { L: 0.6, C: 0.18, H: 145 },
    500,
  );
  return { ir, pid: primitiveId };
}

function seedRed(ir: IR): { ir: IR; pid: string } {
  const { ir: next, primitiveId } = addPrimitive(
    ir,
    { L: 0.55, C: 0.22, H: 25 },
    500,
  );
  return { ir: next, pid: primitiveId };
}

describe('computePrimitiveUsage', () => {
  it('symbol / attribute / slot / state-override에서 온 참조를 primitive별로 합산한다', () => {
    const { ir: base, pid } = seedGreen();
    const ir: IR = {
      ...base,
      symbols: {
        primary: { primitive: pid, shade: 500 },
      },
      attributes: {
        background: { primitive: pid, shade: 50 },
      },
      slots: {
        'button.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 600 },
          states: {
            hover: { kind: 'primitive', primitive: pid, shade: 700 },
          },
        },
      },
    };
    const usage = computePrimitiveUsage(ir);
    expect(usage.length).toBe(1);
    const bucket = usage[0];
    expect(bucket.primitiveId).toBe(pid);
    // symbol(1) + attribute(1) + slot.ref(1) + state.hover(1) = 4
    expect(bucket.totalRefs).toBe(4);
    expect(bucket.usedShades.sort()).toEqual([50, 500, 600, 700]);
  });

  it('참조가 더 많은 primitive가 앞에 온다', () => {
    const a = seedGreen();
    const b = seedRed(a.ir);
    const ir: IR = {
      ...b.ir,
      slots: {
        'button.background': {
          ref: { kind: 'primitive', primitive: b.pid, shade: 500 },
          states: {},
        },
        'button.text': {
          ref: { kind: 'primitive', primitive: b.pid, shade: 900 },
          states: {},
        },
        'card.background': {
          ref: { kind: 'primitive', primitive: a.pid, shade: 100 },
          states: {},
        },
      },
    };
    const usage = computePrimitiveUsage(ir);
    expect(usage[0].primitiveId).toBe(b.pid);
    expect(usage[1].primitiveId).toBe(a.pid);
  });
});

describe('computeSymbolUsage', () => {
  it('symbol을 직접 가리키는 slot만 카운트한다', () => {
    const { ir: base, pid } = seedGreen();
    const ir: IR = {
      ...base,
      symbols: {
        primary: { primitive: pid, shade: 500 },
      },
      slots: {
        'button.primary.background': {
          ref: { kind: 'symbol', symbol: 'primary' },
          states: {},
        },
        'button.primary.text': {
          // primitive 직접 참조는 symbol 사용에 안 잡힌다.
          ref: { kind: 'primitive', primitive: pid, shade: 50 },
          states: {},
        },
      },
    };
    const usage = computeSymbolUsage(ir, COMPONENT_DEFINITIONS);
    const primary = usage.find((u) => u.symbolId === 'primary');
    expect(primary).toBeDefined();
    expect(primary!.slotReferences).toBe(1);
  });
});

describe('computeAttributeUsage', () => {
  it('슬롯이 override하지 않으면 inheriting, override하면 covered만 증가', () => {
    const { ir: base, pid } = seedGreen();
    const ir: IR = {
      ...base,
      attributes: {
        background: { primitive: pid, shade: 50 },
      },
      slots: {
        'card.background': { ref: null, states: {} },
        'button.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 500 },
          states: {},
        },
      },
    };
    const usage = computeAttributeUsage(ir, COMPONENT_DEFINITIONS);
    const bg = usage.find((u) => u.attributeId === 'background');
    expect(bg).toBeDefined();
    expect(bg!.coveredSlots).toBeGreaterThanOrEqual(2);
    // button.background는 override이므로 inheriting에 들어가지 않는다.
    expect(bg!.inheritingSlots).toBeLessThan(bg!.coveredSlots);
  });
});

describe('contrastRatio / verdictOf', () => {
  it('검정 텍스트 × 흰 배경은 최대 21에 가까워진다', () => {
    const black = { L: 0, C: 0, H: 0 };
    const white = { L: 1, C: 0, H: 0 };
    const ratio = contrastRatio(black, white);
    expect(ratio).toBeGreaterThan(20);
    expect(verdictOf(ratio)).toBe('excellent');
  });

  it('같은 색끼리는 1에 수렴하며 poor로 분류된다', () => {
    const c = { L: 0.5, C: 0.1, H: 120 };
    const ratio = contrastRatio(c, c);
    expect(ratio).toBeCloseTo(1, 5);
    expect(verdictOf(ratio)).toBe('poor');
  });

  it('verdict 경계값이 스펙대로 분기한다', () => {
    expect(verdictOf(7.0)).toBe('excellent');
    expect(verdictOf(6.99)).toBe('good');
    expect(verdictOf(4.5)).toBe('good');
    expect(verdictOf(4.49)).toBe('large-only');
    expect(verdictOf(3.0)).toBe('large-only');
    expect(verdictOf(2.99)).toBe('poor');
  });
});

describe('computeContrastPairs', () => {
  it('같은 scope 안의 text × background 쌍만 대비를 계산한다', () => {
    const { ir: base, pid } = seedGreen();
    const ir: IR = {
      ...base,
      slots: {
        'button.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 950 },
          states: {},
        },
        'button.text': {
          ref: { kind: 'primitive', primitive: pid, shade: 50 },
          states: {},
        },
      },
    };
    const pairs = computeContrastPairs(ir, COMPONENT_DEFINITIONS);
    const buttonPair = pairs.find(
      (p) =>
        p.componentId === 'button' &&
        p.fgAttributeId === 'text' &&
        p.bgAttributeId === 'background',
    );
    expect(buttonPair).toBeDefined();
    expect(buttonPair!.ratio).toBeGreaterThan(4.5);
  });

  it('다른 컴포넌트끼리는 pair를 만들지 않는다', () => {
    const { ir: base, pid } = seedGreen();
    const ir: IR = {
      ...base,
      slots: {
        'button.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 950 },
          states: {},
        },
        'card.text': {
          ref: { kind: 'primitive', primitive: pid, shade: 50 },
          states: {},
        },
      },
    };
    const pairs = computeContrastPairs(ir, COMPONENT_DEFINITIONS);
    const cross = pairs.find(
      (p) => p.fgSlotId === 'card.text' && p.bgSlotId === 'button.background',
    );
    expect(cross).toBeUndefined();
  });
});

describe('findHeadsUpItems', () => {
  it('깨끗한 IR에서는 빈 배열', () => {
    const { ir } = seedGreen();
    expect(findHeadsUpItems(ir, COMPONENT_DEFINITIONS)).toEqual([]);
  });

  it('default와 hover의 L이 거의 같으면 warn을 생성', () => {
    const { ir: base, pid } = seedGreen();
    // shade 500과 500은 사실상 같은 색. L 차이는 0.
    const ir: IR = {
      ...base,
      slots: {
        'button.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 500 },
          states: {
            hover: { kind: 'primitive', primitive: pid, shade: 500 },
          },
        },
      },
    };
    const items = findHeadsUpItems(ir, COMPONENT_DEFINITIONS);
    const hoverWarn = items.find((i) => i.kind === 'hover-invisible');
    expect(hoverWarn).toBeDefined();
    if (hoverWarn && hoverWarn.kind === 'hover-invisible') {
      expect(hoverWarn.severity).toBe('warn');
      expect(hoverWarn.slotId).toBe('button.background');
    }
  });

  it('success와 info가 비슷한 hue에 있으면 혼동 경고를 낸다', () => {
    // 같은 primitive(green)를 success와 info에 둘 다 바인딩 → hue 거리 0.
    const { ir: base, pid } = seedGreen();
    const ir: IR = {
      ...base,
      symbols: {
        success: { primitive: pid, shade: 500 },
        info: { primitive: pid, shade: 600 },
      },
    };
    const items = findHeadsUpItems(ir, COMPONENT_DEFINITIONS);
    const clash = items.find((i) => i.kind === 'status-clash');
    expect(clash).toBeDefined();
    if (clash && clash.kind === 'status-clash') {
      expect(new Set([clash.symbolA, clash.symbolB])).toEqual(
        new Set(['success', 'info']),
      );
    }
  });
});
