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
  label: string;
};

export type ComponentDefinition = {
  id: ComponentId;
  label: string;
  description: string;
  variants?: ComponentVariant[];
  attributes: AttributeId[];
  states: StateId[];
};

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    id: 'button',
    label: 'Button',
    description: 'Clickable action',
    variants: [
      { id: 'primary', label: 'Primary' },
      { id: 'secondary', label: 'Secondary' },
      { id: 'error', label: 'Error' },
    ],
    attributes: ['background', 'text', 'border', 'outline'],
    states: ['default', 'hover', 'active', 'disabled', 'focus'],
  },
  {
    id: 'input',
    label: 'Input',
    description: 'Single-line text field',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Elevated container',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'badge',
    label: 'Badge',
    description: 'Small status indicator',
    variants: [
      { id: 'secondary', label: 'Secondary' },
      { id: 'error', label: 'Error' },
    ],
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'toast',
    label: 'Toast',
    description: 'Transient notification',
    variants: [
      { id: 'error', label: 'Error' },
      { id: 'warning', label: 'Warning' },
      { id: 'success', label: 'Success' },
    ],
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  // ===== Overlay 계열 =====
  {
    id: 'dialog',
    label: 'Dialog',
    description: 'Modal dialog with backdrop',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'alert-dialog',
    label: 'Alert Dialog',
    description: 'Modal confirmation dialog',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'sheet',
    label: 'Sheet',
    description: 'Side-anchored overlay panel',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'drawer',
    label: 'Drawer',
    description: 'Bottom-anchored overlay panel',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'popover',
    label: 'Popover',
    description: 'Floating panel anchored to a trigger',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'hover-card',
    label: 'Hover Card',
    description: 'Popover surfaced on hover',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'tooltip',
    label: 'Tooltip',
    description: 'Short hint label',
    attributes: ['background', 'text', 'border'],
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
