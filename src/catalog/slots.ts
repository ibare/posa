import type { ShadeIndex } from '../ir/types';
import type { CatalogComponentId } from './components';
import type { CatalogRoleId } from './roles';

/**
 * 컴포넌트별 slot 정의.
 * 여기서 "색"을 정하지 않는다. slot은 어느 role을 참조할지만 말한다.
 * slot.id는 전역적으로 유니크해야 하며, `{component}.{variant}.{part}` 컨벤션을 따른다.
 */

export type SlotDefinition = {
  id: string;
  role: CatalogRoleId;
  shadeOverride?: ShadeIndex;
  states: string[];
  componentType: CatalogComponentId;
};

const DEFAULT_STATES: string[] = ['default'];

export const SLOT_DEFINITIONS: SlotDefinition[] = [
  // -------- typography --------
  {
    id: 'text.heading',
    role: 'foreground',
    componentType: 'typography',
    states: DEFAULT_STATES,
  },
  { id: 'text.body', role: 'foreground', componentType: 'typography', states: DEFAULT_STATES },
  { id: 'text.muted', role: 'muted-fg', componentType: 'typography', states: DEFAULT_STATES },

  // -------- button --------
  {
    id: 'button.primary.bg',
    role: 'primary',
    componentType: 'button',
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'button.primary.fg',
    role: 'primary-fg',
    componentType: 'button',
    states: ['default', 'disabled'],
  },
  {
    id: 'button.secondary.bg',
    role: 'muted',
    componentType: 'button',
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'button.secondary.fg',
    role: 'foreground',
    componentType: 'button',
    states: ['default', 'disabled'],
  },
  {
    id: 'button.destructive.bg',
    role: 'destructive',
    componentType: 'button',
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'button.destructive.fg',
    role: 'destructive-fg',
    componentType: 'button',
    states: ['default', 'disabled'],
  },
  {
    id: 'button.outline.border',
    role: 'border',
    componentType: 'button',
    states: ['default', 'hover', 'focus'],
  },
  {
    id: 'button.ghost.bg',
    role: 'muted',
    shadeOverride: 50,
    componentType: 'button',
    states: ['default', 'hover'],
  },
  {
    id: 'button.ghost.fg',
    role: 'foreground',
    componentType: 'button',
    states: ['default', 'hover', 'disabled'],
  },

  // -------- icon-button --------
  {
    id: 'icon-button.fg',
    role: 'foreground',
    componentType: 'icon-button',
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'icon-button.hover.bg',
    role: 'muted',
    componentType: 'icon-button',
    states: ['default', 'hover'],
  },

  // -------- link --------
  {
    id: 'link.fg',
    role: 'accent',
    componentType: 'link',
    states: ['default', 'hover', 'visited'],
  },
  { id: 'link.underline', role: 'accent', componentType: 'link', states: DEFAULT_STATES },

  // -------- checkbox --------
  {
    id: 'checkbox.border',
    role: 'border',
    componentType: 'checkbox',
    states: ['default', 'hover', 'focus'],
  },
  {
    id: 'checkbox.checked.bg',
    role: 'primary',
    componentType: 'checkbox',
    states: DEFAULT_STATES,
  },
  {
    id: 'checkbox.checked.fg',
    role: 'primary-fg',
    componentType: 'checkbox',
    states: DEFAULT_STATES,
  },

  // -------- radio --------
  {
    id: 'radio.border',
    role: 'border',
    componentType: 'radio',
    states: ['default', 'hover', 'focus'],
  },
  {
    id: 'radio.checked.bg',
    role: 'primary',
    componentType: 'radio',
    states: DEFAULT_STATES,
  },
  {
    id: 'radio.checked.fg',
    role: 'primary-fg',
    componentType: 'radio',
    states: DEFAULT_STATES,
  },

  // -------- switch --------
  { id: 'switch.track.off.bg', role: 'muted', componentType: 'switch', states: DEFAULT_STATES },
  { id: 'switch.track.on.bg', role: 'primary', componentType: 'switch', states: DEFAULT_STATES },
  {
    id: 'switch.thumb.bg',
    role: 'background',
    componentType: 'switch',
    states: ['default', 'on'],
  },

  // -------- slider --------
  { id: 'slider.track.bg', role: 'muted', componentType: 'slider', states: DEFAULT_STATES },
  { id: 'slider.range.bg', role: 'primary', componentType: 'slider', states: DEFAULT_STATES },
  {
    id: 'slider.thumb.bg',
    role: 'primary',
    componentType: 'slider',
    states: ['default', 'hover', 'active'],
  },

  // -------- toggle-group --------
  {
    id: 'toggle.bg',
    role: 'muted',
    componentType: 'toggle-group',
    states: ['default', 'active'],
  },
  {
    id: 'toggle.fg',
    role: 'foreground',
    componentType: 'toggle-group',
    states: ['default', 'active'],
  },

  // -------- input --------
  { id: 'input.bg', role: 'input', componentType: 'input', states: ['default', 'disabled'] },
  {
    id: 'input.fg',
    role: 'foreground',
    componentType: 'input',
    states: ['default', 'disabled'],
  },
  {
    id: 'input.border',
    role: 'border',
    componentType: 'input',
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'input.placeholder.fg',
    role: 'muted-fg',
    componentType: 'input',
    states: DEFAULT_STATES,
  },

  // -------- textarea --------
  {
    id: 'textarea.bg',
    role: 'input',
    componentType: 'textarea',
    states: ['default', 'disabled'],
  },
  {
    id: 'textarea.fg',
    role: 'foreground',
    componentType: 'textarea',
    states: ['default', 'disabled'],
  },
  {
    id: 'textarea.border',
    role: 'border',
    componentType: 'textarea',
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'textarea.placeholder.fg',
    role: 'muted-fg',
    componentType: 'textarea',
    states: DEFAULT_STATES,
  },

  // -------- select --------
  { id: 'select.bg', role: 'input', componentType: 'select', states: ['default', 'disabled'] },
  {
    id: 'select.fg',
    role: 'foreground',
    componentType: 'select',
    states: ['default', 'disabled'],
  },
  {
    id: 'select.border',
    role: 'border',
    componentType: 'select',
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'select.placeholder.fg',
    role: 'muted-fg',
    componentType: 'select',
    states: DEFAULT_STATES,
  },
  {
    id: 'select.dropdown.bg',
    role: 'popover',
    componentType: 'select',
    states: DEFAULT_STATES,
  },

  // -------- combobox --------
  {
    id: 'combobox.bg',
    role: 'input',
    componentType: 'combobox',
    states: ['default', 'disabled'],
  },
  {
    id: 'combobox.fg',
    role: 'foreground',
    componentType: 'combobox',
    states: ['default', 'disabled'],
  },
  {
    id: 'combobox.border',
    role: 'border',
    componentType: 'combobox',
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'combobox.placeholder.fg',
    role: 'muted-fg',
    componentType: 'combobox',
    states: DEFAULT_STATES,
  },
  {
    id: 'combobox.dropdown.bg',
    role: 'popover',
    componentType: 'combobox',
    states: DEFAULT_STATES,
  },
  {
    id: 'combobox.highlight.bg',
    role: 'accent',
    shadeOverride: 100,
    componentType: 'combobox',
    states: DEFAULT_STATES,
  },

  // -------- date-picker --------
  {
    id: 'date-picker.bg',
    role: 'input',
    componentType: 'date-picker',
    states: ['default', 'disabled'],
  },
  {
    id: 'date-picker.fg',
    role: 'foreground',
    componentType: 'date-picker',
    states: ['default', 'disabled'],
  },
  {
    id: 'date-picker.border',
    role: 'border',
    componentType: 'date-picker',
    states: ['default', 'focus', 'disabled'],
  },
  {
    id: 'date-picker.icon.fg',
    role: 'muted-fg',
    componentType: 'date-picker',
    states: DEFAULT_STATES,
  },
  {
    id: 'date-picker.popover.bg',
    role: 'popover',
    componentType: 'date-picker',
    states: DEFAULT_STATES,
  },

  // -------- card --------
  { id: 'card.bg', role: 'card', componentType: 'card', states: DEFAULT_STATES },
  { id: 'card.border', role: 'border', componentType: 'card', states: DEFAULT_STATES },
  { id: 'card.fg', role: 'card-fg', componentType: 'card', states: DEFAULT_STATES },

  // -------- dialog --------
  { id: 'dialog.bg', role: 'popover', componentType: 'dialog', states: DEFAULT_STATES },
  { id: 'dialog.border', role: 'border', componentType: 'dialog', states: DEFAULT_STATES },
  {
    id: 'dialog.overlay.bg',
    role: 'foreground',
    shadeOverride: 900,
    componentType: 'dialog',
    states: DEFAULT_STATES,
  },

  // -------- sheet --------
  { id: 'sheet.bg', role: 'popover', componentType: 'sheet', states: DEFAULT_STATES },
  { id: 'sheet.border', role: 'border', componentType: 'sheet', states: DEFAULT_STATES },
  {
    id: 'sheet.overlay.bg',
    role: 'foreground',
    shadeOverride: 900,
    componentType: 'sheet',
    states: DEFAULT_STATES,
  },

  // -------- popover --------
  { id: 'popover.bg', role: 'popover', componentType: 'popover', states: DEFAULT_STATES },
  { id: 'popover.border', role: 'border', componentType: 'popover', states: DEFAULT_STATES },
  { id: 'popover.fg', role: 'popover-fg', componentType: 'popover', states: DEFAULT_STATES },

  // -------- accordion --------
  {
    id: 'accordion.border',
    role: 'border',
    componentType: 'accordion',
    states: DEFAULT_STATES,
  },
  {
    id: 'accordion.trigger.fg',
    role: 'foreground',
    componentType: 'accordion',
    states: ['default', 'hover'],
  },

  // -------- collapsible --------
  {
    id: 'collapsible.border',
    role: 'border',
    componentType: 'collapsible',
    states: DEFAULT_STATES,
  },
  {
    id: 'collapsible.trigger.fg',
    role: 'foreground',
    componentType: 'collapsible',
    states: ['default', 'hover'],
  },

  // -------- separator --------
  {
    id: 'separator.bg',
    role: 'border',
    componentType: 'separator',
    states: DEFAULT_STATES,
  },

  // -------- toast (5 variants × 3 slots) --------
  { id: 'toast.default.bg', role: 'card', componentType: 'toast', states: DEFAULT_STATES },
  { id: 'toast.default.fg', role: 'card-fg', componentType: 'toast', states: DEFAULT_STATES },
  {
    id: 'toast.default.border',
    role: 'border',
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  {
    id: 'toast.destructive.bg',
    role: 'destructive',
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  {
    id: 'toast.destructive.fg',
    role: 'destructive-fg',
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  {
    id: 'toast.destructive.border',
    role: 'destructive',
    shadeOverride: 200,
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  {
    id: 'toast.warning.bg',
    role: 'warning',
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  {
    id: 'toast.warning.fg',
    role: 'warning-fg',
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  {
    id: 'toast.warning.border',
    role: 'warning',
    shadeOverride: 200,
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  {
    id: 'toast.success.bg',
    role: 'success',
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  {
    id: 'toast.success.fg',
    role: 'success-fg',
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  {
    id: 'toast.success.border',
    role: 'success',
    shadeOverride: 200,
    componentType: 'toast',
    states: DEFAULT_STATES,
  },
  { id: 'toast.info.bg', role: 'info', componentType: 'toast', states: DEFAULT_STATES },
  { id: 'toast.info.fg', role: 'info-fg', componentType: 'toast', states: DEFAULT_STATES },
  {
    id: 'toast.info.border',
    role: 'info',
    shadeOverride: 200,
    componentType: 'toast',
    states: DEFAULT_STATES,
  },

  // -------- alert (5 variants × 3 slots) --------
  { id: 'alert.default.bg', role: 'card', componentType: 'alert', states: DEFAULT_STATES },
  { id: 'alert.default.fg', role: 'card-fg', componentType: 'alert', states: DEFAULT_STATES },
  {
    id: 'alert.default.border',
    role: 'border',
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.destructive.bg',
    role: 'destructive',
    shadeOverride: 100,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.destructive.fg',
    role: 'destructive',
    shadeOverride: 800,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.destructive.border',
    role: 'destructive',
    shadeOverride: 200,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.warning.bg',
    role: 'warning',
    shadeOverride: 100,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.warning.fg',
    role: 'warning',
    shadeOverride: 800,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.warning.border',
    role: 'warning',
    shadeOverride: 200,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.success.bg',
    role: 'success',
    shadeOverride: 100,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.success.fg',
    role: 'success',
    shadeOverride: 800,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.success.border',
    role: 'success',
    shadeOverride: 200,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.info.bg',
    role: 'info',
    shadeOverride: 100,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.info.fg',
    role: 'info',
    shadeOverride: 800,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },
  {
    id: 'alert.info.border',
    role: 'info',
    shadeOverride: 200,
    componentType: 'alert',
    states: DEFAULT_STATES,
  },

  // -------- badge (4 variants × 2 slots) --------
  { id: 'badge.default.bg', role: 'primary', componentType: 'badge', states: DEFAULT_STATES },
  {
    id: 'badge.default.fg',
    role: 'primary-fg',
    componentType: 'badge',
    states: DEFAULT_STATES,
  },
  {
    id: 'badge.secondary.bg',
    role: 'muted',
    componentType: 'badge',
    states: DEFAULT_STATES,
  },
  {
    id: 'badge.secondary.fg',
    role: 'foreground',
    componentType: 'badge',
    states: DEFAULT_STATES,
  },
  {
    id: 'badge.destructive.bg',
    role: 'destructive',
    componentType: 'badge',
    states: DEFAULT_STATES,
  },
  {
    id: 'badge.destructive.fg',
    role: 'destructive-fg',
    componentType: 'badge',
    states: DEFAULT_STATES,
  },
  {
    id: 'badge.outline.border',
    role: 'border',
    componentType: 'badge',
    states: DEFAULT_STATES,
  },
  {
    id: 'badge.outline.fg',
    role: 'foreground',
    componentType: 'badge',
    states: DEFAULT_STATES,
  },

  // -------- tag (4 variants × 2 slots) --------
  { id: 'tag.default.bg', role: 'primary', componentType: 'tag', states: DEFAULT_STATES },
  {
    id: 'tag.default.fg',
    role: 'primary-fg',
    componentType: 'tag',
    states: DEFAULT_STATES,
  },
  {
    id: 'tag.secondary.bg',
    role: 'muted',
    componentType: 'tag',
    states: DEFAULT_STATES,
  },
  {
    id: 'tag.secondary.fg',
    role: 'foreground',
    componentType: 'tag',
    states: DEFAULT_STATES,
  },
  {
    id: 'tag.destructive.bg',
    role: 'destructive',
    componentType: 'tag',
    states: DEFAULT_STATES,
  },
  {
    id: 'tag.destructive.fg',
    role: 'destructive-fg',
    componentType: 'tag',
    states: DEFAULT_STATES,
  },
  {
    id: 'tag.outline.border',
    role: 'border',
    componentType: 'tag',
    states: DEFAULT_STATES,
  },
  {
    id: 'tag.outline.fg',
    role: 'foreground',
    componentType: 'tag',
    states: DEFAULT_STATES,
  },

  // -------- tooltip --------
  {
    id: 'tooltip.bg',
    role: 'foreground',
    shadeOverride: 900,
    componentType: 'tooltip',
    states: DEFAULT_STATES,
  },
  { id: 'tooltip.fg', role: 'background', componentType: 'tooltip', states: DEFAULT_STATES },

  // -------- progress --------
  {
    id: 'progress.track.bg',
    role: 'muted',
    componentType: 'progress',
    states: DEFAULT_STATES,
  },
  {
    id: 'progress.indicator.bg',
    role: 'primary',
    componentType: 'progress',
    states: DEFAULT_STATES,
  },

  // -------- spinner --------
  { id: 'spinner.fg', role: 'primary', componentType: 'spinner', states: DEFAULT_STATES },

  // -------- skeleton --------
  { id: 'skeleton.bg', role: 'muted', componentType: 'skeleton', states: DEFAULT_STATES },

  // -------- nav-menu --------
  { id: 'nav.bg', role: 'background', componentType: 'nav-menu', states: DEFAULT_STATES },
  {
    id: 'nav.item.fg',
    role: 'foreground',
    componentType: 'nav-menu',
    states: ['default', 'hover', 'active'],
  },

  // -------- sidebar-nav --------
  { id: 'sidebar.bg', role: 'card', componentType: 'sidebar-nav', states: DEFAULT_STATES },
  {
    id: 'sidebar.item.fg',
    role: 'foreground',
    componentType: 'sidebar-nav',
    states: ['default', 'hover', 'active'],
  },
  {
    id: 'sidebar.item.active.bg',
    role: 'primary',
    shadeOverride: 100,
    componentType: 'sidebar-nav',
    states: DEFAULT_STATES,
  },

  // -------- tabs --------
  {
    id: 'tabs.trigger.fg',
    role: 'muted-fg',
    componentType: 'tabs',
    states: ['default', 'active'],
  },
  { id: 'tabs.indicator.bg', role: 'primary', componentType: 'tabs', states: DEFAULT_STATES },

  // -------- breadcrumb --------
  {
    id: 'breadcrumb.fg',
    role: 'muted-fg',
    componentType: 'breadcrumb',
    states: ['default', 'hover'],
  },
  {
    id: 'breadcrumb.separator.fg',
    role: 'muted-fg',
    componentType: 'breadcrumb',
    states: DEFAULT_STATES,
  },

  // -------- pagination --------
  {
    id: 'pagination.fg',
    role: 'foreground',
    componentType: 'pagination',
    states: ['default', 'hover', 'active', 'disabled'],
  },
  {
    id: 'pagination.current.bg',
    role: 'primary',
    componentType: 'pagination',
    states: DEFAULT_STATES,
  },
  {
    id: 'pagination.current.fg',
    role: 'primary-fg',
    componentType: 'pagination',
    states: DEFAULT_STATES,
  },

  // -------- stepper --------
  {
    id: 'stepper.dot.bg',
    role: 'muted',
    componentType: 'stepper',
    states: ['pending', 'active', 'complete'],
  },
  { id: 'stepper.line.bg', role: 'border', componentType: 'stepper', states: DEFAULT_STATES },

  // -------- command-menu --------
  {
    id: 'command-menu.bg',
    role: 'popover',
    componentType: 'command-menu',
    states: DEFAULT_STATES,
  },
  {
    id: 'command-menu.fg',
    role: 'popover-fg',
    componentType: 'command-menu',
    states: DEFAULT_STATES,
  },
  {
    id: 'command-menu.border',
    role: 'border',
    componentType: 'command-menu',
    states: DEFAULT_STATES,
  },
  {
    id: 'command-menu.input.bg',
    role: 'input',
    componentType: 'command-menu',
    states: DEFAULT_STATES,
  },
  {
    id: 'command-menu.item.bg',
    role: 'popover',
    componentType: 'command-menu',
    states: ['default', 'highlighted'],
  },
  {
    id: 'command-menu.item.fg',
    role: 'popover-fg',
    componentType: 'command-menu',
    states: ['default', 'highlighted'],
  },

  // -------- table --------
  {
    id: 'table.header.bg',
    role: 'muted',
    componentType: 'table',
    states: DEFAULT_STATES,
  },
  {
    id: 'table.row.bg',
    role: 'card',
    componentType: 'table',
    states: ['default', 'hover', 'selected'],
  },
  { id: 'table.border', role: 'border', componentType: 'table', states: DEFAULT_STATES },
  {
    id: 'table.caption.fg',
    role: 'muted-fg',
    componentType: 'table',
    states: DEFAULT_STATES,
  },

  // -------- list --------
  {
    id: 'list.item.bg',
    role: 'background',
    componentType: 'list',
    states: ['default', 'hover', 'selected'],
  },
  { id: 'list.item.fg', role: 'foreground', componentType: 'list', states: DEFAULT_STATES },
  { id: 'list.border', role: 'border', componentType: 'list', states: DEFAULT_STATES },

  // -------- tree --------
  {
    id: 'tree.item.bg',
    role: 'background',
    componentType: 'tree',
    states: ['default', 'hover', 'selected'],
  },
  { id: 'tree.item.fg', role: 'foreground', componentType: 'tree', states: DEFAULT_STATES },
  { id: 'tree.border', role: 'border', componentType: 'tree', states: DEFAULT_STATES },
  {
    id: 'tree.indent.guide',
    role: 'border',
    shadeOverride: 100,
    componentType: 'tree',
    states: DEFAULT_STATES,
  },

  // -------- avatar --------
  { id: 'avatar.bg', role: 'muted', componentType: 'avatar', states: DEFAULT_STATES },
  { id: 'avatar.fg', role: 'foreground', componentType: 'avatar', states: DEFAULT_STATES },
  { id: 'avatar.border', role: 'background', componentType: 'avatar', states: DEFAULT_STATES },

  // -------- calendar --------
  {
    id: 'calendar.day.bg',
    role: 'background',
    componentType: 'calendar',
    states: ['default', 'today', 'selected', 'outside'],
  },
  {
    id: 'calendar.day.fg',
    role: 'foreground',
    componentType: 'calendar',
    states: ['default', 'today', 'selected', 'outside'],
  },

  // -------- kanban --------
  {
    id: 'kanban.column.bg',
    role: 'muted',
    componentType: 'kanban',
    states: DEFAULT_STATES,
  },
  {
    id: 'kanban.card.bg',
    role: 'card',
    componentType: 'kanban',
    states: ['default', 'hover', 'selected'],
  },
  {
    id: 'kanban.card.border',
    role: 'border',
    componentType: 'kanban',
    states: DEFAULT_STATES,
  },

  // -------- chart --------
  { id: 'chart.grid.color', role: 'border', componentType: 'chart', states: DEFAULT_STATES },
  {
    id: 'chart.axis.color',
    role: 'muted-fg',
    componentType: 'chart',
    states: DEFAULT_STATES,
  },
  { id: 'chart.series.1', role: 'primary', componentType: 'chart', states: DEFAULT_STATES },
  { id: 'chart.series.2', role: 'accent', componentType: 'chart', states: DEFAULT_STATES },
  { id: 'chart.series.3', role: 'success', componentType: 'chart', states: DEFAULT_STATES },
  { id: 'chart.series.4', role: 'warning', componentType: 'chart', states: DEFAULT_STATES },
  { id: 'chart.series.5', role: 'info', componentType: 'chart', states: DEFAULT_STATES },
  { id: 'chart.series.6', role: 'destructive', componentType: 'chart', states: DEFAULT_STATES },

  // -------- stat --------
  { id: 'stat.value.fg', role: 'foreground', componentType: 'stat', states: DEFAULT_STATES },
  { id: 'stat.label.fg', role: 'muted-fg', componentType: 'stat', states: DEFAULT_STATES },
  {
    id: 'stat.delta.positive.fg',
    role: 'success',
    componentType: 'stat',
    states: DEFAULT_STATES,
  },
  {
    id: 'stat.delta.negative.fg',
    role: 'destructive',
    componentType: 'stat',
    states: DEFAULT_STATES,
  },
];
