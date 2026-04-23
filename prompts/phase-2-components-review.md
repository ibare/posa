# Phase 2 — 컴포넌트 확장 설계 리뷰 (확정본)

## 0. 배경

shadcn/ui의 컴포넌트 59개 중 Posa 카탈로그에 수용할 대상이 확정되었다. 현재 구현된 5개 (**Button, Input, Card, Badge, Toast**) 외에 **44개** 추가, **15개** 제외.

| 결정 축 | 방침 |
|---|---|
| shape 외형 (HTML 구조 / 치수 / 레이아웃) | shadcn/ui 원본을 그대로 차용. 새 디자인 가이드 없음 |
| 색 축 (attribute 구성, slot 설계, variant, state) | Posa 규범으로 설계 |
| 상호작용 | shape은 정적 프리뷰. hover/focus는 CSS 변수 주입으로만 표현 |

---

## 1. 축 확장 (확정)

### 1-1. 새 AttributeId — 5종 전체 도입

기존: `background, text, placeholder, border, outline, icon, mark`

| 신규 | 용도 | 사용 컴포넌트 예 |
|---|---|---|
| `overlay` | 모달 backdrop (dim layer) | Dialog, Alert Dialog, Sheet, Drawer |
| `track` | 가변 요소의 뒷 레일 | Slider, Progress, Switch(off) |
| `fill` | 가변 요소의 진행/선택 구간 | Progress, Slider selected, Switch(on) |
| `thumb` | 드래그 핸들 | Slider, Switch |
| `muted` | 보조 텍스트 / 덜 강조된 영역 | Tooltip 설명, Typography `.muted`, Sidebar 비활성 항목, Table header |

결정 사항:
- `muted`는 `disabled`로 이름을 바꾸지 않는다. `disabled`는 **state** 축에 이미 존재하여 충돌 발생.
- `muted` 이름이 shadcn의 `muted-foreground` 계열 의미(덜 강조된 색 축)를 가장 잘 드러낸다.

확정 후 `ATTRIBUTE_IDS` 총 12종:
`background, text, placeholder, border, outline, icon, mark, overlay, track, fill, thumb, muted`

### 1-2. 새 StateId — `checked` 1종만 도입

기존: `default, hover, active, disabled, focus`

| 신규/후보 | 결정 |
|---|---|
| `checked` | **도입 확정** — Checkbox/Radio/Switch/Toggle 공통 |
| `selected` | 미도입 — `active` 재사용 |
| `open`/`expanded` | 미도입 — 정적 프리뷰로 커버 |
| `invalid` | 미도입 — `error` symbol을 참조하는 방식으로 해결 (slot ref kind=symbol) |
| `indeterminate` | 미도입 — 아이콘 글리프 차이일 뿐, 색 축 영향 없음 |
| `readonly` | 미도입 — `disabled` 처리로 충분 |

확정 후 `STATE_IDS` 총 6종: `default, hover, active, disabled, focus, checked`

---

## 2. 카탈로그 제외 — 확정

| 컴포넌트 | 사유 |
|---|---|
| Aspect Ratio | 순수 레이아웃 헬퍼, 색 slot 없음 |
| Resizable | 레이아웃 헬퍼 (Separator로 충분) |
| Scroll Area | Phase 3로 미룸 |
| Carousel | 레이아웃 헬퍼 (Button 재사용) |
| Chart | 대상 아님 |
| Data Table | Table에 흡수 |
| Combobox | Popover + Input 조합, 독립 slot 없음 |
| Date Picker | Popover + Calendar 조합, 독립 slot 없음 |
| Sonner | Toast로 충분 |
| Button Group | 불필요 |
| Toggle Group | 불필요 |
| Direction | 색 축 없음 |
| Empty | 색 축 없음 |
| Field | 색 축 없음 |
| Item | 색 축 없음 |

**총 15개 제외**.

---

## 3. 계열별 설계

### 3-1. Overlay 계열
**Dialog / Alert Dialog / Sheet / Drawer**
- attributes: `overlay`, `background`, `text`, `border`
- variants: 없음
- states: `default`

**Popover / Hover Card / Tooltip**
- attributes: `background`, `text`, `border` (overlay 없음)
- variants: 없음
- states: `default`

### 3-2. Menu 계열
**Dropdown Menu / Context Menu / Menubar / Navigation Menu / Command**
- attributes: `background`, `text`, `border`, `muted`(separator/shortcut), `icon`
- variants: 없음
- states: `default, hover, active, disabled`  (`active` = 현재 선택/포커스된 항목)

Command는 검색 input도 포함 → attributes에 `placeholder` 추가.

### 3-3. Form Control 계열
**Checkbox / Radio Group**
- attributes: `background`, `border`, `mark`
- variants: 없음
- states: `default, hover, focus, disabled, checked`

