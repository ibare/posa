import { describe, expect, it } from 'vitest';
import {
  AtlasOpError,
  listPrimitiveReferences,
  mergePrimitive,
  removePrimitive,
  shadeUsage,
} from '../src/color/atlas-ops';
import { addPrimitive } from '../src/color/primitive-ops';
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

describe('removePrimitive', () => {
  it('참조가 있으면 에러', () => {
    const { ir: ir1, primitiveId } = addPrimitive(
      emptyIR(),
      { L: 0.5, C: 0.15, H: 140 },
      500,
    );
    const withRef: IR = {
      ...ir1,
      roles: { primary: { primitive: primitiveId, shade: 500 } },
    };
    expect(() => removePrimitive(withRef, primitiveId)).toThrow(AtlasOpError);
  });

  it('고아는 제거', () => {
    const { ir: ir1, primitiveId } = addPrimitive(
      emptyIR(),
      { L: 0.5, C: 0.15, H: 140 },
      500,
    );
    const after = removePrimitive(ir1, primitiveId);
    expect(after.primitives[primitiveId]).toBeUndefined();
  });
});

describe('mergePrimitive', () => {
  it('source 참조가 target으로 옮겨지고 source는 제거됨', () => {
    const base = emptyIR();
    const { ir: ir1, primitiveId: srcId } = addPrimitive(
      base,
      { L: 0.55, C: 0.15, H: 140 },
      500,
    );
    const { ir: ir2, primitiveId: tgtId } = addPrimitive(
      ir1,
      { L: 0.6, C: 0.18, H: 145 },
      500,
    );
    const ir3: IR = {
      ...ir2,
      roles: {
        primary: { primitive: srcId, shade: 500 },
      },
      slots: {
        'button.primary.bg': {
          role: 'primary',
          states: { hover: { primitive: srcId, shade: 600 } },
        },
      },
    };

    const after = mergePrimitive(ir3, srcId, tgtId);
    expect(after.primitives[srcId]).toBeUndefined();
    expect(after.roles['primary'].primitive).toBe(tgtId);
    expect(after.slots['button.primary.bg'].states['hover']?.primitive).toBe(
      tgtId,
    );
  });

  it('shade는 가장 가까운 L 값으로 리매핑', () => {
    const base = emptyIR();
    // source: anchor 500 L=0.45
    const { ir: ir1, primitiveId: srcId } = addPrimitive(
      base,
      { L: 0.45, C: 0.18, H: 140 },
      500,
    );
    // target: anchor 500 L=0.6 — target.scale[500]≈0.6, target.scale[700]≈0.4 등
    const { ir: ir2, primitiveId: tgtId } = addPrimitive(
      ir1,
      { L: 0.6, C: 0.18, H: 145 },
      500,
    );
    const ir3: IR = {
      ...ir2,
      roles: {
        primary: { primitive: srcId, shade: 500 },
      },
    };
    const after = mergePrimitive(ir3, srcId, tgtId);
    // source의 500(L=0.45)에 가장 가까운 L을 가진 target shade로 리매핑. 대체로 600~700 근처.
    const target = ir2.primitives[tgtId];
    const remappedShade = after.roles['primary'].shade;
    const remappedL = target.scale[remappedShade].L;
    // target의 모든 shade 중 0.45에 가장 가까운 L을 찾아 비교
    let bestL = Infinity;
    for (const c of Object.values(target.scale)) {
      if (Math.abs(c.L - 0.45) < Math.abs(bestL - 0.45)) bestL = c.L;
    }
    expect(remappedL).toBe(bestL);
  });

  it('동일 id 병합은 에러', () => {
    const { ir: ir1, primitiveId } = addPrimitive(
      emptyIR(),
      { L: 0.5, C: 0.15, H: 140 },
      500,
    );
    expect(() => mergePrimitive(ir1, primitiveId, primitiveId)).toThrow(
      AtlasOpError,
    );
  });
});

describe('listPrimitiveReferences', () => {
  it('role과 slot state 참조를 모두 나열', () => {
    const { ir: ir1, primitiveId } = addPrimitive(
      emptyIR(),
      { L: 0.5, C: 0.15, H: 140 },
      500,
    );
    const ir2: IR = {
      ...ir1,
      roles: { primary: { primitive: primitiveId, shade: 500 } },
      slots: {
        'button.primary.bg': {
          role: 'primary',
          states: { hover: { primitive: primitiveId, shade: 600 } },
        },
      },
    };
    const refs = listPrimitiveReferences(ir2, primitiveId);
    expect(refs.roles).toEqual(['primary']);
    expect(refs.slotStates).toEqual([
      { slotId: 'button.primary.bg', state: 'hover' },
    ]);
  });
});

describe('shadeUsage', () => {
  it('shade별 사용 횟수 카운트', () => {
    const { ir: ir1, primitiveId } = addPrimitive(
      emptyIR(),
      { L: 0.5, C: 0.15, H: 140 },
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
            hover: { primitive: primitiveId, shade: 500 },
            active: { primitive: primitiveId, shade: 700 },
          },
        },
      },
    };
    const usage = shadeUsage(ir2, primitiveId);
    expect(usage[500]).toBe(2);
    expect(usage[50]).toBe(1);
    expect(usage[700]).toBe(1);
    expect(usage[900]).toBe(0);
  });
});
