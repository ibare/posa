import { FIXED_PALETTES } from '../../../../color/fixed-palettes';
import { countPrimitiveReferences } from '../../../../ir/selectors';
import type { OKLCH, ShadeIndex } from '../../../../ir/types';
import { TILE_COUNT, type Recommender } from './shared';

/**
 * "사용 중인 색" — IR에서 실제로 참조되고 있는 primitive들을 참조수
 * 내림차순(+ id 알파벳 타이브레이커)으로 정렬해 role에 맞는 shade를 꺼낸다.
 *
 * - 참조수 0 primitive는 배제 (IR에 있지만 아무 slot/attribute/symbol에서도
 *   쓰이지 않는 것은 "사용 중"이 아니다).
 * - 참조 중인 primitive가 없으면 row 자체를 감춤.
 * - 11개에 못 미치면 Neutral 팔레트(50→950)로 부족분만 패딩.
 */
export const inScope: Recommender = ({ ir, role }) => {
  const shade = shadeForRole(role);

  const ranked = Object.values(ir.primitives)
    .map((p) => ({ p, refs: countPrimitiveReferences(ir, p.id) }))
    .filter((x) => x.refs > 0)
    .sort((a, b) => {
      if (b.refs !== a.refs) return b.refs - a.refs;
      return a.p.id.localeCompare(b.p.id);
    })
    .map((x) => x.p);

  if (ranked.length === 0) return null;

  const tiles: OKLCH[] = ranked
    .slice(0, TILE_COUNT)
    .map((p) => p.scale[shade]);

  const neutral = FIXED_PALETTES.find((pal) => pal.id === 'neutral');
  while (tiles.length < TILE_COUNT && neutral) {
    tiles.push(neutral.tiles[tiles.length]);
  }

  return {
    id: 'in-scope',
    labelKey: 'rows.inScope.label',
    hintKey: 'rows.inScope.hint',
    tiles,
  };
};

/**
 * role별 대표 shade. Tailwind 11단계 내에서 "이 용도에 흔히 쓰이는" 농도.
 * 숫자가 작을수록 밝고 클수록 어둡다.
 */
function shadeForRole(role: string): ShadeIndex {
  switch (role) {
    case 'background':
      return 50;
    case 'border':
    case 'track':
      return 200;
    case 'muted':
      return 400;
    case 'placeholder':
    case 'thumb':
    case 'outline':
    case 'mark':
    case 'fill':
      return 500;
    case 'icon':
    case 'overlay':
      return 700;
    case 'text':
      return 800;
    // symbol / semantic
    default:
      return 500;
  }
}
