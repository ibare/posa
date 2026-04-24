import { isTransparentColor, rgbToHex } from './color-utils';
import type { SvgExtraction, SvgNode, SvgTextNode } from './types';

function hasVisibleBackground(styles: CSSStyleDeclaration): boolean {
  return !isTransparentColor(styles.backgroundColor);
}

function hasVisibleBorder(styles: CSSStyleDeclaration): boolean {
  const width = parseFloat(styles.borderTopWidth);
  if (!Number.isFinite(width) || width === 0) return false;
  return !isTransparentColor(styles.borderTopColor);
}

function isLeafWithText(el: Element): boolean {
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) return false;
  }
  const text = el.textContent;
  return !!text && text.trim().length > 0;
}

function resolveTextAnchor(
  styles: CSSStyleDeclaration,
): SvgTextNode['textAnchor'] {
  const textAlign = styles.textAlign;
  const justifyContent = styles.justifyContent;
  if (textAlign === 'center' || justifyContent === 'center') return 'middle';
  if (textAlign === 'right' || justifyContent === 'flex-end') return 'end';
  return 'start';
}

function buildTextNode(
  el: Element,
  styles: CSSStyleDeclaration,
  x: number,
  y: number,
  w: number,
  h: number,
): SvgTextNode | null {
  const text = el.textContent?.trim();
  if (!text) return null;
  const fill = rgbToHex(styles.color);
  if (!fill) return null;

  const fontSize = parseFloat(styles.fontSize) || 0;
  const fontWeight = styles.fontWeight || '400';
  const fontFamily = (styles.fontFamily || '').replace(/"/g, "'");
  const padL = parseFloat(styles.paddingLeft) || 0;
  const padR = parseFloat(styles.paddingRight) || 0;
  const padT = parseFloat(styles.paddingTop) || 0;
  const contentW = Math.max(0, w - padL - padR);

  const textAnchor = resolveTextAnchor(styles);
  let textX = x + padL;
  if (textAnchor === 'middle') textX = x + padL + contentW / 2;
  else if (textAnchor === 'end') textX = x + w - padR;

  const baselineOffset = fontSize * 0.72;
  const alignItems = styles.alignItems;
  const textY =
    alignItems === 'center'
      ? y + h / 2 + baselineOffset / 2
      : y + padT + baselineOffset;

  return {
    type: 'text',
    x: textX,
    y: textY,
    text,
    fill,
    fontFamily,
    fontSize,
    fontWeight,
    textAnchor,
  };
}

export function extractSvgNodes(rootEl: Element): SvgExtraction {
  const rootRect = rootEl.getBoundingClientRect();
  const nodes: SvgNode[] = [];

  function walk(el: Element): void {
    const rect = el.getBoundingClientRect();
    const styles = getComputedStyle(el);
    const x = rect.left - rootRect.left;
    const y = rect.top - rootRect.top;
    const w = rect.width;
    const h = rect.height;

    const radius = parseFloat(styles.borderTopLeftRadius) || 0;
    const rx = Math.min(radius, Math.min(w, h) / 2);

    if (hasVisibleBackground(styles)) {
      nodes.push({
        type: 'rect',
        x,
        y,
        width: w,
        height: h,
        fill: rgbToHex(styles.backgroundColor),
        rx,
      });
    }

    if (hasVisibleBorder(styles)) {
      const bw = parseFloat(styles.borderTopWidth);
      nodes.push({
        type: 'rect',
        x: x + bw / 2,
        y: y + bw / 2,
        width: Math.max(0, w - bw),
        height: Math.max(0, h - bw),
        fill: null,
        stroke: rgbToHex(styles.borderTopColor),
        strokeWidth: bw,
        rx: Math.max(0, rx - bw / 2),
      });
    }

    if (isLeafWithText(el)) {
      const textNode = buildTextNode(el, styles, x, y, w, h);
      if (textNode) nodes.push(textNode);
    }

    for (const child of Array.from(el.children)) {
      walk(child);
    }
  }

  walk(rootEl);
  return { nodes, width: rootRect.width, height: rootRect.height };
}