**Switch**
- attributes: `track`, `thumb`, `border`
- variants: 없음
- states: `default, hover, focus, disabled, checked`

**Toggle**
- attributes: `background`, `text`, `border`
- variants: 없음
- states: `default, hover, active, disabled`  (`active` = pressed)

### 3-4. Range/Progress 계열
**Slider**
- attributes: `track`, `fill`, `thumb`, `outline`(focus ring)
- variants: 없음
- states: `default, hover, focus, disabled`

**Progress**
- attributes: `track`, `fill`
- variants: 없음
- states: `default`

### 3-5. Input 계열
**Textarea / Input Group / Input OTP**
- Input 동일 구성 (attributes/states), variants 없음

**Native Select**
- Input + `icon`(chevron)

### 3-6. Display 계열
**Avatar**
- attributes: `background`, `text`, `border`
- variants: 없음
- states: `default`

**Spinner**
- attributes: `icon` (또는 `border`)
- variants: 없음
- states: `default`

**Skeleton**
- attributes: `muted` (또는 `background`)
- variants: 없음
- states: `default`

**Kbd**
- attributes: `background`, `text`, `border`
- variants: 없음
- states: `default`

### 3-7. Navigation 계열
**Breadcrumb / Tabs / Pagination**
- attributes: `background`, `text`, `border`, `muted`
- variants: 없음
- states: `default, hover, active, disabled`

**Sidebar**
- attributes: `background`, `text`, `border`, `muted`, `icon`
- variants: 없음
- states: `default, hover, active`

### 3-8. Container/Alert 계열
**Accordion / Collapsible**
- attributes: `background`, `text`, `border`
- variants: 없음
- states: `default, hover`

**Alert**
- attributes: `background`, `text`, `border`, `icon`
- variants: `primary, secondary, accent, success, info, warning, error` (Symbol 전 범위)
- states: `default`

### 3-9. Data 계열
**Table**
- attributes: `background`, `text`, `border`, `muted`
- variants: 없음
- states: `default, hover`

### 3-10. 기타
**Calendar**
- attributes: `background`, `text`, `border`, `muted`(다른 달)
- variants: 없음
- states: `default, hover, active` (`active` = 오늘/선택일)

**Separator**
- attributes: `border`
- variants: 없음
- states: `default`

**Label**
- attributes: `text`
- variants: 없음
- states: `default, disabled`

### 3-11. Typography (10종 개별 컴포넌트)

디자인 시스템 컬러 지정에 핵심이므로 전체 세트를 컴포넌트로 편입. 공통 규격:

- attributes: `text`
- variants: 없음
- states: `default`

대상 10종 (shadcn 레퍼런스 기준):
`h1, h2, h3, h4, p, blockquote, list, inline-code, lead, large, small`

(`muted`는 attribute 축에 이미 있으므로 별도 Typography 엔트리로 만들지 않음. 필요 시 어느 Typography에든 `text` 대체로 `muted`를 slot에서 참조 가능)

> 실제 엔트리 이름은 구현 시 확정. `typography-h1` 같은 prefix도 선택지.

---

## 4. Variant 배분 (확정)

Posa 규약: **variant id = SymbolId 문자열 일치**. SymbolId = `primary, secondary, accent, success, info, warning, error`.

| 컴포넌트 | variants | 근거 |
|---|---|---|
| Button (기존) | `primary, secondary, error` | 유지 |
| Badge (기존) | `secondary, error` | 유지 |
| Toast (기존) | `error, warning, success` | 유지 |
| Alert (신규) | `primary, secondary, accent, success, info, warning, error` | Symbol 전 범위 |

그 외 신규 컴포넌트는 모두 **variants 없음** (기본형 slot만 생성).

---

## 5. 컴포넌트 전수 표 (확정)

총 59종 중 채택 49종(기존 5 + 신규 44), 제외 15종.

