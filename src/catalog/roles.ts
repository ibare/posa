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
  { id: 'primary', group: 'brand', description: '주 브랜드 컬러', defaultShade: 500 },
  {
    id: 'primary-fg',
    group: 'brand',
    description: 'primary 위에 올라가는 텍스트/아이콘',
    defaultShade: 50,
  },
  { id: 'accent', group: 'brand', description: '보조 강조 (링크, 태그)', defaultShade: 500 },
  { id: 'accent-fg', group: 'brand', description: 'accent 위의 텍스트', defaultShade: 50 },

  // structural
  { id: 'background', group: 'structural', description: '페이지 배경', defaultShade: 50 },
  { id: 'foreground', group: 'structural', description: '페이지 기본 텍스트', defaultShade: 900 },
  { id: 'card', group: 'structural', description: '카드/패널 배경', defaultShade: 100 },
  { id: 'card-fg', group: 'structural', description: '카드 내부 텍스트', defaultShade: 900 },
  { id: 'popover', group: 'structural', description: '팝오버/메뉴 배경', defaultShade: 50 },
  { id: 'popover-fg', group: 'structural', description: '팝오버 내부 텍스트', defaultShade: 900 },
  { id: 'border', group: 'structural', description: '기본 구분선/테두리', defaultShade: 200 },
  { id: 'input', group: 'structural', description: '입력 필드 배경', defaultShade: 50 },
  { id: 'ring', group: 'structural', description: '포커스 링', defaultShade: 500 },

  // content
  { id: 'muted', group: 'content', description: '약한 배경 (회색 톤)', defaultShade: 100 },
  {
    id: 'muted-fg',
    group: 'content',
    description: '보조 텍스트 (placeholder, caption)',
    defaultShade: 500,
  },

  // state
  {
    id: 'destructive',
    group: 'state',
    description: '파괴적 액션 (삭제, 에러)',
    defaultShade: 500,
  },
  {
    id: 'destructive-fg',
    group: 'state',
    description: 'destructive 위 텍스트',
    defaultShade: 50,
  },
  { id: 'warning', group: 'state', description: '경고 상태', defaultShade: 500 },
  { id: 'warning-fg', group: 'state', description: 'warning 위 텍스트', defaultShade: 50 },
  { id: 'success', group: 'state', description: '성공 상태', defaultShade: 500 },
  { id: 'success-fg', group: 'state', description: 'success 위 텍스트', defaultShade: 50 },
  { id: 'info', group: 'state', description: '정보 안내', defaultShade: 500 },
  { id: 'info-fg', group: 'state', description: 'info 위 텍스트', defaultShade: 50 },
] as const satisfies readonly RoleDefinition[];

/** 카탈로그에 선언된 role id의 리터럴 유니언. slot 정의에서 role 참조를 컴파일 타임에 고정한다. */
export type CatalogRoleId = (typeof ROLE_DEFINITIONS)[number]['id'];
