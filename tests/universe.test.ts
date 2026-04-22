import { describe, expect, it } from 'vitest';
import { applyPreset, deriveUniverse } from '../src/catalog/universe';
import { PRESETS } from '../src/catalog/components';
import { SLOT_DEFINITIONS } from '../src/catalog/slots';

describe('deriveUniverse', () => {
  it('빈 입력에도 typography 관련 slot이 포함된다', () => {
    const u = deriveUniverse([]);
    expect(u.componentTypes).toContain('typography');
    expect(u.slots.some((s) => s.componentType === 'typography')).toBe(true);
  });

  it('button만 선택하면 button과 typography의 slot만 남는다', () => {
    const u = deriveUniverse(['button']);
    for (const slot of u.slots) {
      expect(['typography', 'button']).toContain(slot.componentType);
    }
    expect(u.slots.some((s) => s.componentType === 'button')).toBe(true);
  });

  it('button 선택 시 button slot이 참조하는 role만 roles에 들어간다', () => {
    const u = deriveUniverse(['button']);
    const expectedRoles = new Set(
      SLOT_DEFINITIONS.filter((s) =>
        ['typography', 'button'].includes(s.componentType),
      ).map((s) => s.role),
    );
    const returned = new Set(u.roles.map((r) => r.id));
    expect(returned).toEqual(expectedRoles);
  });

  it('복수 컴포넌트 선택은 slot/role의 합집합이다', () => {
    const a = deriveUniverse(['button']);
    const b = deriveUniverse(['input']);
    const ab = deriveUniverse(['button', 'input']);

    const aSlotIds = new Set(a.slots.map((s) => s.id));
    const bSlotIds = new Set(b.slots.map((s) => s.id));
    const abSlotIds = new Set(ab.slots.map((s) => s.id));
    for (const id of aSlotIds) expect(abSlotIds.has(id)).toBe(true);
    for (const id of bSlotIds) expect(abSlotIds.has(id)).toBe(true);
  });

  it('동일 컴포넌트가 중복으로 들어와도 1번만 반영된다', () => {
    const u = deriveUniverse(['button', 'button', 'button']);
    const buttonSlotIds = u.slots
      .filter((s) => s.componentType === 'button')
      .map((s) => s.id);
    expect(new Set(buttonSlotIds).size).toBe(buttonSlotIds.length);
  });

  it('존재하지 않는 컴포넌트 id는 무시된다 (에러 아님)', () => {
    const u = deriveUniverse(['button', 'this-does-not-exist']);
    expect(u.componentTypes).not.toContain('this-does-not-exist');
    expect(u.componentTypes).toContain('button');
  });

  it('selected 목록에 typography가 없어도 자동 포함된다', () => {
    const u = deriveUniverse(['button']);
    expect(u.componentTypes).toContain('typography');
  });

  it('states는 선택된 컴포넌트의 모든 state를 Set으로 합친다', () => {
    const u = deriveUniverse(['button']);
    expect(u.states.has('default')).toBe(true);
    expect(u.states.has('hover')).toBe(true);
    expect(u.states.has('disabled')).toBe(true);
  });
});

describe('applyPreset', () => {
  it('알 수 없는 preset id는 빈 배열', () => {
    expect(applyPreset('nope')).toEqual([]);
  });

  it('minimal preset은 정의된 components를 복사해서 돌려준다', () => {
    const result = applyPreset('minimal');
    const preset = PRESETS.find((p) => p.id === 'minimal');
    expect(result).toEqual(preset?.components);
  });

  it('반환된 배열은 preset 원본과 다른 참조(복사본)이다', () => {
    const result = applyPreset('minimal');
    const preset = PRESETS.find((p) => p.id === 'minimal');
    expect(result).not.toBe(preset?.components);
  });

  it('preset 결과를 deriveUniverse에 넣으면 typography 포함된 universe가 된다', () => {
    const ids = applyPreset('dashboard');
    const u = deriveUniverse(ids);
    expect(u.componentTypes).toContain('typography');
    for (const id of ids) {
      expect(u.componentTypes).toContain(id);
    }
  });
});
