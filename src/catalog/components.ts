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
    description: '본문, 헤딩, 라벨 등 기본 텍스트',
    alwaysIncluded: true,
  },

  // interactive
  { id: 'button', category: 'interactive', label: 'Button', description: '기본 버튼' },
  {
    id: 'icon-button',
    category: 'interactive',
    label: 'Icon Button',
    description: '아이콘만 있는 버튼',
  },
  { id: 'link', category: 'interactive', label: 'Link', description: '링크 텍스트' },
  { id: 'checkbox', category: 'interactive', label: 'Checkbox', description: '체크박스' },
  { id: 'radio', category: 'interactive', label: 'Radio', description: '라디오 버튼' },
  { id: 'switch', category: 'interactive', label: 'Switch', description: '토글 스위치' },
  { id: 'slider', category: 'interactive', label: 'Slider', description: '값 조절 슬라이더' },
  {
    id: 'toggle-group',
    category: 'interactive',
    label: 'Toggle Group',
    description: '세그먼트 컨트롤',
  },

  // input
  { id: 'input', category: 'input', label: 'Input', description: '텍스트 입력' },
  { id: 'textarea', category: 'input', label: 'Textarea', description: '여러 줄 텍스트' },
  { id: 'select', category: 'input', label: 'Select', description: '드롭다운 선택' },
  { id: 'combobox', category: 'input', label: 'Combobox', description: '검색 가능한 선택' },
  { id: 'date-picker', category: 'input', label: 'Date Picker', description: '날짜 선택' },

  // container
  { id: 'card', category: 'container', label: 'Card', description: '카드 패널' },
  { id: 'dialog', category: 'container', label: 'Dialog', description: '모달 다이얼로그' },
  { id: 'sheet', category: 'container', label: 'Sheet', description: '사이드 시트' },
  { id: 'popover', category: 'container', label: 'Popover', description: '팝오버' },
  { id: 'accordion', category: 'container', label: 'Accordion', description: '접히는 섹션' },
  { id: 'collapsible', category: 'container', label: 'Collapsible', description: '단일 접기' },
  { id: 'separator', category: 'container', label: 'Separator', description: '구분선' },

  // feedback
  { id: 'toast', category: 'feedback', label: 'Toast', description: '알림 토스트' },
  { id: 'alert', category: 'feedback', label: 'Alert', description: '배너 알림' },
  { id: 'badge', category: 'feedback', label: 'Badge', description: '뱃지' },
  { id: 'tag', category: 'feedback', label: 'Tag', description: '태그 칩' },
  { id: 'tooltip', category: 'feedback', label: 'Tooltip', description: '툴팁' },
  { id: 'progress', category: 'feedback', label: 'Progress', description: '프로그레스 바' },
  { id: 'spinner', category: 'feedback', label: 'Spinner', description: '로딩 스피너' },
  { id: 'skeleton', category: 'feedback', label: 'Skeleton', description: '로딩 스켈레톤' },

  // navigation
  {
    id: 'nav-menu',
    category: 'navigation',
    label: 'Nav Menu',
    description: '내비게이션 메뉴',
  },
  {
    id: 'sidebar-nav',
    category: 'navigation',
    label: 'Sidebar Nav',
    description: '사이드바 메뉴',
  },
  { id: 'tabs', category: 'navigation', label: 'Tabs', description: '탭' },
  { id: 'breadcrumb', category: 'navigation', label: 'Breadcrumb', description: '경로 표시' },
  { id: 'pagination', category: 'navigation', label: 'Pagination', description: '페이지네이션' },
  { id: 'stepper', category: 'navigation', label: 'Stepper', description: '진행 단계' },
  {
    id: 'command-menu',
    category: 'navigation',
    label: 'Command Menu',
    description: '명령 팔레트',
  },

  // data
  { id: 'table', category: 'data', label: 'Table', description: '데이터 테이블' },
  { id: 'list', category: 'data', label: 'List', description: '리스트' },
  { id: 'tree', category: 'data', label: 'Tree', description: '트리 뷰' },
  { id: 'avatar', category: 'data', label: 'Avatar', description: '사용자 아바타' },
  { id: 'calendar', category: 'data', label: 'Calendar', description: '달력' },
  { id: 'kanban', category: 'data', label: 'Kanban', description: '칸반 보드' },
  { id: 'chart', category: 'data', label: 'Chart', description: '차트 (기본 색만)' },
  { id: 'stat', category: 'data', label: 'Stat', description: '숫자 지표' },
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
    description: '랜딩 페이지, 블로그 수준의 최소 구성',
    components: ['button', 'link', 'card'],
  },
  {
    id: 'todo',
    label: 'Todo / Task App',
    description: '할일 앱, 간단한 도구',
    components: ['button', 'input', 'checkbox', 'list', 'badge'],
  },
  {
    id: 'dashboard',
    label: 'Dashboard / Admin',
    description: '관리자 대시보드, 데이터 집약적 화면',
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
    description: '일반적인 SaaS 제품의 전체 구성',
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