| 컴포넌트 | 상태 | attributes | variants | states | 비고 |
|---|---|---|---|---|---|
| Accordion | 신규 | bg/text/border | — | default, hover | |
| Alert | 신규 | bg/text/border/icon | Symbol 전 범위 | default | |
| Alert Dialog | 신규 | overlay/bg/text/border | — | default | |
| Aspect Ratio | **제외** | — | — | — | |
| Avatar | 신규 | bg/text/border | — | default | |
| Badge | 기존 | — | — | — | |
| Breadcrumb | 신규 | bg/text/border/muted | — | default, hover, active, disabled | |
| Button | 기존 | — | — | — | |
| Button Group | **제외** | — | — | — | |
| Calendar | 신규 | bg/text/border/muted | — | default, hover, active | |
| Card | 기존 | — | — | — | |
| Carousel | **제외** | — | — | — | |
| Chart | **제외** | — | — | — | |
| Checkbox | 신규 | bg/border/mark | — | default, hover, focus, disabled, **checked** | |
| Collapsible | 신규 | bg/text/border | — | default, hover | |
| Combobox | **제외** | — | — | — | |
| Command | 신규 | bg/text/border/muted/icon/placeholder | — | default, hover, active, disabled | |
| Context Menu | 신규 | bg/text/border/muted/icon | — | default, hover, active, disabled | |
| Data Table | **제외** | — | — | — | Table 흡수 |
| Date Picker | **제외** | — | — | — | |
| Dialog | 신규 | overlay/bg/text/border | — | default | |
| Direction | **제외** | — | — | — | |
| Drawer | 신규 | overlay/bg/text/border | — | default | |
| Dropdown Menu | 신규 | bg/text/border/muted/icon | — | default, hover, active, disabled | |
| Empty | **제외** | — | — | — | |
| Field | **제외** | — | — | — | |
| Hover Card | 신규 | bg/text/border | — | default | |
| Input | 기존 | — | — | — | |
| Input Group | 신규 | Input 상속 | — | Input 상속 | |
| Input OTP | 신규 | Input 상속 | — | Input 상속 | |
| Item | **제외** | — | — | — | |
| Kbd | 신규 | bg/text/border | — | default | |
| Label | 신규 | text | — | default, disabled | |
| Menubar | 신규 | bg/text/border/muted/icon | — | default, hover, active, disabled | |
| Native Select | 신규 | bg/text/border/outline/icon | — | default, hover, focus, disabled | |
| Navigation Menu | 신규 | bg/text/border/muted/icon | — | default, hover, active | |
| Pagination | 신규 | bg/text/border/muted | — | default, hover, active, disabled | |
| Popover | 신규 | bg/text/border | — | default | |
| Progress | 신규 | track/fill | — | default | |
| Radio Group | 신규 | bg/border/mark | — | default, hover, focus, disabled, **checked** | |
| Resizable | **제외** | — | — | — | |
| Scroll Area | **제외** | — | — | — | Phase 3 |
| Select | 신규 | bg/text/border/outline/icon | — | default, hover, focus, active, disabled | Input+Menu 복합 |
| Separator | 신규 | border | — | default | |
| Sheet | 신규 | overlay/bg/text/border | — | default | |
| Sidebar | 신규 | bg/text/border/muted/icon | — | default, hover, active | |
| Skeleton | 신규 | muted | — | default | |
| Slider | 신규 | track/fill/thumb/outline | — | default, hover, focus, disabled | |
| Sonner | **제외** | — | — | — | Toast 동일 |
| Spinner | 신규 | icon | — | default | |
| Switch | 신규 | track/thumb/border | — | default, hover, focus, disabled, **checked** | |
| Table | 신규 | bg/text/border/muted | — | default, hover | |
| Tabs | 신규 | bg/text/border/muted | — | default, hover, active | |
| Textarea | 신규 | Input 상속 | — | Input 상속 | |
| Toast | 기존 | — | — | — | |
| Toggle | 신규 | bg/text/border | — | default, hover, active, disabled | |
| Toggle Group | **제외** | — | — | — | |
| Tooltip | 신규 | bg/text/border | — | default | |
| Typography (h1/h2/h3/h4/p/blockquote/list/inline-code/lead/large/small × 10) | 신규 | text | — | default | 개별 컴포넌트 엔트리 |

---

## 6. 진행 순서

1. **축 확장 커밋** (현재 작업)
   - `ir/types.ts`: AttributeId + 5 / StateId + 1
   - `catalog/attributes.ts`: 신규 정의 5개
   - `preview/PosaPreviewRoot.tsx`: UNSET_PLACEHOLDER 확장
   - `ui/shared/ColorExplorer/ColorExplorer.tsx`: SEA_REGISTRY 매핑
   - tsc + vitest 확인
2. **계열별 커밋** (순차)
   - Overlay 7종 (Dialog/Alert Dialog/Sheet/Drawer/Popover/Hover Card/Tooltip)
   - Menu 5종 (Dropdown Menu/Context Menu/Menubar/Navigation Menu/Command)
   - Form Control 4종 (Checkbox/Radio Group/Switch/Toggle)
   - Range 2종 (Slider/Progress)
   - Input 보조 4종 (Textarea/Input Group/Input OTP/Native Select/Select — 5종)
   - Navigation 4종 (Breadcrumb/Tabs/Pagination/Sidebar)
   - Container/Alert 3종 (Accordion/Collapsible/Alert)
   - Display 4종 (Avatar/Spinner/Skeleton/Kbd)
   - Data/기타 (Table/Calendar/Separator/Label)
   - Typography 10종
3. 각 커밋 후 tsc + vitest + 프리뷰 렌더 시각 확인(사용자).
