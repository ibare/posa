import { describe, expect, it } from 'vitest';
import { ATTRIBUTE_DEFINITIONS } from '../src/catalog/attributes';
import {
  COMPONENT_DEFINITIONS,
  findComponent,
  findComponentBySlotId,
} from '../src/catalog/components';
import { SYMBOL_DEFINITIONS } from '../src/catalog/symbols';
import {
  ATTRIBUTE_IDS,
  STATE_IDS,
  SYMBOL_IDS,
} from '../src/ir/types';

describe('SYMBOL_DEFINITIONS', () => {
  it('모든 SymbolId를 정확히 한 번씩 정의한다', () => {
    const ids = SYMBOL_DEFINITIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(SYMBOL_IDS));
  });

  it('id에 공백이나 대문자가 없다', () => {
    for (const s of SYMBOL_DEFINITIONS) {
      expect(s.id).toBe(s.id.toLowerCase());
      expect(s.id.includes(' ')).toBe(false);
    }
  });
});

describe('ATTRIBUTE_DEFINITIONS', () => {
  it('모든 AttributeId를 정확히 한 번씩 정의한다', () => {
    const ids = ATTRIBUTE_DEFINITIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(ATTRIBUTE_IDS));
  });

  it('id에 공백이나 대문자가 없다', () => {
    for (const a of ATTRIBUTE_DEFINITIONS) {
      expect(a.id).toBe(a.id.toLowerCase());
      expect(a.id.includes(' ')).toBe(false);
    }
  });
});

describe('COMPONENT_DEFINITIONS', () => {
  it('component id가 유니크하다', () => {
    const ids = COMPONENT_DEFINITIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('id에 공백이나 대문자가 없다', () => {
    for (const c of COMPONENT_DEFINITIONS) {
      expect(c.id).toBe(c.id.toLowerCase());
      expect(c.id.includes(' ')).toBe(false);
    }
  });

  it('component.attributes는 모두 정의된 AttributeId 이다', () => {
    const valid = new Set<string>(ATTRIBUTE_IDS);
    for (const c of COMPONENT_DEFINITIONS) {
      for (const a of c.attributes) {
        expect(valid.has(a), `${c.id}.${a} not in ATTRIBUTE_IDS`).toBe(true);
      }
    }
  });

  it('component.states는 모두 정의된 StateId 이다 + 비어있지 않다', () => {
    const valid = new Set<string>(STATE_IDS);
    for (const c of COMPONENT_DEFINITIONS) {
      expect(c.states.length).toBeGreaterThan(0);
      for (const s of c.states) {
        expect(valid.has(s), `${c.id} has unknown state ${s}`).toBe(true);
      }
    }
  });

  it('component.variants가 있으면 id가 고유하다', () => {
    for (const c of COMPONENT_DEFINITIONS) {
      if (!c.variants) continue;
      const ids = c.variants.map((v) => v.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('findComponent / findComponentBySlotId는 등록된 컴포넌트를 돌려준다', () => {
    for (const c of COMPONENT_DEFINITIONS) {
      expect(findComponent(c.id)).toBe(c);
      const sampleSlot = c.variants
        ? `${c.id}.${c.variants[0].id}.${c.attributes[0]}`
        : `${c.id}.${c.attributes[0]}`;
      expect(findComponentBySlotId(sampleSlot)).toBe(c);
    }
  });

  it('unknown id는 undefined', () => {
    expect(findComponent('does-not-exist')).toBeUndefined();
    expect(findComponentBySlotId('does.not.exist')).toBeUndefined();
  });
});
