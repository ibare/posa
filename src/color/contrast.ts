import { oklchToLinearRgb } from './oklch';
import type { OKLCH } from '../ir/types';

/**
 * WCAG 2.x relative luminance. sRGB gamma 해제된 linear RGB 채널에서 계산한다.
 * `oklchToLinearRgb`가 이미 linear-light RGB를 돌려주므로 여기서는 clamp만
 * 하고 WCAG 계수를 곱한다.
 */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function relativeLuminance(color: OKLCH): number {
  const [r, g, b] = oklchToLinearRgb(color.L, color.C, color.H);
  const R = clamp01(r);
  const G = clamp01(g);
  const B = clamp01(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** WCAG contrast ratio. 항상 >= 1. */
export function contrastRatio(fg: OKLCH, bg: OKLCH): number {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastVerdict = 'excellent' | 'good' | 'large-only' | 'poor';

export function verdictOf(ratio: number): ContrastVerdict {
  if (ratio >= 7) return 'excellent';
  if (ratio >= 4.5) return 'good';
  if (ratio >= 3) return 'large-only';
  return 'poor';
}
