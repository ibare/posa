# Prompt 02 — Component Catalog + Universe Derivation

## Context

Prompt 01에서 IR 타입과 색 수학 완성. 이제 **마스터 그래프의 스키마 데이터**를 만든다.

Posa의 핵심 원칙 중 하나 (리포 루트 `README.md` 참고): **Universe emerges from component selection.** 사용자가 선택한 컴포넌트 타입들이 합쳐져서 이 인스턴스의 탐색 범위(role / slot / state 집합)가 된다.

이 프롬프트에서는 UI 없음. **정적 데이터 + 파생 로직 + 테스트**.

## Scope

1. `src/catalog/components.ts` — shadcn 기반 ~50개 컴포넌트 타입 정의
2. `src/catalog/roles.ts` — 사용될 수 있는 모든 role 정의
3. `src/catalog/slots.ts` — 각 컴포넌트 타입이 어떤 slot을 필요로 하는지 매핑
4. `src/catalog/universe.ts` — 선택된 컴포넌트에서 universe 파생
5. 위에 대한 테스트

## 1. Roles (`src/catalog/roles.ts`)

shadcn 네이밍 관행 차용. 다음 role들을 정의:

```typescript
export type RoleGroup = "brand" | "structural" | "content" | "state";

export type RoleDefinition = {
  id: string;
  group: RoleGroup;
  description: string;      // 한국어
  defaultShade: ShadeIndex; // 기본적으로 참조할 shade
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  // brand
  { id: "primary", group: "brand", description: "주 브랜드 컬러", defaultShade: 500 },
  { id: "primary-fg", group: "brand", description: "primary 위에 올라가는 텍스트/아이콘", defaultShade: 50 },
  { id: "accent", group: "brand", description: "보조 강조 (링크, 태그)", defaultShade: 500 },
  { id: "accent-fg", group: "brand", description: "accent 위의 텍스트", defaultShade: 50 },

  // structural
  { id: "background", group: "structural", description: "페이지 배경", defaultShade: 50 },
  { id: "foreground", group: "structural", description: "페이지 기본 텍스트", defaultShade: 900 },
  { id: "card", group: "structural", description: "카드/패널 배경", defaultShade: 100 },
  { id: "card-fg", group: "structural", description: "카드 내부 텍스트", defaultShade: 900 },
  { id: "popover", group: "structural", description: "팝오버/메뉴 배경", defaultShade: 50 },
  { id: "popover-fg", group: "structural", description: "팝오버 내부 텍스트", defaultShade: 900 },
  { id: "border", group: "structural", description: "기본 구분선/테두리", defaultShade: 200 },
  { id: "input", group: "structural", description: "입력 필드 배경", defaultShade: 50 },
  { id: "ring", group: "structural", description: "포커스 링", defaultShade: 500 },

  // content
  { id: "muted", group: "content", description: "약한 배경 (회색 톤)", defaultShade: 100 },
  { id: "muted-fg", group: "content", description: "보조 텍스트 (placeholder, caption)", defaultShade: 500 },

  // state
  { id: "destructive", group: "state", description: "파괴적 액션 (삭제, 에러)", defaultShade: 500 },
  { id: "destructive-fg", group: "state", description: "destructive 위 텍스트", defaultShade: 50 },
  { id: "warning", group: "state", description: "경고 상태", defaultShade: 500 },
  { id: "warning-fg", group: "state", description: "warning 위 텍스트", defaultShade: 50 },
  { id: "success", group: "state", description: "성공 상태", defaultShade: 500 },
  { id: "success-fg", group: "state", description: "success 위 텍스트", defaultShade: 50 },
  { id: "info", group: "state", description: "정보 안내", defaultShade: 500 },
  { id: "info-fg", group: "state", description: "info 위 텍스트", defaultShade: 50 },
];
```

Foreground pairing(`primary-fg`, `card-fg` 등)은 명시적 role로 유지한다. 이게 나중에 대비비 검증과 다크모드 지원에 필수.

## 2. Components (`src/catalog/components.ts`)

