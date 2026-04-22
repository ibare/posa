import { describe, expect, it } from 'vitest';
import { COMPONENT_TYPES, PRESETS } from '../src/catalog/components';
import { ROLE_DEFINITIONS } from '../src/catalog/roles';
import { SLOT_DEFINITIONS } from '../src/catalog/slots';

const roleIds = new Set<string>(ROLE_DEFINITIONS.map((r) => r.id));
const componentIds = new Set<string>(COMPONENT_TYPES.map((c) => c.id));

describe('ROLE_DEFINITIONS', () => {
  it('role id가 유니크하다', () => {
    const ids = ROLE_DEFINITIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('id에 공백이나 대문자가 없다', () => {
    for (const r of ROLE_DEFINITIONS) {
      expect(r.id).toBe(r.id.toLowerCase());
      expect(r.id.includes(' ')).toBe(false);
    }
  });

  it('최소 20개 이상 정의되어 있다', () => {
    expect(ROLE_DEFINITIONS.length).toBeGreaterThanOrEqual(20);
  });
});

describe('COMPONENT_TYPES', () => {
  it('component id가 유니크하다', () => {
    const ids = COMPONENT_TYPES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('id에 공백이나 대문자가 없다', () => {
    for (const c of COMPONENT_TYPES) {
      expect(c.id).toBe(c.id.toLowerCase());
      expect(c.id.includes(' ')).toBe(false);
    }
  });

  it('typography는 alwaysIncluded 이다', () => {
    const typography = COMPONENT_TYPES.find((c) => c.id === 'typography');
    expect(typography?.alwaysIncluded).toBe(true);
  });

  it('40개 이상 정의되어 있다', () => {
    expect(COMPONENT_TYPES.length).toBeGreaterThanOrEqual(40);
  });
});

describe('SLOT_DEFINITIONS', () => {
  it('slot id가 유니크하다', () => {
    const ids = SLOT_DEFINITIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 slot.role이 ROLE_DEFINITIONS에 존재한다', () => {
    for (const slot of SLOT_DEFINITIONS) {
      expect(roleIds.has(slot.role), `slot ${slot.id} references unknown role ${slot.role}`).toBe(
        true,
      );
    }
  });

  it('모든 slot.componentType이 COMPONENT_TYPES에 존재한다', () => {
    for (const slot of SLOT_DEFINITIONS) {
      expect(
        componentIds.has(slot.componentType),
        `slot ${slot.id} references unknown componentType ${slot.componentType}`,
      ).toBe(true);
    }
  });

  it('slot.states는 비어 있지 않다', () => {
    for (const slot of SLOT_DEFINITIONS) {
      expect(slot.states.length).toBeGreaterThan(0);
    }
  });

  it('150~250개 범위 안이다', () => {
    expect(SLOT_DEFINITIONS.length).toBeGreaterThanOrEqual(150);
    expect(SLOT_DEFINITIONS.length).toBeLessThanOrEqual(250);
  });
});

describe('PRESETS', () => {
  it('preset id가 유니크하다', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('최소 4개 preset이 있다', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it('preset.components는 모두 유효한 component id 이다', () => {
    for (const p of PRESETS) {
      for (const cid of p.components) {
        expect(
          componentIds.has(cid),
          `preset ${p.id} references unknown component ${cid}`,
        ).toBe(true);
      }
    }
  });
});
