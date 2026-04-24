import type { OKLCH } from '../../../../ir/types';
import {
  TILE_COUNT,
  c,
  linspace,
  type Recommender,
} from './shared';

/**
 * Phase A — 역할별 고정 팔레트를 각 1 row × 11 타일로 정규화.
 * 기존 SEA_REGISTRY의 분기를 하나의 파일로 이식. Phase C에서 role별 알고리즘을
 * 보다 정교하게 재설계 예정.
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
    // Attribute 역할
    case 'background':
      return backgroundRamp();
    case 'text':
    case 'placeholder':
    case 'icon':
    case 'overlay':
    case 'muted':
      return textRamp();
    case 'border':
    case 'track':
    case 'thumb':
      // Phase A: 기존 "generic sea" 동작을 유지 (컬러풀 hue ring).
      // 실제 border/track 용도엔 어울리지 않음 — Phase C에서 neutral ramp로 교체.
      return hueRing(0.58, 0.18);

    // Symbol / "컬러풀" attribute 역할
    case 'outline':
    case 'mark':
    case 'fill':
    case 'primary':
    case 'secondary':
    case 'accent':
    case 'info':
    case 'success':
      return hueRing(0.55, 0.18);

    case 'warning':
      return amberRamp();
    case 'error':
      return redRamp();

    default:
      return hueRing(0.58, 0.18);
  }
}

/** 0~330° 사이 11개 hue 샘플 (fullHueRing 기존 규약과 동일 범위). */
function hueRing(L: number, C: number): OKLCH[] {
  return linspace(0, 330, TILE_COUNT).map((H) => c(L, C, H));
}

/** 앰버 영역을 다소 넓게(orange ~ yellow-green) 11 hue 샘플로 표시. */
function amberRamp(): OKLCH[] {
  return linspace(20, 85, TILE_COUNT).map((H) => c(0.7, 0.17, H));
}

/** 레드 영역 11 hue 샘플. */
function redRamp(): OKLCH[] {
  return linspace(0, 30, TILE_COUNT).map((H) => c(0.55, 0.2, H));
}

/** 배경용: 순수 화이트 램프 7개 + 웜 2개 + 쿨 2개. */
function backgroundRamp(): OKLCH[] {
  const pure = linspace(1.0, 0.94, 7).map((L) => c(L, 0, 0));
  const warm = [c(0.99, 0.012, 70), c(0.97, 0.012, 70)];
  const cool = [c(0.99, 0.012, 240), c(0.97, 0.012, 240)];
  return [...pure, ...warm, ...cool];
}

/** 텍스트용: 순수 다크 램프 7개 + 웜 2개 + 쿨 2개. */
function textRamp(): OKLCH[] {
  const pure = linspace(0.15, 0.35, 7).map((L) => c(L, 0, 0));
  const warm = [c(0.22, 0.018, 55), c(0.28, 0.018, 55)];
  const cool = [c(0.22, 0.018, 240), c(0.28, 0.018, 240)];
  return [...pure, ...warm, ...cool];
}