shadcn/ui 라인업 + 실무 공백 보충. 카테고리로 묶어서 onboarding UI가 그룹별 표시하기 쉽게.

```typescript
export type ComponentCategory =
  | "interactive"   // 버튼, 토글, 체크박스 등
  | "input"         // 텍스트 입력 계열
  | "container"     // 카드, 다이얼로그 등
  | "feedback"      // 토스트, 배지, 툴팁 등
  | "navigation"    // 메뉴, 탭, 페이지네이션 등
  | "data"          // 테이블, 리스트 등
  | "typography";   // 본문, 헤딩 (항상 포함)

export type ComponentType = {
  id: string;
  category: ComponentCategory;
  label: string;             // 한국어 표시명
  description: string;       // 짧은 설명
  alwaysIncluded?: boolean;  // true면 onboarding에서 자동 포함
};

export const COMPONENT_TYPES: ComponentType[] = [
  // typography — 항상 포함 (앱에 글이 없을 수는 없음)
  { id: "typography", category: "typography", label: "Typography",
    description: "본문, 헤딩, 라벨 등 기본 텍스트", alwaysIncluded: true },

  // interactive
  { id: "button", category: "interactive", label: "Button", description: "기본 버튼" },
  { id: "icon-button", category: "interactive", label: "Icon Button", description: "아이콘만 있는 버튼" },
  { id: "link", category: "interactive", label: "Link", description: "링크 텍스트" },
  { id: "checkbox", category: "interactive", label: "Checkbox", description: "체크박스" },
  { id: "radio", category: "interactive", label: "Radio", description: "라디오 버튼" },
  { id: "switch", category: "interactive", label: "Switch", description: "토글 스위치" },
  { id: "slider", category: "interactive", label: "Slider", description: "값 조절 슬라이더" },
  { id: "toggle-group", category: "interactive", label: "Toggle Group", description: "세그먼트 컨트롤" },

  // input
  { id: "input", category: "input", label: "Input", description: "텍스트 입력" },
  { id: "textarea", category: "input", label: "Textarea", description: "여러 줄 텍스트" },
  { id: "select", category: "input", label: "Select", description: "드롭다운 선택" },
  { id: "combobox", category: "input", label: "Combobox", description: "검색 가능한 선택" },
  { id: "date-picker", category: "input", label: "Date Picker", description: "날짜 선택" },

  // container
  { id: "card", category: "container", label: "Card", description: "카드 패널" },
  { id: "dialog", category: "container", label: "Dialog", description: "모달 다이얼로그" },
  { id: "sheet", category: "container", label: "Sheet", description: "사이드 시트" },
  { id: "popover", category: "container", label: "Popover", description: "팝오버" },
  { id: "accordion", category: "container", label: "Accordion", description: "접히는 섹션" },
  { id: "collapsible", category: "container", label: "Collapsible", description: "단일 접기" },
  { id: "separator", category: "container", label: "Separator", description: "구분선" },

  // feedback
  { id: "toast", category: "feedback", label: "Toast", description: "알림 토스트" },
  { id: "alert", category: "feedback", label: "Alert", description: "배너 알림" },
  { id: "badge", category: "feedback", label: "Badge", description: "뱃지" },
  { id: "tag", category: "feedback", label: "Tag", description: "태그 칩" },
  { id: "tooltip", category: "feedback", label: "Tooltip", description: "툴팁" },
  { id: "progress", category: "feedback", label: "Progress", description: "프로그레스 바" },
  { id: "spinner", category: "feedback", label: "Spinner", description: "로딩 스피너" },
  { id: "skeleton", category: "feedback", label: "Skeleton", description: "로딩 스켈레톤" },

  // navigation
  { id: "nav-menu", category: "navigation", label: "Nav Menu", description: "내비게이션 메뉴" },
  { id: "sidebar-nav", category: "navigation", label: "Sidebar Nav", description: "사이드바 메뉴" },
  { id: "tabs", category: "navigation", label: "Tabs", description: "탭" },
  { id: "breadcrumb", category: "navigation", label: "Breadcrumb", description: "경로 표시" },
  { id: "pagination", category: "navigation", label: "Pagination", description: "페이지네이션" },
  { id: "stepper", category: "navigation", label: "Stepper", description: "진행 단계" },
  { id: "command-menu", category: "navigation", label: "Command Menu", description: "명령 팔레트" },

  // data
  { id: "table", category: "data", label: "Table", description: "데이터 테이블" },
  { id: "list", category: "data", label: "List", description: "리스트" },
  { id: "tree", category: "data", label: "Tree", description: "트리 뷰" },
  { id: "avatar", category: "data", label: "Avatar", description: "사용자 아바타" },
  { id: "calendar", category: "data", label: "Calendar", description: "달력" },
  { id: "kanban", category: "data", label: "Kanban", description: "칸반 보드" },
  { id: "chart", category: "data", label: "Chart", description: "차트 (기본 색만)" },
  { id: "stat", category: "data", label: "Stat", description: "숫자 지표" },
];
```

