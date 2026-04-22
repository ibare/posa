import { describe, expect, it } from 'vitest';
import { createPrimitive } from '../src/color/primitive';
import { resolveRoleColor, resolveSlotColor } from '../src/color/resolve';
import type { IR } from '../src/ir/types';

const buildIr = (): IR => {
  const green = createPrimitive('green-a', { L: 0.58, C: 0.2, H: 150 }, 500);
  const neutral = createPrimitive('neutral-a', { L: 0.5, C: 0.005, H: 0 }, 500);

  return {
    meta: {
      version: '1.0',
      createdAt: 0,
      updatedAt: 0,
      componentTypes: ['button'],
    },
    primitives: {
      'green-a': green,
      'neutral-a': neutral,
    },
    roles: {
      primary: { primitive: 'green-a', shade: 500 },
      surface: { primitive: 'neutral-a', shade: 50 },
    },
    slots: {
      'button.primary.bg': {
        role: 'primary',
        states: {
          hover: { primitive: 'green-a', shade: 600 },
        },
      },
      'surface.base': {
        role: 'surface',
        states: {},
      },
    },
  };
};

describe('resolveRoleColor', () => {
  it('role → primitive → scale[shade]를 풀어낸다', () => {
    const ir = buildIr();
    const color = resolveRoleColor(ir, 'primary');
    expect(color).not.toBeNull();
    expect(color).toEqual(ir.primitives['green-a'].scale[500]);
  });

  it('존재하지 않는 role은 null', () => {
    const ir = buildIr();
    expect(resolveRoleColor(ir, 'nope')).toBeNull();
  });

  it('role이 참조하는 primitive가 없으면 null', () => {
    const ir = buildIr();
    ir.roles['broken'] = { primitive: 'missing', shade: 500 };
    expect(resolveRoleColor(ir, 'broken')).toBeNull();
  });
});

describe('resolveSlotColor', () => {
  it('state 인자가 없으면 slot.role의 기본 색을 돌려준다', () => {
    const ir = buildIr();
    const color = resolveSlotColor(ir, 'button.primary.bg');
    expect(color).toEqual(ir.primitives['green-a'].scale[500]);
  });

  it('state override가 있으면 override를 우선한다', () => {
    const ir = buildIr();
    const color = resolveSlotColor(ir, 'button.primary.bg', 'hover');
    expect(color).toEqual(ir.primitives['green-a'].scale[600]);
  });

  it('state가 지정됐지만 override가 없으면 role로 폴백한다', () => {
    const ir = buildIr();
    const color = resolveSlotColor(ir, 'button.primary.bg', 'active');
    expect(color).toEqual(ir.primitives['green-a'].scale[500]);
  });

  it('존재하지 않는 slot은 null', () => {
    const ir = buildIr();
    expect(resolveSlotColor(ir, 'does.not.exist')).toBeNull();
  });

  it('state override가 없는 빈 states 객체도 role로 풀린다', () => {
    const ir = buildIr();
    const color = resolveSlotColor(ir, 'surface.base', 'hover');
    expect(color).toEqual(ir.primitives['neutral-a'].scale[50]);
  });
});
