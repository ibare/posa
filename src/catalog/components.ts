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
  label: string;
};

/** UI 나열 순서는 이 배열 순서를 따른다. */
export const COMPONENT_GROUPS: ComponentGroupDefinition[] = [
  { id: 'action', label: 'Action' },
  { id: 'input', label: 'Input' },
  { id: 'form-control', label: 'Form Control' },
  { id: 'range', label: 'Range' },
  { id: 'overlay', label: 'Overlay' },
  { id: 'menu', label: 'Menu' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'container', label: 'Container' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'display', label: 'Display' },
  { id: 'data', label: 'Data' },
  { id: 'typography', label: 'Typography' },
];

export type ComponentDefinition = {
  id: ComponentId;
  label: string;
  description: string;
  group: ComponentGroupId;
  variants?: ComponentVariant[];
  attributes: AttributeId[];
  states: StateId[];
};

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    id: 'button',
    label: 'Button',
    description: 'Clickable action',
    group: 'action',
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
    group: 'input',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Elevated container',
    group: 'container',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'badge',
    label: 'Badge',
    description: 'Small status indicator',
    group: 'display',
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
    group: 'feedback',
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
    group: 'overlay',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'alert-dialog',
    label: 'Alert Dialog',
    description: 'Modal confirmation dialog',
    group: 'overlay',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'sheet',
    label: 'Sheet',
    description: 'Side-anchored overlay panel',
    group: 'overlay',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'drawer',
    label: 'Drawer',
    description: 'Bottom-anchored overlay panel',
    group: 'overlay',
    attributes: ['overlay', 'background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'popover',
    label: 'Popover',
    description: 'Floating panel anchored to a trigger',
    group: 'overlay',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'hover-card',
    label: 'Hover Card',
    description: 'Popover surfaced on hover',
    group: 'overlay',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'tooltip',
    label: 'Tooltip',
    description: 'Short hint label',
    group: 'overlay',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  // ===== Menu 계열 =====
  {
    id: 'dropdown-menu',
    label: 'Dropdown Menu',
    description: 'Menu opened from a trigger button',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'context-menu',
    label: 'Context Menu',
    description: 'Menu opened on right-click',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'menubar',
    label: 'Menubar',
    description: 'Horizontal menu bar (File / Edit / …)',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'navigation-menu',
    label: 'Navigation Menu',
    description: 'Top-level site navigation',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'command',
    label: 'Command',
    description: 'Command palette with search input',
    group: 'menu',
    attributes: ['background', 'text', 'border', 'muted', 'icon', 'placeholder'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  // ===== Form Control 계열 =====
  {
    id: 'checkbox',
    label: 'Checkbox',
    description: 'Binary on/off box with check mark',
    group: 'form-control',
    attributes: ['background', 'border', 'mark'],
    states: ['default', 'hover', 'focus', 'disabled', 'checked'],
  },
  {
    id: 'radio-group',
    label: 'Radio Group',
    description: 'One-of-many selection with dot marker',
    group: 'form-control',
    attributes: ['background', 'border', 'mark'],
    states: ['default', 'hover', 'focus', 'disabled', 'checked'],
  },
  {
    id: 'switch',
    label: 'Switch',
    description: 'On/off toggle with track and thumb',
    group: 'form-control',
    attributes: ['track', 'thumb', 'border'],
    states: ['default', 'hover', 'focus', 'disabled', 'checked'],
  },
  {
    id: 'toggle',
    label: 'Toggle',
    description: 'Pressable button with on/off state',
    group: 'form-control',
    attributes: ['background', 'text', 'border'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  // ===== Range/Progress 계열 =====
  {
    id: 'slider',
    label: 'Slider',
    description: 'Draggable value picker with track, fill and thumb',
    group: 'range',
    attributes: ['track', 'fill', 'thumb', 'outline'],
    states: ['default', 'hover', 'focus', 'disabled'],
  },
  {
    id: 'progress',
    label: 'Progress',
    description: 'Non-interactive progress bar',
    group: 'range',
    attributes: ['track', 'fill'],
    states: ['default'],
  },
  // ===== Input 보조 계열 =====
  {
    id: 'textarea',
    label: 'Textarea',
    description: 'Multi-line text input',
    group: 'input',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'input-group',
    label: 'Input Group',
    description: 'Input with leading / trailing addon',
    group: 'input',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline', 'icon'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'input-otp',
    label: 'Input OTP',
    description: 'Fixed-width code entry with individual slots',
    group: 'input',
    attributes: ['background', 'text', 'placeholder', 'border', 'outline'],
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'native-select',
    label: 'Native Select',
    description: 'Browser-native <select> styled like Input',
    group: 'input',
    attributes: ['background', 'text', 'border', 'outline', 'icon'],
    states: ['default', 'hover', 'focus', 'disabled'],
  },
  {
    id: 'select',
    label: 'Select',
    description: 'Custom select trigger (paired with a menu panel)',
    group: 'input',
    attributes: ['background', 'text', 'border', 'outline', 'icon'],
    states: ['default', 'hover', 'focus', 'active', 'disabled'],
  },
  // ===== Navigation 계열 =====
  {
    id: 'breadcrumb',
    label: 'Breadcrumb',
    description: 'Hierarchical path showing the current page location',
    group: 'navigation',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'tabs',
    label: 'Tabs',
    description: 'Switch between views with horizontal tab list',
    group: 'navigation',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'pagination',
    label: 'Pagination',
    description: 'Paged navigation with numbered buttons',
    group: 'navigation',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'sidebar',
    label: 'Sidebar',
    description: 'Vertical application-level navigation panel',
    group: 'navigation',
    attributes: ['background', 'text', 'border', 'muted', 'icon'],
    states: ['default', 'hover', 'active'],
  },
  // ===== Container/Alert 계열 =====
  {
    id: 'accordion',
    label: 'Accordion',
    description: 'Vertically stacked collapsible sections',
    group: 'container',
    attributes: ['background', 'text', 'border'],
    states: ['default', 'hover'],
  },
  {
    id: 'collapsible',
    label: 'Collapsible',
    description: 'Single expandable/collapsible region',
    group: 'container',
    attributes: ['background', 'text', 'border'],
    states: ['default', 'hover'],
  },
  {
    id: 'alert',
    label: 'Alert',
    description: 'Inline banner with icon, title and description',
    group: 'feedback',
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
    group: 'display',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  {
    id: 'spinner',
    label: 'Spinner',
    description: 'Rotating loading indicator',
    group: 'display',
    attributes: ['icon'],
    states: ['default'],
  },
  {
    id: 'skeleton',
    label: 'Skeleton',
    description: 'Placeholder shape shown while content loads',
    group: 'display',
    attributes: ['muted'],
    states: ['default'],
  },
  {
    id: 'kbd',
    label: 'Kbd',
    description: 'Inline keyboard key hint',
    group: 'display',
    attributes: ['background', 'text', 'border'],
    states: ['default'],
  },
  // ===== Data/기타 계열 =====
  {
    id: 'table',
    label: 'Table',
    description: 'Tabular data with header and rows',
    group: 'data',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover'],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Month grid with selectable days',
    group: 'data',
    attributes: ['background', 'text', 'border', 'muted'],
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'separator',
    label: 'Separator',
    description: 'Horizontal or vertical divider line',
    group: 'container',
    attributes: ['border'],
    states: ['default'],
  },
  {
    id: 'label',
    label: 'Label',
    description: 'Form field label text',
    group: 'input',
    attributes: ['text'],
    states: ['default', 'disabled'],
  },
  // ===== Typography 계열 =====
  {
    id: 'typography-h1',
    label: 'Typography H1',
    description: 'Top-level heading (h1)',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-h2',
    label: 'Typography H2',
    description: 'Section heading (h2)',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-h3',
    label: 'Typography H3',
    description: 'Subsection heading (h3)',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-h4',
    label: 'Typography H4',
    description: 'Minor heading (h4)',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-p',
    label: 'Typography P',
    description: 'Body paragraph',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-blockquote',
    label: 'Typography Blockquote',
    description: 'Quoted block',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-list',
    label: 'Typography List',
    description: 'Unordered list',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-inline-code',
    label: 'Typography Inline Code',
    description: 'Inline code span',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-lead',
    label: 'Typography Lead',
    description: 'Lead paragraph (intro)',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-large',
    label: 'Typography Large',
    description: 'Large emphasized text',
    group: 'typography',
    attributes: ['text'],
    states: ['default'],
  },
  {
    id: 'typography-small',
    label: 'Typography Small',
    description: 'Small helper text',
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
