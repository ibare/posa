import { describe, expect, it } from 'vitest';
import {
  addPrimitive,
  adjustPrimitiveAnchor,
  countPrimitiveReferences,
  findOrphanPrimitives,
  hueDistance,
  hueFamily,
  isWithinScale,
  nextPrimitiveId,
} from '../src/color/primitive-ops';
import { createEmptyIR, type IR } from '../src/ir/types';

describe('hueFamily', () => {
  it('chroma가 임계치보다 낮으면 neutral', () => {
    expect(hueFamily({ L: 0.5, C: 0.01, H: 120 })).toBe('neutral');
    expect(hueFamily({ L: 0.5, C: 0.029, H: 10 })).toBe('neutral');
  });

  it('경계 hue 값에서 올바른 family를 반환', () => {
    const c = 0.1;
    expect(hueFamily({ L: 0.5, C: c, H: 0 })).toBe('red');
    expect(hueFamily({ L: 0.5, C: c, H: 14.9 })).toBe('red');
    expect(hueFamily({ L: 0.5, C: c, H: 15 })).toBe('orange');
    expect(hueFamily({ L: 0.5, C: c, H: 45 })).toBe('yellow');
    expect(hueFamily({ L: 0.5, C: c, H: 75 })).toBe('green');
    expect(hueFamily({ L: 0.5, C: c, H: 164.9 })).toBe('green');
    expect(hueFamily({ L: 0.5, C: c, H: 165 })).toBe('cyan');
    expect(hueFamily({ L: 0.5, C: c, H: 195 })).toBe('blue');
    expect(hueFamily({ L: 0.5, C: c, H: 255 })).toBe('purple');
    expect(hueFamily({ L: 0.5, C: c, H: 285 })).toBe('magenta');
    expect(hueFamily({ L: 0.5, C: c, H: 315 })).toBe('pink');
    expect(hueFamily({ L: 0.5, C: c, H: 344.9 })).toBe('pink');
    expect(hueFamily({ L: 0.5, C: c, H: 345 })).toBe('red');
  });
});

describe('hueDistance', () => {
  it('원형 거리를 돌려준다', () => {
    expect(hueDistance(10, 350)).toBe(20);
    expect(hueDistance(350, 10)).toBe(20);
    expect(hueDistance(0, 180)).toBe(180);
    expect(hueDistance(120, 150)).toBe(30);
  });
});

describe('nextPrimitiveId', () => {
  it('빈 IR에서 첫 id는 "-a"', () => {
    const ir = createEmptyIR();
    expect(nextPrimitiveId(ir, 'green')).toBe('green-a');
  });

  it('기존 primitive가 있으면 다음 알파벳을 할당', () => {
    const ir = createEmptyIR();
    const { ir: ir1 } = addPrimitive(ir, { L: 0.6, C: 0.15, H: 140 }, 500);
    const { ir: ir2 } = addPrimitive(ir1, { L: 0.7, C: 0.16, H: 145 }, 500);
    expect(nextPrimitiveId(ir2, 'green')).toBe('green-c');
  });

  it('다른 family는 서로 간섭하지 않음', () => {
    const ir = createEmptyIR();
    const { ir: ir1 } = addPrimitive(ir, { L: 0.6, C: 0.15, H: 140 }, 500);
    expect(nextPrimitiveId(ir1, 'red')).toBe('red-a');
  });
});

describe('addPrimitive', () => {
  it('primitive가 IR에 추가되고 유니크 id를 가짐', () => {
    const ir = createEmptyIR();
    const { ir: ir1, primitiveId: p1 } = addPrimitive(
      ir,
      { L: 0.6, C: 0.15, H: 140 },
      500,
    );
    const { ir: ir2, primitiveId: p2 } = addPrimitive(
      ir1,
      { L: 0.6, C: 0.15, H: 141 },
      500,
    );
    expect(p1).not.toBe(p2);
    expect(Object.keys(ir2.primitives).sort()).toEqual([p1, p2].sort());
  });
});

