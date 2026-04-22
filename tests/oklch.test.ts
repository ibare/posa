import { describe, expect, it } from 'vitest';
import {
  isInSrgbGamut,
  oklchToCssString,
  oklchToHex,
  oklchToLinearRgb,
  oklchToRgbString,
} from '../src/color/oklch';

const parseHex = (hex: string): [number, number, number] => {
  expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
};

const expectHexNear = (actual: string, expected: string, tolerance = 1): void => {
  const [ar, ag, ab] = parseHex(actual);
  const [er, eg, eb] = parseHex(expected);
  expect(Math.abs(ar - er)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(ag - eg)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(ab - eb)).toBeLessThanOrEqual(tolerance);
};

describe('oklchToHex', () => {
  it('흰색과 검정을 정확히 반환한다', () => {
    expect(oklchToHex(1, 0, 0)).toBe('#ffffff');
    expect(oklchToHex(0, 0, 0)).toBe('#000000');
  });

  it('sRGB primary red에 근접한다', () => {
    expectHexNear(oklchToHex(0.62796, 0.25768, 29.234), '#ff0000');
  });

  it('sRGB primary green에 근접한다', () => {
    expectHexNear(oklchToHex(0.8665, 0.29509, 142.495), '#00ff00');
  });

  it('sRGB primary blue에 근접한다', () => {
    expectHexNear(oklchToHex(0.45201, 0.31321, 264.05), '#0000ff');
  });

  it('gamut을 벗어난 값은 clamp되어 유효한 hex를 돌려준다', () => {
    const hex = oklchToHex(0.95, 0.4, 29);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('oklchToRgbString', () => {
  it('"rgb(r, g, b)" 포맷을 따른다', () => {
    expect(oklchToRgbString(1, 0, 0)).toBe('rgb(255, 255, 255)');
    expect(oklchToRgbString(0, 0, 0)).toBe('rgb(0, 0, 0)');
  });
});

describe('oklchToCssString', () => {
  it('"oklch(L C H)" 포맷을 따른다', () => {
    expect(oklchToCssString({ L: 0.628, C: 0.258, H: 29 })).toBe(
      'oklch(0.628 0.258 29)',
    );
    expect(oklchToCssString({ L: 0.5, C: 0, H: 0 })).toBe('oklch(0.5 0 0)');
  });
});

describe('oklchToLinearRgb', () => {
  it('순수 흰색은 linear (1,1,1) 근처다', () => {
    const [r, g, b] = oklchToLinearRgb(1, 0, 0);
    expect(r).toBeCloseTo(1, 3);
    expect(g).toBeCloseTo(1, 3);
    expect(b).toBeCloseTo(1, 3);
  });
});

describe('isInSrgbGamut', () => {
  it('일반적인 채도의 색은 gamut 안이다', () => {
    expect(isInSrgbGamut(0.5, 0, 0)).toBe(true);
    expect(isInSrgbGamut(0.62796, 0.25768, 29.234)).toBe(true);
  });

  it('지나치게 높은 chroma는 gamut 밖으로 판정한다', () => {
    expect(isInSrgbGamut(0.95, 0.4, 29)).toBe(false);
  });
});