Preset도 함께 정의:

```typescript
export type Preset = {
  id: string;
  label: string;
  description: string;
  components: string[];  // ComponentType id 배열 (typography 자동 포함이므로 생략 가능)
};

export const PRESETS: Preset[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "랜딩 페이지, 블로그 수준의 최소 구성",
    components: ["button", "link", "card"],
  },
  {
    id: "todo",
    label: "Todo / Task App",
    description: "할일 앱, 간단한 도구",
    components: ["button", "input", "checkbox", "list", "badge"],
  },
  {
    id: "dashboard",
    label: "Dashboard / Admin",
    description: "관리자 대시보드, 데이터 집약적 화면",
    components: [
      "button", "icon-button", "link", "input", "select", "checkbox",
      "card", "dialog", "tabs", "table", "stat", "chart",
      "toast", "badge", "tooltip",
      "sidebar-nav", "breadcrumb",
    ],
  },
  {
    id: "saas",
    label: "Full SaaS",
    description: "일반적인 SaaS 제품의 전체 구성",
    components: [
      "button", "icon-button", "link", "checkbox", "radio", "switch", "slider",
      "input", "textarea", "select", "combobox", "date-picker",
      "card", "dialog", "sheet", "popover", "accordion",
      "toast", "alert", "badge", "tag", "tooltip", "progress", "skeleton",
      "nav-menu", "sidebar-nav", "tabs", "breadcrumb", "pagination", "command-menu",
      "table", "list", "avatar",
    ],
  },
];
```

## 3. Slots (`src/catalog/slots.ts`)

각 컴포넌트 타입이 어떤 slot을 필요로 하는지 매핑.

```typescript
export type SlotDefinition = {
  id: string;                // "button.primary.bg"
  role: string;              // 참조하는 role의 id
  shadeOverride?: ShadeIndex;// role의 defaultShade를 덮어쓸 때만
  states: string[];          // 기본은 ["default"]. 필요시 hover, active, disabled 등
  componentType: string;     // 어느 컴포넌트 타입에 속하는지
};

export const SLOT_DEFINITIONS: SlotDefinition[] = [
  // typography
  { id: "text.heading", role: "foreground", componentType: "typography",
    states: ["default"] },
  { id: "text.body", role: "foreground", componentType: "typography",
    states: ["default"] },
  { id: "text.muted", role: "muted-fg", componentType: "typography",
    states: ["default"] },

  // button
  { id: "button.primary.bg", role: "primary", componentType: "button",
    states: ["default", "hover", "active", "disabled"] },
  { id: "button.primary.fg", role: "primary-fg", componentType: "button",
    states: ["default", "disabled"] },
  { id: "button.secondary.bg", role: "muted", componentType: "button",
    states: ["default", "hover", "active", "disabled"] },
  { id: "button.secondary.fg", role: "foreground", componentType: "button",
    states: ["default", "disabled"] },
  { id: "button.destructive.bg", role: "destructive", componentType: "button",
    states: ["default", "hover", "active", "disabled"] },
  { id: "button.destructive.fg", role: "destructive-fg", componentType: "button",
    states: ["default", "disabled"] },
  { id: "button.outline.border", role: "border", componentType: "button",
    states: ["default", "hover", "focus"] },
  { id: "button.ghost.bg", role: "muted", componentType: "button",
    shadeOverride: 50, states: ["default", "hover"] },

  // ... 나머지 컴포넌트들의 slot을 모두 정의 ...
];
```

