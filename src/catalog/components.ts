import type { AttributeId, ComponentId, StateId } from '../ir/types';

/**
 * Phase 1: 5개 컴포넌트만. Phase 2에서 확장.
 *
 * Slot id 규칙:
 *   - 기본형(variant 지정 없음): `{componentId}.{attributeId}`          예) button.background
 *   - Variant 지정:              `{componentId}.{variantId}.{attributeId}` 예) button.primary.background
 *
 * 기본형은 모든 컴포넌트가 가진다 (`variants` 필드 여부와 무관).
 * variant id는 SymbolId와 문자열이 일치해야만 symbol 축과 결합된다.
 */

export type ComponentVariant = {
  id: string;
};

/**
 * 컴포넌트 그룹 id. 프리뷰 범위를 같은 카테고리로 좁힐 때 사용한다.
 * 예: 'typography'를 선택하면 h1~small 11개를 한 화면에서 비교하며 색을 지정.
 */
export type ComponentGroupId =
  | 'action'
  | 'input'
  | 'form-control'
  | 'range'
  | 'overlay'
  | 'menu'
  | 'navigation'
  | 'container'
  | 'feedback'
  | 'display'
  | 'data'
  | 'typography';

export type ComponentGroupDefinition = {
  id: ComponentGroupId;
};

/** UI 나열 순서는 이 배열 순서를 따른다. */
export const COMPONENT_GROUPS: ComponentGroupDefinition[] = [
  { id: 'action' },
  { id: 'input' },
  { id: 'form-control' },
  { id: 'range' },
  { id: 'overlay' },
  { id: 'menu' },
  { id: 'navigation' },
  { id: 'container' },
  { id: 'feedback' },
  { id: 'display' },
  { id: 'data' },
  { id: 'typography' },
];

export type ComponentDefinition = {
  id: ComponentId;
  group: ComponentGroupId;
  variants?: ComponentVariant[];
  attributes: AttributeId[];
  states: StateId[];
};

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    id: 'button',
    group: 'action',
    variants: [
      { id: 'primary' },
      { id: 'secondary' },
      { id: 'error' },
    ],
    attributes: ['background', 'text', 'border', 'outline'],
    states: ['default', 'hover', 'active', 'disabled', 'focus'],
  },
  {
    id: 'input',
    group: 'input',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'card',
    group: 'container',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'badge',
    group: 'display',
    variants: [
      { id: 'secondary' },
      { id: 'error' },
    ],
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'toast',
    group: 'feedback',
    variants: [
      { id: 'error' },
      { id: 'warning' },
      { id: 'success' },
    ],
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  // ===== Overlay 계열 =====
  {
    id: 'dialog',
    group: 'overlay',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'alert-dialog',
    group: 'overlay',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'sheet',
    group: 'overlay',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'drawer',
    group: 'overlay',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'popover',
    group: 'overlay',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'hover-card',
    group: 'overlay',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'tooltip',
    group: 'overlay',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  // ===== Menu 계열 =====
  {
    id: 'dropdown-menu',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'context-menu',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'menubar',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'navigation-menu',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'command',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon', 'placeholder'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  // ===== Form Control 계열 =====
  {
    id: 'checkbox',
    group: 'form-control',
    attributes: ['background', 'border', 'mark'],
    states: ['default', 'hover', 'focus', 'disabled', 'checked'],
  },
  {
    id: 'radio-group',
    group: 'form-control',
    attributes: ['background', 'border', 'mark'],
    states: ['default', 'hover', 'focus', 'disabled', 'checked'],
  },
  {
    id: 'switch',
    group: 'form-control',
    attributes: ['track', 'thumb', 'border'],
    states: ['default', 'hover', 'focus', 'disabled', 'checked'],
  },
  {
    id: 'toggle',
    group: 'form-control',
    attributes: ['background', 'text', 'border'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  // ===== Range/Progress 계열 =====
  {
    id: 'slider',
    group: 'range',
    attributes: ['track', 'fill', 'thumb', 'outline'],
    states: ['default', 'hover', 'focus', 'disabled'],
  },
  {
    id: 'progress',
    group: 'range',
    attributes: ['track', 'fill'],
    states: ['default'],
  },
  // ===== Input 보조 계열 =====
  {
    id: 'textarea',
    group: 'input',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'input-group',
    group: 'input',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline', 'icon'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'input-otp',
    group: 'input',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'native-select',
    group: 'input',
    attributes: ['background', 'text', 'border', 'outline', 'icon'],
    states: ['default', 'hover', 'focus', 'disabled'],
  },
  {
    id: 'select',
    group: 'input',
    attributes: ['background', 'text', 'border', 'outline', 'icon'],
    states: ['default', 'hover', 'focus', 'active', 'disabled'],
  },
  // ===== Navigation 계열 =====
  {
    id: 'breadcrumb',
    group: 'navigation',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'tabs',
    group: 'navigation',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'pagination',
    group: 'navigation',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'sidebar',
    group: 'navigation',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active'],
  },
  // ===== Container/Alert 계열 =====
  {
    id: 'accordion',
    group: 'container',
    attributes: ['background', 'text', 'border'],
    states: ['default', 'hover'],
  },
  {
    id: 'collapsible',
    group: 'container',
    attributes: ['background', 'text', 'border'],
    states: ['default', 'hover'],
  },
  {
    id: 'alert',
    group: 'feedback',
    variants: [
      { id: 'primary' },
      { id: 'secondary' },
      { id: 'accent' },
      { id: 'success' },
      { id: 'info' },
      { id: 'warning' },
      { id: 'error' },
    ],
    attributes: ['background', 'text', 'border', 'icon'],
    states: ['default'],
  },
  // ===== Display 계열 =====
  {
    id: 'avatar',
    group: 'display',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'spinner',
    group: 'display',
    attributes: ['icon'],
    states: ['default'],
  },
  {
    id: 'skeleton',
    group: 'display',
    attributes: ['muted'],
    states: ['default'],
  },
  {
    id: 'kbd',
    group: 'display',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  // ===== Data/기타 계열 =====
  {
    id: 'table',
    group: 'data',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover'],
  },
  {
    id: 'calendar',
    group: 'data',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'separator',
    group: 'container',
    attributes: ['border'],
    states: ['default'],
  },
  {
    id: 'label',
    group: 'input',
    attributes: ['text'],
    states: ['default', 'disabled'],
  },
  // ===== Typography 계열 =====
  {
    id: 'typography-h1',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-h2',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-h3',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-h4',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-p',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-blockquote',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-list',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-inline-code',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-lead',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-large',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-small',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
];

export function findComponent(componentId: ComponentId): ComponentDefinition | undefined {
  return COMPONENT_DEFINITIONS.find((c) => c.id === componentId);
}

/** slot id의 첫 segment가 component id. 항상 소유 컴포넌트를 돌려준다. */
export function findComponentBySlotId(slotId: string): ComponentDefinition | undefined {
  const componentId = slotId.split('.')[0];
  return findComponent(componentId);
}
