import { useMemo } from 'react';
import {
  COMPONENT_DEFINITIONS,
  type ComponentDefinition,
} from '../catalog/components';
import { usePosaStore } from './posa-store';

/**
 * 온보딩에서 확정된 activeComponentIds를 실제 정의 배열로 변환. 순서는
 * `COMPONENT_DEFINITIONS`의 원래 순서를 따른다 — UI 나열 일관성을 위해.
 * 셀렉터/프리뷰 등 "컴포넌트 전체 순회"가 필요한 곳에서 이 hook을 주입한다.
 */
export function useActiveComponentDefs(): ComponentDefinition[] {
  const ids = usePosaStore((s) => s.activeComponentIds);
  return useMemo(() => {
    const set = new Set(ids);
    return COMPONENT_DEFINITIONS.filter((c) => set.has(c.id));
  }, [ids]);
}
