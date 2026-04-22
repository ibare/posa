import type { OKLCH } from '../ir/types';

/**
 * OKLCH ↔ sRGB 변환.
 * Björn Ottosson의 OKLab 기준 매트릭스를 그대로 사용.
 * 모든 중간 계산은 linear-light RGB 기준이며, 외부로 나갈 때만 sRGB gamma를 입힌다.
 * 외부 색상 라이브러리를 쓰지 않는 것이 설계 원칙이므로 직접 구현한다.
 */

const GAMUT_EPS = 1e-4;

const deg2rad = (deg: number): number => (deg * Math.PI) / 180;

const linearToSrgb = (x: number): number => {
  if (x <= 0.0031308) return 12.92 * x;
  return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
};

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

const to2HexDigits = (x: number): string => {
  const v = Math.round(clamp01(x) * 255);
  return v.toString(16).padStart(2, '0');
};

const formatNumber = (x: number, decimals = 3): string =>
  Number(x.toFixed(decimals)).toString();

/** OKLCH를 gamma-encoded sRGB가 아닌 linear-light RGB로 변환한다. 각 채널은 일반적으로 [0, 1] 범위지만 gamut 밖이면 범위를 벗어날 수 있다. */
export function oklchToLinearRgb(
  L: number,
  C: number,
  H: number,
): [number, number, number] {
  const a = C * Math.cos(deg2rad(H));
  const b = C * Math.sin(deg2rad(H));

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bCh = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [r, g, bCh];
}

/** OKLCH 값을 "#rrggbb" 형식으로 변환한다. gamut을 벗어난 값도 각 채널을 [0, 1]로 clamp해서 돌려준다. */
export function oklchToHex(L: number, C: number, H: number): string {
  const [r, g, b] = oklchToLinearRgb(L, C, H);
  return `#${to2HexDigits(linearToSrgb(r))}${to2HexDigits(linearToSrgb(g))}${to2HexDigits(linearToSrgb(b))}`;
}

/** OKLCH 값을 "rgb(r, g, b)" 문자열로 변환한다. 각 채널은 [0, 255]로 clamp 후 반올림. */
export function oklchToRgbString(L: number, C: number, H: number): string {
  const [r, g, b] = oklchToLinearRgb(L, C, H);
  const to255 = (v: number): number => Math.round(clamp01(linearToSrgb(v)) * 255);
  return `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
}

/** CSS `oklch()` 함수 표기. 예: "oklch(0.628 0.258 29.234)". */
export function oklchToCssString({ L, C, H }: OKLCH): string {
  return `oklch(${formatNumber(L)} ${formatNumber(C)} ${formatNumber(H)})`;
}

/** 해당 OKLCH 값이 sRGB gamut 안에 들어가는지 검사한다. UI에서 경고 뱃지 노출 등에 사용. */
export function isInSrgbGamut(L: number, C: number, H: number): boolean {
  const [r, g, b] = oklchToLinearRgb(L, C, H);
  return (
    r >= -GAMUT_EPS &&
    r <= 1 + GAMUT_EPS &&
    g >= -GAMUT_EPS &&
    g <= 1 + GAMUT_EPS &&
    b >= -GAMUT_EPS &&
    b <= 1 + GAMUT_EPS
  );
}
