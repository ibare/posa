import { describe, expect, it } from 'vitest';
import {
  escapeAttr,
  escapeXml,
  isTransparentColor,
  rgbToHex,
} from '../src/preview/svg-export/color-utils';
import { serializeSvg } from '../src/preview/svg-export/serialize';
import type { SvgExtraction } from '../src/preview/svg-export/types';

describe('color-utils.rgbToHex', () => {
  it('rgb → hex 로 변환', () => {
    expect(rgbToHex('rgb(45, 122, 62)')).toBe('#2d7a3e');
  });

  it('투명/빈 값은 null', () => {
    expect(rgbToHex('transparent')).toBeNull();
    expect(rgbToHex('rgba(0, 0, 0, 0)')).toBeNull();
    expect(rgbToHex('')).toBeNull();
    expect(rgbToHex(null)).toBeNull();
  });

  it('alpha < 1 인 rgba 는 원본 유지', () => {
    expect(rgbToHex('rgba(10, 20, 30, 0.5)')).toBe('rgba(10, 20, 30, 0.5)');
  });

  it('이미 hex/named color 는 그대로 반환', () => {
    expect(rgbToHex('#abcdef')).toBe('#abcdef');
    expect(rgbToHex('red')).toBe('red');
  });
});

describe('color-utils.isTransparentColor', () => {
  it('투명 판정', () => {
    expect(isTransparentColor('transparent')).toBe(true);
    expect(isTransparentColor('rgba(0, 0, 0, 0)')).toBe(true);
    expect(isTransparentColor('rgba(10, 20, 30, 0)')).toBe(true);
    expect(isTransparentColor(null)).toBe(true);
    expect(isTransparentColor(undefined)).toBe(true);
    expect(isTransparentColor('rgb(0, 0, 0)')).toBe(false);
  });
});

describe('color-utils.escape', () => {
  it('XML 특수문자 이스케이프', () => {
    expect(escapeXml('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
  });

  it('속성값에는 따옴표까지 이스케이프', () => {
    expect(escapeAttr('"quoted"')).toBe('&quot;quoted&quot;');
  });
});

describe('serializeSvg', () => {
  const baseSvg = (body: string, w = 100, h = 40) =>
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}">`,
      body,
      '</svg>',
    ].join('\n');

  it('빈 노드 배열 → svg 래퍼만 출력', () => {
    const out = serializeSvg({ nodes: [], width: 10, height: 20 });
    expect(out).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="10.0" height="20.0" viewBox="0 0 10.0 20.0">',
        '</svg>',
      ].join('\n'),
    );
  });

  it('단순 박스: 배경 + 테두리 + 중앙 텍스트', () => {
    const extraction: SvgExtraction = {
      width: 100,
      height: 40,
      nodes: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          width: 100,
          height: 40,
          fill: '#2d7a3e',
          rx: 6,
        },
        {
          type: 'rect',
          x: 0.5,
          y: 0.5,
          width: 99,
          height: 39,
          fill: null,
          stroke: '#1c1917',
          strokeWidth: 1,
          rx: 5.5,
        },
        {
          type: 'text',
          x: 50,
          y: 25,
          text: 'Save',
          fill: '#ffffff',
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
          fontSize: 14,
          fontWeight: '500',
          textAnchor: 'middle',
        },
      ],
    };
    const out = serializeSvg(extraction);
    expect(out).toBe(
      baseSvg(
        [
          '  <rect x="0.00" y="0.00" width="100.00" height="40.00" rx="6.00" fill="#2d7a3e" />',
          '  <rect x="0.50" y="0.50" width="99.00" height="39.00" rx="5.50" fill="none" stroke="#1c1917" stroke-width="1" />',
          '  <text x="50.00" y="25.00" fill="#ffffff" font-family="\'Instrument Sans\', system-ui, sans-serif" font-size="14" font-weight="500" text-anchor="middle">Save</text>',
        ].join('\n'),
      ),
    );
  });

  it('XML 위험 문자 포함 텍스트도 안전하게 직렬화', () => {
    const out = serializeSvg({
      width: 10,
      height: 10,
      nodes: [
        {
          type: 'text',
          x: 0,
          y: 5,
          text: '<b> & <i>',
          fill: '#000000',
          fontFamily: 'sans-serif',
          fontSize: 10,
          fontWeight: '400',
          textAnchor: 'start',
        },
      ],
    });
    expect(out).toContain('&lt;b&gt; &amp; &lt;i&gt;');
    expect(out).not.toContain('text-anchor');
  });

  it('flex row 시뮬레이션: rect x 좌표가 순차 증가', () => {
    const rects: SvgExtraction['nodes'] = [0, 40, 80].map((x) => ({
      type: 'rect',
      x,
      y: 0,
      width: 36,
      height: 24,
      fill: '#eeeeee',
      rx: 4,
    }));
    const out = serializeSvg({ width: 120, height: 24, nodes: rects });
    const xValues = Array.from(out.matchAll(/<rect\s+x="([\d.]+)"/g)).map(
      (m) => parseFloat(m[1]),
    );
    expect(xValues).toEqual([0, 40, 80]);
    expect(xValues[0]).toBeLessThan(xValues[1]);
    expect(xValues[1]).toBeLessThan(xValues[2]);
  });

  it('grid 시뮬레이션: 행·열 좌표 조합', () => {
    const cols = [0, 26, 52];
    const rows = [0, 26];
    const nodes: SvgExtraction['nodes'] = [];
    for (const y of rows) {
      for (const x of cols) {
        nodes.push({
          type: 'rect',
          x,
          y,
          width: 24,
          height: 24,
          fill: '#ffffff',
          rx: 4,
        });
      }
    }
    const out = serializeSvg({ width: 78, height: 52, nodes });
    const positions = Array.from(
      out.matchAll(/<rect\s+x="([\d.]+)"\s+y="([\d.]+)"/g),
    ).map((m) => [parseFloat(m[1]), parseFloat(m[2])] as const);
    expect(positions).toEqual([
      [0, 0],
      [26, 0],
      [52, 0],
      [0, 26],
      [26, 26],
      [52, 26],
    ]);
  });
});
