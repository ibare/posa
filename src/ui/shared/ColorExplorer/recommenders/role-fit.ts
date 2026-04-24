import type { OKLCH } from '../../../../ir/types';
import { TILE_COUNT, c, linspace, type Recommender } from './shared';

/**
 * role별 usable 팔레트 — "이 용도에 자주 쓰이는 범위" 한 행.
 *
 * 대분류:
 * - Neutral (background/text/border/track/thumb/placeholder/icon/overlay/muted):
 *   순수 gray 램프 7개 + warm/cool hint 4개. L 구간은 role별로 다르다.
 * - Colorful (primary/secondary/accent/outline/mark/fill):
 *   일정 L, C에서 hue를 11단계 순회 (0~330°).
 * - Semantic (info/success/warning/error):
 *   의미 색상 주위의 좁은 hue 밴드 11개.
 */
export const roleFit: Recommender = ({ role }) => {
  const tiles = generateForRole(role);
  return {
    id: 'role-fit',
    labelKey: 'rows.roleFit.label',
    hintKey: 'rows.roleFit.hint',
    tiles,
  };
};

function generateForRole(role: string): OKLCH[] {
  switch (role) {
    // Neutral
    case 'background':
      return neutralRamp(1.0, 0.94, 0.01);
    case 'text':
      return neutralRamp(0.15, 0.35, 0.016);
    case 'placeholder':
      return neutralRamp(0.45, 0.65, 0.012);
    case 'icon':
      return neutralRamp(0.2, 0.5, 0.014);
    case 'overlay':
      return neutralRamp(0.15, 0.45, 0.012);
    case 'muted':
      return neutralRamp(0.45, 0.65, 0.012);
    case 'border':
      return neutralRamp(0.78, 0.9, 0.008);
    case 'track':
      return neutralRamp(0.78, 0.9, 0.008);
    case 'thumb':
      return neutralRamp(0.55, 0.75, 0.014);

    // Colorful
    case 'outline':
    case 'mark':
    case 'fill':
      return hueRing(0.55, 0.15);
    case 'primary':
    case 'accent':
      return hueRing(0.58, 0.18);
    case 'secondary':
      return hueRing(0.6, 0.12);

    // Semantic
    case 'info':
      return hueBand(0.6, 0.15, 220, 260);
    case 'success':
      return hueBand(0.58, 0.16, 130, 170);
    case 'warning':
      return hueBand(0.72, 0.17, 55, 95);
    case 'error':
      return hueBand(0.55, 0.2, 0, 30);

    default:
      return hueRing(0.58, 0.18);
  }
}

/** 0~330° 사이 11개 hue 순회. */
function hueRing(L: number, C: number): OKLCH[] {
  return linspace(0, 330, TILE_COUNT).map((H) => c(L, C, H));
}

/** 좁은 hue 대역 11개 샘플 — semantic 색상용. */
function hueBand(L: number, C: number, hLo: number, hHi: number): OKLCH[] {
  return linspace(hLo, hHi, TILE_COUNT).map((H) => c(L, C, H));
}

/**
 * 순수 gray 7개 + warm/cool 각 2개 = 11 타일.
 * warm/cool은 L 구간 35%/65% 지점에 얹어 가운데 톤에만 색조를 준다.
 */
function neutralRamp(lLo: number, lHi: number, warmCoolC: number): OKLCH[] {
  const pure = linspace(lLo, lHi, 7).map((L) => c(L, 0, 0));
  const l1 = lLo + (lHi - lLo) * 0.35;
  const l2 = lLo + (lHi - lLo) * 0.65;
  return [
    ...pure,
    c(l1, warmCoolC, 70),
    c(l2, warmCoolC, 70),
    c(l1, warmCoolC, 240),
    c(l2, warmCoolC, 240),
  ];
}