**slot 정의 지침:**

다음 컴포넌트 타입 각각에 대해 합리적인 slot 집합을 정의한다. 각 slot은 `role`을 참조하며, 필요시 `shadeOverride`로 기본 shade를 덮어쓴다:

- `typography` — 3개 (heading, body, muted)
- `button` — primary / secondary / destructive / outline / ghost 변종. 대부분 4-5개 state.
- `icon-button` — ghost 성격. `icon-button.fg`, `icon-button.hover.bg`
- `link` — `link.fg` (default, hover, visited), `link.underline`
- `checkbox` — `checkbox.border`, `checkbox.checked.bg`, `checkbox.checked.fg`
- `radio` — checkbox와 유사
- `switch` — `switch.track.bg` (off/on), `switch.thumb.bg`
- `slider` — `slider.track.bg`, `slider.range.bg`, `slider.thumb.bg`
- `toggle-group` — `toggle.bg` (default, active), `toggle.fg`
- `input` — `input.bg`, `input.fg`, `input.border` (default, focus), `input.placeholder.fg`
- `textarea` — input과 동일 구조
- `select` — input과 동일 + `select.dropdown.bg`
- `combobox` — select + `combobox.highlight.bg`
- `date-picker` — input + calendar 일부 재사용
- `card` — `card.bg`, `card.border`, `card.fg`
- `dialog` — `dialog.bg`, `dialog.border`, `dialog.overlay.bg`
- `sheet` — dialog와 유사
- `popover` — `popover.bg`, `popover.border`, `popover.fg`
- `accordion` — `accordion.border`, `accordion.trigger.fg` (default, hover)
- `collapsible` — accordion과 유사
- `separator` — `separator.bg`
- `toast` — variant별 (default, destructive, warning, success, info): `toast.{variant}.bg`, `toast.{variant}.fg`, `toast.{variant}.border`
- `alert` — variant별 (default, destructive, warning, success, info)
- `badge` — variant별 (default, secondary, destructive, outline)
- `tag` — badge와 유사
- `tooltip` — `tooltip.bg`, `tooltip.fg`
- `progress` — `progress.track.bg`, `progress.indicator.bg`
- `spinner` — `spinner.fg`
- `skeleton` — `skeleton.bg`
- `nav-menu` — `nav.bg`, `nav.item.fg` (default, hover, active)
- `sidebar-nav` — `sidebar.bg`, `sidebar.item.fg` (default, hover, active), `sidebar.item.active.bg`
- `tabs` — `tabs.trigger.fg` (default, active), `tabs.indicator.bg`
- `breadcrumb` — `breadcrumb.fg` (default, hover), `breadcrumb.separator.fg`
- `pagination` — button과 유사
- `stepper` — `stepper.dot.bg` (pending, active, complete), `stepper.line.bg`
- `command-menu` — combobox와 유사
- `table` — `table.header.bg`, `table.row.bg` (default, hover, selected), `table.border`, `table.caption.fg`
- `list` — `list.item.bg` (default, hover, selected), `list.item.fg`, `list.border`
- `tree` — list와 유사 + `tree.indent.guide`
- `avatar` — `avatar.bg`, `avatar.fg`, `avatar.border`
- `calendar` — `calendar.day.bg` (default, today, selected, outside), `calendar.day.fg`
- `kanban` — `kanban.column.bg`, `kanban.card.bg`, `kanban.card.border`
- `chart` — `chart.grid.color`, `chart.axis.color`, `chart.series.1~6` (6개 분류용 색)
- `stat` — `stat.value.fg`, `stat.label.fg`, `stat.delta.positive.fg`, `stat.delta.negative.fg`

