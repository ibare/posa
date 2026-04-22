import { COMPONENT_TYPES, PRESETS, type CatalogComponentId } from './components';
import { ROLE_DEFINITIONS, type RoleDefinition } from './roles';
import { SLOT_DEFINITIONS, type SlotDefinition } from './slots';

/**
 * 사용자가 선택한 컴포넌트 집합으로부터 이 인스턴스의 탐색 범위(universe)를 계산한다.
 * 마스터 그래프(COMPONENT/ROLE/SLOT 정의)에 대한 순수한 filter + union 연산이며, 어떤 상태도 유지하지 않는다.
 */

export type Universe = {
  componentTypes: string[];
  slots: SlotDefinition[];
  roles: RoleDefinition[];
  states: Set<string>;
};

const ALWAYS_INCLUDED_IDS: string[] = COMPONENT_TYPES.filter(
  (c) => 'alwaysIncluded' in c && c.alwaysIncluded,
).map((c) => c.id);

const VALID_COMPONENT_IDS: Set<string> = new Set(COMPONENT_TYPES.map((c) => c.id));

/**
 * 선택된 컴포넌트 id 목록을 받아 universe(필요한 slot/role/state)를 파생한다.
 * - alwaysIncluded 컴포넌트는 자동 포함.
 * - 카탈로그에 없는 id는 조용히 무시.
 * - 결과의 componentTypes는 중복이 제거된 상태.
 */
export function deriveUniverse(selectedComponentIds: string[]): Universe {
  const requested = selectedComponentIds.filter((id) => VALID_COMPONENT_IDS.has(id));
  const merged = new Set<string>([...ALWAYS_INCLUDED_IDS, ...requested]);

  const slots = SLOT_DEFINITIONS.filter((s) =>
    merged.has(s.componentType as CatalogComponentId),
  );

  const usedRoleIds = new Set<string>();
  const states = new Set<string>();
  for (const slot of slots) {
    usedRoleIds.add(slot.role);
    for (const state of slot.states) states.add(state);
  }

  const roles = ROLE_DEFINITIONS.filter((r) => usedRoleIds.has(r.id));

  return {
    componentTypes: Array.from(merged),
    slots,
    roles,
    states,
  };
}

/** Preset id를 받아 해당 preset의 component id 목록을 돌려준다. 없는 preset id는 빈 배열. */
export function applyPreset(presetId: string): string[] {
  const preset = PRESETS.find((p) => p.id === presetId);
  if (!preset) return [];
  return [...preset.components];
}
