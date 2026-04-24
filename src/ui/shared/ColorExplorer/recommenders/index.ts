import { inScope } from './in-scope';
import { nearNeighbors } from './near-neighbors';
import { roleFit } from './role-fit';
import type { Recommender, Row, RowContext } from './shared';

/**
 * 추천 섹션의 row 순서. 각 Recommender는 null을 반환해 스스로를 숨길 수 있다.
 * 최종 rows 배열의 길이는 0~3.
 */
export const RECOMMENDERS: Recommender[] = [
  inScope,
  nearNeighbors,
  roleFit,
];

export function collectRows(ctx: RowContext): Row[] {
  const out: Row[] = [];
  for (const rec of RECOMMENDERS) {
    const row = rec(ctx);
    if (row) out.push(row);
  }
  return out;
}

export type { Row, RowContext, Recommender } from './shared';
