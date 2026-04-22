import { describe, expect, it } from 'vitest';
import { createPrimitive, deriveScale } from '../src/color/primitive';
import { SHADE_INDICES, type ShadeIndex } from '../src/ir/types';

describe('deriveScale', () => {
  it('11개 shade 전부를 반환한다', () => {
    const scale = deriveScale({ L: 0.58, C: 0.2, H: 150 }, 500);
    expect(Object.keys(scale).map(Number).sort((a, b) => a - b)).toEqual(
      [...SHADE_INDICES],
    );
  });

  it('anchor shade 위치에 anchor 값이 정확히 들어간다', () => {
    const anchor = { L: 0.72, C: 0.17, H: 200 };
    const scale = deriveScale(anchor, 500);
    expect(scale[500]).toEqual(anchor);
  });

  it('anchor shade가 500이 아닐 때도 해당 shade에 anchor가 들어간다', () => {
    const anchor = { L: 0.45, C: 0.22, H: 29 };
    const scale = deriveScale(anchor, 700);
    expect(scale[700]).toEqual(anchor);
  });

  it('모든 shade가 동일한 hue를 공유한다', () => {
    const anchor = { L: 0.58, C: 0.18, H: 260 };
    const scale = deriveScale(anchor, 500);
    for (const s of SHADE_INDICES) {
      expect(scale[s].H).toBe(260);
    }
  });

  it('neutral anchor(C < 0.02)는 전체 scale에서 C가 변하지 않는다', () => {
    const anchor = { L: 0.58, C: 0.005, H: 0 };
    const scale = deriveScale(anchor, 500);
    for (const s of SHADE_INDICES) {
      expect(scale[s].C).toBe(0.005);
    }
  });

  it('colorful anchor의 경우 500~600이 양끝(50, 950)보다 chroma가 높다', () => {
    const anchor = { L: 0.58, C: 0.2, H: 29 };
    const scale = deriveScale(anchor, 500);
    expect(scale[500].C).toBeGreaterThan(scale[50].C);
    expect(scale[500].C).toBeGreaterThan(scale[950].C);
    expect(scale[600].C).toBeGreaterThan(scale[50].C);
    expect(scale[600].C).toBeGreaterThan(scale[950].C);
  });

  it('anchor와 먼 shade는 L이 target L 표 근처로 수렴한다', () => {
    const anchor = { L: 0.72, C: 0.2, H: 0 };
    const scale = deriveScale(anchor, 500);
    // 500에서 거리 3 이상이면 target L을 그대로 쓴다.
    expect(scale[50].L).toBeCloseTo(0.97, 6);
    expect(scale[950].L).toBeCloseTo(0.16, 6);
  });

  it('anchor 전후 1~2단은 anchor L과 target L 사이로 블렌드된다', () => {
    const anchor = { L: 0.7, C: 0.15, H: 30 };
    const scale = deriveScale(anchor, 500);
    // 400의 target L은 0.68. 거리 1이면 L = 0.7*(2/3) + 0.68*(1/3).
    const expected400 = 0.7 * (2 / 3) + 0.68 * (1 / 3);
    expect(scale[400].L).toBeCloseTo(expected400, 6);
    // 300의 target L은 0.78. 거리 2이면 L = 0.7*(1/3) + 0.78*(2/3).
    const expected300 = 0.7 * (1 / 3) + 0.78 * (2 / 3);
    expect(scale[300].L).toBeCloseTo(expected300, 6);
  });
});

describe('createPrimitive', () => {
  it('id/anchor/anchorShade/scale/createdAt을 담아 반환한다', () => {
    const before = Date.now();
    const p = createPrimitive('green-a', { L: 0.58, C: 0.2, H: 150 }, 500 as ShadeIndex);
    const after = Date.now();

    expect(p.id).toBe('green-a');
    expect(p.anchorShade).toBe(500);
    expect(p.anchor).toEqual({ L: 0.58, C: 0.2, H: 150 });
    expect(p.scale[500]).toEqual(p.anchor);
    expect(p.createdAt).toBeGreaterThanOrEqual(before);
    expect(p.createdAt).toBeLessThanOrEqual(after);
  });

  it('anchor는 복사되어 저장된다 (외부 객체 변이가 primitive에 전파되지 않음)', () => {
    const anchor = { L: 0.58, C: 0.2, H: 150 };
    const p = createPrimitive('green-a', anchor, 500);
    anchor.L = 0.1;
    expect(p.anchor.L).toBe(0.58);
  });
});
