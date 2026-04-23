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
  // ===== Menu 계열 =====
  {
    id: 'dropdown-menu',
    label: 'Dropdown Menu',
    description: 'Menu opened from a trigger button',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'context-menu',
    label: 'Context Menu',
    description: 'Menu opened on right-click',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'menubar',
    label: 'Menubar',
    description: 'Horizontal menu bar (File / Edit / …)',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'navigation-menu',
    label: 'Navigation Menu',
    description: 'Top-level site navigation',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'command',
    label: 'Command',
    description: 'Command palette with search input',
    attributes: ['background', 'text', 'border', 'muted', 'icon', 'placeholder'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  // ===== Form Control 계열 =====
  {
    id: 'checkbox',
    label: 'Checkbox',
    description: 'Binary on/off box with check mark',
    attributes: ['background', 'border', 'mark'],
    states: ['default', 'hover', 'focus', 'disabled', 'checked'],
  },
  {
    id: 'radio-group',
    label: 'Radio Group',
    description: 'One-of-many selection with dot marker',
    attributes: ['background', 'border', 'mark'],
    states: ['default', 'hover', 'focus', 'disabled', 'checked'],
  },
  {
    id: 'switch',
    label: 'Switch',
    description: 'On/off toggle with track and thumb',
    attributes: ['track', 'thumb', 'border'],
    states: ['default', 'hover', 'focus', 'disabled', 'checked'],
  },
  {
    id: 'toggle',
    label: 'Toggle',
    description: 'Pressable button with on/off state',
    attributes: ['background', 'text', 'border'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  // ===== Range/Progress 계열 =====
  {
    id: 'slider',
    label: 'Slider',
    description: 'Draggable value picker with track, fill and thumb',
    attributes: ['track', 'fill', 'thumb', 'outline'],
    states: ['default', 'hover', 'focus', 'disabled'],
  },
  {
    id: 'progress',
    label: 'Progress',
    description: 'Non-interactive progress bar',
    attributes: ['track', 'fill'],
    states: ['default'],
  },
  // ===== Input 보조 계열 =====
  {
    id: 'textarea',
    label: 'Textarea',
    description: 'Multi-line text input',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'input-group',
    label: 'Input Group',
    description: 'Input with leading / trailing addon',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline', 'icon'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'input-otp',
    label: 'Input OTP',
    description: 'Fixed-width code entry with individual slots',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'native-select',
    label: 'Native Select',
    description: 'Browser-native <select> styled like Input',
    attributes: ['background', 'text', 'border', 'outline', 'icon'],
    states: ['default', 'hover', 'focus', 'disabled'],
  },
  {
    id: 'select',
    label: 'Select',
    description: 'Custom select trigger (paired with a menu panel)',
    attributes: ['background', 'text', 'border', 'outline', 'icon'],
    states: ['default', 'hover', 'focus', 'active', 'disabled'],
  },
  // ===== Navigation 계열 =====
  {
    id: 'breadcrumb',
    label: 'Breadcrumb',
    description: 'Hierarchical path showing the current page location',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'tabs',
    label: 'Tabs',
    description: 'Switch between views with horizontal tab list',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'pagination',
    label: 'Pagination',
    description: 'Paged navigation with numbered buttons',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'sidebar',
    label: 'Sidebar',
    description: 'Vertical application-level navigation panel',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active'],
  },
  // ===== Container/Alert 계열 =====
  {
    id: 'accordion',
    label: 'Accordion',
    description: 'Vertically stacked collapsible sections',
    attributes: ['background', 'text', 'border'],
    states: ['default', 'hover'],
  },
  {
    id: 'collapsible',
    label: 'Collapsible',
    description: 'Single expandable/collapsible region',
    attributes: ['background', 'text', 'border'],
    states: ['default', 'hover'],
  },
  {
    id: 'alert',
    label: 'Alert',
    description: 'Inline banner with icon, title and description',
    variants: [
      { id: 'primary', label: 'Primary' },
      { id: 'secondary', label: 'Secondary' },
      { id: 'accent', label: 'Accent' },
      { id: 'success', label: 'Success' },
      { id: 'info', label: 'Info' },
      { id: 'warning', label: 'Warning' },
      { id: 'error', label: 'Error' },
    ],
    attributes: ['background', 'text', 'border', 'icon'],
    states: ['default'],
  },
  // ===== Display 계열 =====
  {
    id: 'avatar',
    label: 'Avatar',
    description: 'Circular profile photo or initials',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'spinner',
    label: 'Spinner',
    description: 'Rotating loading indicator',
    attributes: ['icon'],
    states: ['default'],
  },
  {
    id: 'skeleton',
    label: 'Skeleton',
    description: 'Placeholder shape shown while content loads',
    attributes: ['muted'],
    states: ['default'],
  },
  {
    id: 'kbd',
    label: 'Kbd',
    description: 'Inline keyboard key hint',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  // ===== Data/기타 계열 =====
  {
    id: 'table',
    label: 'Table',
    description: 'Tabular data with header and rows',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover'],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Month grid with selectable days',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'separator',
    label: 'Separator',
    description: 'Horizontal or vertical divider line',
    attributes: ['border'],
    states: ['default'],
  },
  {
    id: 'label',
    label: 'Label',
    description: 'Form field label text',
    attributes: ['text'],
    states: ['default', 'disabled'],
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
