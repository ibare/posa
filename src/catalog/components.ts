/**
 * 카탈로그가 다루는 UI 컴포넌트 타입 집합과 preset.
 * shadcn 관행을 기본으로 실무 공백을 메우는 몇 개(stat, kanban 등)를 추가.
 */

export type ComponentCategory =
  | 'interactive'
  | 'input'
  | 'container'
  | 'feedback'
  | 'navigation'
  | 'data'
  | 'typography';

export type ComponentType = {
  id: string;
  category: ComponentCategory;
  label: string;
  description: string;
  alwaysIncluded?: boolean;
};

export const COMPONENT_TYPES = [
  // typography — 항상 포함
  {
    id: 'typography',
    category: 'typography',
    label: 'Typography',
    description: 'Body, headings, labels, and other base text',
    alwaysIncluded: true,
  },

  // interactive
  { id: 'button', category: 'interactive', label: 'Button', description: 'Basic button' },
  {
    id: 'icon-button',
    category: 'interactive',
    label: 'Icon Button',
    description: 'Icon-only button',
  },
  { id: 'link', category: 'interactive', label: 'Link', description: 'Link text' },
  { id: 'checkbox', category: 'interactive', label: 'Checkbox', description: 'Checkbox' },
  { id: 'radio', category: 'interactive', label: 'Radio', description: 'Radio button' },
  { id: 'switch', category: 'interactive', label: 'Switch', description: 'Toggle switch' },
  { id: 'slider', category: 'interactive', label: 'Slider', description: 'Value slider' },
  {
    id: 'toggle-group',
    category: 'interactive',
    label: 'Toggle Group',
    description: 'Segmented control',
  },

  // input
  { id: 'input', category: 'input', label: 'Input', description: 'Text input' },
  { id: 'textarea', category: 'input', label: 'Textarea', description: 'Multi-line text' },
  { id: 'select', category: 'input', label: 'Select', description: 'Dropdown select' },
  { id: 'combobox', category: 'input', label: 'Combobox', description: 'Searchable select' },
  { id: 'date-picker', category: 'input', label: 'Date Picker', description: 'Date picker' },

  // container
  { id: 'card', category: 'container', label: 'Card', description: 'Card panel' },
  { id: 'dialog', category: 'container', label: 'Dialog', description: 'Modal dialog' },
  { id: 'sheet', category: 'container', label: 'Sheet', description: 'Side sheet' },
  { id: 'popover', category: 'container', label: 'Popover', description: 'Popover' },
  { id: 'accordion', category: 'container', label: 'Accordion', description: 'Collapsible sections' },
  { id: 'collapsible', category: 'container', label: 'Collapsible', description: 'Single collapse' },
  { id: 'separator', category: 'container', label: 'Separator', description: 'Divider' },

  // feedback
  { id: 'toast', category: 'feedback', label: 'Toast', description: 'Notification toast' },
  { id: 'alert', category: 'feedback', label: 'Alert', description: 'Banner alert' },
  { id: 'badge', category: 'feedback', label: 'Badge', description: 'Badge' },
  { id: 'tag', category: 'feedback', label: 'Tag', description: 'Tag chip' },
  { id: 'tooltip', category: 'feedback', label: 'Tooltip', description: 'Tooltip' },
  { id: 'progress', category: 'feedback', label: 'Progress', description: 'Progress bar' },
  { id: 'spinner', category: 'feedback', label: 'Spinner', description: 'Loading spinner' },
  { id: 'skeleton', category: 'feedback', label: 'Skeleton', description: 'Loading skeleton' },

  // navigation
  {
    id: 'nav-menu',
    category: 'navigation',
    label: 'Nav Menu',
    description: 'Navigation menu',
  },
  {
    id: 'sidebar-nav',
    category: 'navigation',
    label: 'Sidebar Nav',
    description: 'Sidebar menu',
  },
  { id: 'tabs', category: 'navigation', label: 'Tabs', description: 'Tabs' },
  { id: 'breadcrumb', category: 'navigation', label: 'Breadcrumb', description: 'Breadcrumb trail' },
  { id: 'pagination', category: 'navigation', label: 'Pagination', description: 'Pagination' },
  { id: 'stepper', category: 'navigation', label: 'Stepper', description: 'Step progress' },
  {
    id: 'command-menu',
    category: 'navigation',
    label: 'Command Menu',
    description: 'Command palette',
  },

  // data
  { id: 'table', category: 'data', label: 'Table', description: 'Data table' },
  { id: 'list', category: 'data', label: 'List', description: 'List' },
  { id: 'tree', category: 'data', label: 'Tree', description: 'Tree view' },
  { id: 'avatar', category: 'data', label: 'Avatar', description: 'User avatar' },
  { id: 'calendar', category: 'data', label: 'Calendar', description: 'Calendar' },
  { id: 'kanban', category: 'data', label: 'Kanban', description: 'Kanban board' },
  { id: 'chart', category: 'data', label: 'Chart', description: 'Chart (base colors only)' },
  { id: 'stat', category: 'data', label: 'Stat', description: 'Numeric metric' },
] as const satisfies readonly ComponentType[];

/** 카탈로그가 선언한 컴포넌트 id의 리터럴 유니언. slot 정의에서 componentType을 고정한다. */
export type CatalogComponentId = (typeof COMPONENT_TYPES)[number]['id'];

export type Preset = {
  id: string;
  label: string;
  description: string;
  components: CatalogComponentId[];
};

export const PRESETS: Preset[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Minimal setup for landing pages or blogs',
    components: ['button', 'link', 'card'],
  },
  {
    id: 'todo',
    label: 'Todo / Task App',
    description: 'Todo apps and simple tools',
    components: ['button', 'input', 'checkbox', 'list', 'badge'],
  },
  {
    id: 'dashboard',
    label: 'Dashboard / Admin',
    description: 'Admin dashboards and data-dense screens',
    components: [
      'button',
      'icon-button',
      'link',
      'input',
      'select',
      'checkbox',
      'card',
      'dialog',
      'tabs',
      'table',
      'stat',
      'chart',
      'toast',
      'badge',
      'tooltip',
      'sidebar-nav',
      'breadcrumb',
    ],
  },
  {
    id: 'saas',
    label: 'Full SaaS',
    description: 'Full composition for a typical SaaS product',
    components: [
      'button',
      'icon-button',
      'link',
      'checkbox',
      'radio',
      'switch',
      'slider',
      'input',
      'textarea',
      'select',
      'combobox',
      'date-picker',
      'card',
      'dialog',
      'sheet',
      'popover',
      'accordion',
      'toast',
      'alert',
      'badge',
      'tag',
      'tooltip',
      'progress',
      'skeleton',
      'nav-menu',
      'sidebar-nav',
      'tabs',
      'breadcrumb',
      'pagination',
      'command-menu',
      'table',
      'list',
      'avatar',
    ],
  },
];
