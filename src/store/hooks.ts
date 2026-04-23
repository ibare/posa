import { useMemo } from 'react';
import type { AttributeDefinition } from '../catalog/attributes';
import {
  COMPONENT_DEFINITIONS,
  type ComponentDefinition,
} from '../catalog/components';
import type { SymbolDefinition } from '../catalog/symbols';
import {
  getActiveAttributeDefs,
  getActiveAttributeIds,
  getActiveSymbolDefs,
  getActiveSymbolIds,
  getAttributeDefinition,
  getSymbolDefinition,
} from '../ir/selectors';
import type { AttributeId, SymbolId } from '../ir/types';
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

/**
 * 스코프 내 컴포넌트들이 선언한 attribute id 합집합.
 * UI에서 "어떤 attribute를 나열할 것인가"의 유일한 원천.
 */
export function useActiveAttributeIds(): AttributeId[] {
  const components = useActiveComponentDefs();
  return useMemo(() => getActiveAttributeIds(components), [components]);
}

export function useActiveAttributeDefs(): AttributeDefinition[] {
  const components = useActiveComponentDefs();
  return useMemo(() => getActiveAttributeDefs(components), [components]);
}

/**
 * 스코프 내 컴포넌트들의 symbol-variant 합집합.
 * 어떤 컴포넌트도 symbol과 결합되는 variant를 갖지 않으면 빈 배열.
 */
export function useActiveSymbolIds(): SymbolId[] {
  const components = useActiveComponentDefs();
  return useMemo(() => getActiveSymbolIds(components), [components]);
}

export function useActiveSymbolDefs(): SymbolDefinition[] {
  const components = useActiveComponentDefs();
  return useMemo(() => getActiveSymbolDefs(components), [components]);
}

/** attribute id → label. id가 null이면 빈 문자열, 정의 없으면 id 자체를 fallback. */
export function useAttributeLabel(id: AttributeId | null | undefined): string {
  if (!id) return '';
  return getAttributeDefinition(id)?.label ?? id;
}

/** symbol id → label. id가 null이면 빈 문자열, 정의 없으면 id 자체를 fallback. */
export function useSymbolLabel(id: SymbolId | null | undefined): string {
  if (!id) return '';
  return getSymbolDefinition(id)?.label ?? id;
}
