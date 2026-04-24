import { FIXED_PALETTES } from '../../../../color/fixed-palettes';
import { countPrimitiveSlotReferences } from '../../../../ir/selectors';
import type { OKLCH, ShadeIndex } from '../../../../ir/types';
import { TILE_COUNT, type Recommender } from './shared';

/**
 * Phase A — IR 내 primitive들을 사용량 내림차순으로 나열, role별 shade를
 * 뽑아 11 타일을 채운다. primitive가 부족하면 Neutral 팔레트로 패딩.
 * IR에 primitive가 전혀 없으면 row 감춤.
 * Phase D에서 사용량 집계·role-weighted 선정 로직 정교화 예정.
 */
export const inScope: Recommender = ({ ir, role }) => {
  const primitives = Object.values(ir.primitives);
  if (primitives.length === 0) return null;

  const shade = shadeForRole(role);

  const ranked = primitives
    .map((p) => ({ p, refs: countPrimitiveSlotReferences(ir, p.id) }))
    .sort((a, b) => b.refs - a.refs)
    .map((x) => x.p);

  const tiles: OKLCH[] = ranked
    .slice(0, TILE_COUNT)
    .map((p) => p.scale[shade]);

  // Neutral 팔레트(50 → 950)로 패딩. IR primitive 수가 11 미만일 때만 발동.
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

function shadeForRole(role: string): ShadeIndex {
  if (role === 'background') return 50;
  if (
    role === 'text' ||
    role === 'placeholder' ||
    role === 'icon' ||
    role === 'overlay'
  ) {
    return 800;
  }
  if (role === 'border' || role === 'muted' || role === 'track') return 300;
  return 500;
}