describe('adjustPrimitiveAnchor', () => {
  it('지정한 primitive만 변경하고 다른 primitive는 그대로', () => {
    const ir = createEmptyIR();
    const { ir: ir1, primitiveId: p1 } = addPrimitive(
      ir,
      { L: 0.6, C: 0.15, H: 140 },
      500,
    );
    const { ir: ir2, primitiveId: p2 } = addPrimitive(
      ir1,
      { L: 0.6, C: 0.15, H: 20 },
      500,
    );
    const before = ir2.primitives[p2];
    const adjusted = adjustPrimitiveAnchor(ir2, p1, { L: 0.55, C: 0.2, H: 142 });
    expect(adjusted.primitives[p1].anchor).toEqual({ L: 0.55, C: 0.2, H: 142 });
    expect(adjusted.primitives[p2]).toBe(before);
  });

  it('anchorShade는 유지', () => {
    const ir = createEmptyIR();
    const { ir: ir1, primitiveId: p1 } = addPrimitive(
      ir,
      { L: 0.45, C: 0.2, H: 29 },
      700,
    );
    const adjusted = adjustPrimitiveAnchor(ir1, p1, { L: 0.5, C: 0.22, H: 31 });
    expect(adjusted.primitives[p1].anchorShade).toBe(700);
  });
});

describe('countPrimitiveReferences', () => {
  it('symbol / attribute / slot.ref / slot.state override를 모두 카운트', () => {
    const ir0 = createEmptyIR();
    const { ir: ir1, primitiveId: pid } = addPrimitive(
      ir0,
      { L: 0.6, C: 0.15, H: 140 },
      500,
    );
    const ir2: IR = {
      ...ir1,
      symbols: {
        ...ir1.symbols,
        primary: { primitive: pid, shade: 500 },
      },
      attributes: {
        ...ir1.attributes,
        background: { kind: 'primitive', primitive: pid, shade: 50 },
      },
      slots: {
        'button.primary.background': {
          ref: { kind: 'primitive', primitive: pid, shade: 500 },
          states: {
            hover: { kind: 'primitive', primitive: pid, shade: 600 },
            active: { kind: 'primitive', primitive: pid, shade: 700 },
          },
        },
      },
    };
    expect(countPrimitiveReferences(ir2, pid)).toBe(5);
  });
});

describe('findOrphanPrimitives', () => {
  it('참조 수 0인 primitive id들만 반환', () => {
    const ir0 = createEmptyIR();
    const { ir: ir1, primitiveId: p1 } = addPrimitive(
      ir0,
      { L: 0.6, C: 0.15, H: 140 },
      500,
    );
    const { ir: ir2, primitiveId: p2 } = addPrimitive(
      ir1,
      { L: 0.55, C: 0.18, H: 20 },
      500,
    );
    const ir3: IR = {
      ...ir2,
      symbols: {
        ...ir2.symbols,
        primary: { primitive: p1, shade: 500 },
      },
    };
    expect(findOrphanPrimitives(ir3)).toEqual([p2]);
  });
});

describe('isWithinScale', () => {
  it('같은 hue·비슷한 chroma는 within', () => {
    const ir = createEmptyIR();
    const { ir: ir1, primitiveId: pid } = addPrimitive(
      ir,
      { L: 0.6, C: 0.15, H: 140 },
      500,
    );
    expect(
      isWithinScale({ L: 0.3, C: 0.16, H: 145 }, ir1.primitives[pid]),
    ).toBe(true);
  });

  it('hue가 크게 다르면 out', () => {
    const ir = createEmptyIR();
    const { ir: ir1, primitiveId: pid } = addPrimitive(
      ir,
      { L: 0.6, C: 0.15, H: 140 },
      500,
    );
    expect(
      isWithinScale({ L: 0.6, C: 0.15, H: 200 }, ir1.primitives[pid]),
    ).toBe(false);
  });

  it('chroma 차이가 크면 out', () => {
    const ir = createEmptyIR();
    const { ir: ir1, primitiveId: pid } = addPrimitive(
      ir,
      { L: 0.6, C: 0.15, H: 140 },
      500,
    );
    expect(
      isWithinScale({ L: 0.6, C: 0.3, H: 140 }, ir1.primitives[pid]),
    ).toBe(false);
  });
});
