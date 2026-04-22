import { describe, expect, it } from 'vitest';
import { createPrimitive } from '../src/color/primitive';
import { oklchToCssString } from '../src/color/oklch';
import type { IR } from '../src/ir/types';
import { irToPreviewPalette } from '../src/ui/preview/palette';

const emptyIr = (): IR => ({
  meta: {
    version: '1.0',
    createdAt: 0,
    updatedAt: 0,
    componentTypes: [],
  },
  primitives: {},
  roles: {},
  slots: {},
});

describe('irToPreviewPalette', () => {
  it('role이 전혀 없으면 빈 객체를 반환한다', () => {
    const palette = irToPreviewPalette(emptyIr());
    expect(palette).toEqual({});
  });

  it('primary role이 세팅되면 primary와 secondary(=accent로 미매핑시 비워둠) 중 primary만 채워진다', () => {
    const ir = emptyIr();
    const green = createPrimitive('green-a', { L: 0.58, C: 0.2, H: 150 }, 500);
    ir.primitives['green-a'] = green;
    ir.roles['primary'] = { primitive: 'green-a', shade: 500 };

    const palette = irToPreviewPalette(ir);
    expect(palette.primary).toBe(oklchToCssString(green.scale[500]));
    expect(palette.accent).toBeUndefined();
    expect(palette.background).toBeUndefined();
  });

  it('accent role을 세팅하면 accent와 secondary가 같은 색을 공유한다', () => {
    const ir = emptyIr();
    const blue = createPrimitive('blue-a', { L: 0.6, C: 0.18, H: 250 }, 500);
    ir.primitives['blue-a'] = blue;
    ir.roles['accent'] = { primitive: 'blue-a', shade: 500 };

    const palette = irToPreviewPalette(ir);
    const expected = oklchToCssString(blue.scale[500]);
    expect(palette.accent).toBe(expected);
    expect(palette.secondary).toBe(expected);
  });

  it('참조하는 primitive가 없는 role은 무시된다', () => {
    const ir = emptyIr();
    ir.roles['primary'] = { primitive: 'missing', shade: 500 };
    const palette = irToPreviewPalette(ir);
    expect(palette.primary).toBeUndefined();
  });

  it('모든 대응 role을 세팅하면 팔레트 키들이 oklch 문자열로 채워진다', () => {
    const ir = emptyIr();
    const gray = createPrimitive('gray-a', { L: 0.5, C: 0.005, H: 0 }, 500);
    ir.primitives['gray-a'] = gray;
    ir.roles['background'] = { primitive: 'gray-a', shade: 50 };
    ir.roles['foreground'] = { primitive: 'gray-a', shade: 900 };
    ir.roles['border'] = { primitive: 'gray-a', shade: 200 };

    const palette = irToPreviewPalette(ir);
    expect(palette.background).toMatch(/^oklch\(/);
    expect(palette.foreground).toMatch(/^oklch\(/);
    expect(palette.border).toMatch(/^oklch\(/);
  });
});