**중요:** 모든 slot에서 참조하는 role은 **반드시 `ROLE_DEFINITIONS`에 존재하는 role**이어야 한다. 타입 체크로 강제할 수 있으면 더 좋음 (예: `role: RoleDefinition["id"]`).

## 4. Universe Derivation (`src/catalog/universe.ts`)

사용자가 선택한 컴포넌트 타입 집합으로부터 필요한 universe (slot, role, state 집합)를 계산.

```typescript
export type Universe = {
  componentTypes: string[];
  slots: SlotDefinition[];
  roles: RoleDefinition[];
  states: Set<string>;
};

export function deriveUniverse(selectedComponentIds: string[]): Universe;
```

**로직:**
1. Input: 선택된 컴포넌트 id 배열
2. `typography`는 자동 포함 (alwaysIncluded가 true인 것들)
3. `SLOT_DEFINITIONS`에서 `componentType`이 선택된 목록에 포함된 것만 필터
4. 그 slot들이 참조하는 role id들의 유니크 집합 → ROLE_DEFINITIONS에서 해당 role 뽑음
5. 모든 slot의 `states` 유니온 → Set 반환
6. 결과 Universe 반환

**Edge cases:**
- 빈 배열 입력 → typography만 포함된 universe 반환
- 존재하지 않는 컴포넌트 id는 무시 (에러 아님)
- 중복 제거

```typescript
export function applyPreset(presetId: string): string[]; // preset id → component ids
```

## 5. Tests (`tests/`)

**`tests/catalog.test.ts`:**
- 모든 SLOT_DEFINITIONS의 `role` 필드가 ROLE_DEFINITIONS에 존재하는 id인지 (참조 무결성)
- 모든 SLOT_DEFINITIONS의 `componentType`이 COMPONENT_TYPES에 존재하는 id인지
- PRESETS의 `components` 배열이 모두 유효한 component id인지

**`tests/universe.test.ts`:**
- 빈 입력 → typography만 포함
- 단일 컴포넌트 (예: button) → 관련 slot들만, 관련 role들만
- 복수 컴포넌트 → slot 합집합, role 합집합 (중복 없음)
- typography는 항상 포함됨
- 존재하지 않는 id는 무시
- Preset 적용 결과 검증

## Rules

**Do NOT:**
- role/slot/component의 **갯수**를 인위적으로 맞추려고 의미 없는 slot 추가 금지. 실용적 기준으로.
- shadcn 네이밍에서 크게 벗어나지 말 것. 업계 관행과 호환이 중요.
- universe 파생에 OKLCH 계산 끼어들게 하지 말 것. 순수 스키마 레벨.
- universe 파생 결과를 캐싱하는 시스템 만들지 말 것 (지금은 필요 없음).
- Role 혹은 slot의 **색 값**을 여기서 결정하지 말 것. 그건 사용자 결정의 영역.

**Do:**
- 모든 데이터는 TypeScript로, 런타임 검증 없이.
- Role id, slot id, component id는 **dash 또는 dot 컨벤션**. 공백 금지.
- 컴포넌트 설명은 한국어로. 코드 주석은 자유.
- Universe 파생은 순수 함수. 부작용 없음.

## Deliverables

- [ ] `src/catalog/roles.ts` 위 명세대로 24개 role (±2)
- [ ] `src/catalog/components.ts` 45-50개 컴포넌트 + 4개 이상 preset
- [ ] `src/catalog/slots.ts` 모든 컴포넌트에 대한 slot 정의 (총 150-250개 예상)
- [ ] `src/catalog/universe.ts` `deriveUniverse` + `applyPreset`
- [ ] `tests/catalog.test.ts` 참조 무결성 통과
- [ ] `tests/universe.test.ts` 통과

## Out of Scope

- UI (다음 프롬프트에서)
- Zustand store (다음 프롬프트에서)
- Primitive 생성 (Prompt 04)
- Export 컴파일러 (Prompt 05)
