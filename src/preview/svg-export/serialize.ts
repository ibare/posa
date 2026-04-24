import { escapeAttr, escapeXml } from './color-utils';
import type { SvgExtraction, SvgRectNode, SvgTextNode } from './types';

function fmt(n: number, digits = 2): string {
  return Number.isFinite(n) ? n.toFixed(digits) : '0';
}

function serializeRect(node: SvgRectNode): string {
  const attrs = [
    `x="${fmt(node.x)}"`,
    `y="${fmt(node.y)}"`,
    `width="${fmt(node.width)}"`,
    `height="${fmt(node.height)}"`,
  ];
  if (node.rx && node.rx > 0) attrs.push(`rx="${fmt(node.rx)}"`);
  if (node.fill) attrs.push(`fill="${escapeAttr(node.fill)}"`);
  else if (node.fill === null || node.stroke) attrs.push('fill="none"');
  if (node.stroke) {
    attrs.push(`stroke="${escapeAttr(node.stroke)}"`);
    attrs.push(`stroke-width="${node.strokeWidth ?? 1}"`);
  }
  return `  <rect ${attrs.join(' ')} />`;
}

function serializeText(node: SvgTextNode): string {
  const attrs = [
    `x="${fmt(node.x)}"`,
    `y="${fmt(node.y)}"`,
    `fill="${escapeAttr(node.fill)}"`,
    `font-family="${escapeAttr(node.fontFamily)}"`,
    `font-size="${node.fontSize}"`,
    `font-weight="${escapeAttr(node.fontWeight)}"`,
  ];
  if (node.textAnchor !== 'start') {
    attrs.push(`text-anchor="${node.textAnchor}"`);
  }
  return `  <text ${attrs.join(' ')}>${escapeXml(node.text)}</text>`;
}

export function serializeSvg({ nodes, width, height }: SvgExtraction): string {
  const w = fmt(width, 1);
  const h = fmt(height, 1);
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
  ];
  for (const node of nodes) {
    parts.push(node.type === 'rect' ? serializeRect(node) : serializeText(node));
  }
  parts.push('</svg>');
  return parts.join('\n');
}
