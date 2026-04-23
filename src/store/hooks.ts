import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('catalog');
  if (!id) return '';
  if (!getAttributeDefinition(id)) return id;
  return t(`attributes.${id}.label`);
}

/** symbol id → label. id가 null이면 빈 문자열, 정의 없으면 id 자체를 fallback. */
export function useSymbolLabel(id: SymbolId | null | undefined): string {
  const { t } = useTranslation('catalog');
  if (!id) return '';
  if (!getSymbolDefinition(id)) return id;
  return t(`symbols.${id}.label`);
}

/** id로 컴포넌트 label 조회. 정의 없으면 id 반환. */
export function useComponentLabel(id: string): string {
  const { t } = useTranslation('catalog');
  return t(`components.${id}.label`, { defaultValue: id });
}

/** id로 컴포넌트 description 조회. 정의 없으면 빈 문자열. */
export function useComponentDescription(id: string): string {
  const { t } = useTranslation('catalog');
  return t(`components.${id}.description`, { defaultValue: '' });
}

export function useGroupLabel(id: string): string {
  const { t } = useTranslation('catalog');
  return t(`groups.${id}`, { defaultValue: id });
}

export function useVariantLabel(id: string): string {
  const { t } = useTranslation('catalog');
  return t(`variants.${id}`, { defaultValue: id });
}
