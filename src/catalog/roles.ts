import type { ShadeIndex } from '../ir/types';

/**
 * 카탈로그가 관리하는 semantic role 집합.
 * 여기서 "색 값"을 정하지 않는다. Role은 사용자 결정의 목적지이고, 이 모듈은 목적지 이름표만 들고 있는다.
 */

export type RoleGroup = 'brand' | 'structural' | 'content' | 'state';

export type RoleDefinition = {
  id: string;
  group: RoleGroup;
  description: string;
  defaultShade: ShadeIndex;
};

export const ROLE_DEFINITIONS = [
  // brand
  { id: 'primary', group: 'brand', description: 'Primary brand color', defaultShade: 500 },
  {
    id: 'primary-fg',
    group: 'brand',
    description: 'Text / icons on top of primary',
    defaultShade: 50,
  },
  { id: 'accent', group: 'brand', description: 'Secondary accent (links, tags)', defaultShade: 500 },
  { id: 'accent-fg', group: 'brand', description: 'Text on top of accent', defaultShade: 50 },

  // structural
  { id: 'background', group: 'structural', description: 'Page background', defaultShade: 50 },
  { id: 'foreground', group: 'structural', description: 'Default page text', defaultShade: 900 },
  { id: 'card', group: 'structural', description: 'Card / panel background', defaultShade: 100 },
  { id: 'card-fg', group: 'structural', description: 'Text inside cards', defaultShade: 900 },
  { id: 'popover', group: 'structural', description: 'Popover / menu background', defaultShade: 50 },
  { id: 'popover-fg', group: 'structural', description: 'Text inside popovers', defaultShade: 900 },
  { id: 'border', group: 'structural', description: 'Default dividers / borders', defaultShade: 200 },
  { id: 'input', group: 'structural', description: 'Input field background', defaultShade: 50 },
  { id: 'ring', group: 'structural', description: 'Focus ring', defaultShade: 500 },

  // content
  { id: 'muted', group: 'content', description: 'Subtle background (gray tones)', defaultShade: 100 },
  {
    id: 'muted-fg',
    group: 'content',
    description: 'Secondary text (placeholder, caption)',
    defaultShade: 500,
  },

  // state
  {
    id: 'destructive',
    group: 'state',
    description: 'Destructive action (delete, error)',
    defaultShade: 500,
  },
  {
    id: 'destructive-fg',
    group: 'state',
    description: 'Text on top of destructive',
    defaultShade: 50,
  },
  { id: 'warning', group: 'state', description: 'Warning state', defaultShade: 500 },
  { id: 'warning-fg', group: 'state', description: 'Text on top of warning', defaultShade: 50 },
  { id: 'success', group: 'state', description: 'Success state', defaultShade: 500 },
  { id: 'success-fg', group: 'state', description: 'Text on top of success', defaultShade: 50 },
  { id: 'info', group: 'state', description: 'Informational', defaultShade: 500 },
  { id: 'info-fg', group: 'state', description: 'Text on top of info', defaultShade: 50 },
] as const satisfies readonly RoleDefinition[];

/** 카탈로그에 선언된 role id의 리터럴 유니언. slot 정의에서 role 참조를 컴파일 타임에 고정한다. */
export type CatalogRoleId = (typeof ROLE_DEFINITIONS)[number]['id'];
