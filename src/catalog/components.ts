import type { AttributeId, ComponentId, StateId } from '../ir/types';

/**
 * Phase 1: 5개 컴포넌트만. Phase 2에서 확장.
 * Slot id 규칙:
 *   - Variant 없음: `{componentId}.{attributeId}`             예) card.background
 *   - Variant 있음: `{componentId}.{variantId}.{attributeId}` 예) button.primary.background
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
      { id: 'destructive', label: 'Destructive' },
      { id: 'outline', label: 'Outline' },
      { id: 'ghost', label: 'Ghost' },
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
      { id: 'default', label: 'Default' },
      { id: 'secondary', label: 'Secondary' },
      { id: 'destructive', label: 'Destructive' },
      { id: 'outline', label: 'Outline' },
    ],
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'toast',
    label: 'Toast',
    description: 'Transient notification',
    variants: [
      { id: 'default', label: 'Default' },
      { id: 'destructive', label: 'Destructive' },
      { id: 'warning', label: 'Warning' },
      { id: 'success', label: 'Success' },
    ],
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
