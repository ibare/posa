# Prompt 04 — Z1 / Z2 Planes + Primitive Creation Flow

## Context

Prompt 03까지 완료하면 Onboarding → Z0 role 탐색이 동작. 하지만 아직 색을 실제로 **할당**하는 로직이 없음. Role 카드에 Swatch가 전부 비어있음.

이 프롬프트에서 진짜 핵심을 만든다:
- Z1 (Slot) / Z2 (State) 평면
- 사용자가 색을 고르면 **primitive가 자동 생성**되고 그 shade를 참조
- Anchor 수정 시 **"Adjust vs Replace" 선택**
- 층 전환 애니메이션
- 살아있는 미니어처 breadcrumb

리포 루트 `README.md` 참고. 이 프롬프트에서 구현되는 핵심 원칙:
- Primitive as emergent memory (사용자 결정의 부산물)
- Immutability (기존 primitive 보존)
- 순차 커밋의 감각

## Scope

1. `src/color/primitive-ops.ts` — primitive 생성/조정 로직
2. `src/store/posa-store.ts` 확장 — color setter 완성
3. `src/ui/planes/Z1Plane.tsx` / `Z2Plane.tsx`
4. `src/ui/shared/Inspector.tsx` — focus된 노드의 color picker
5. `src/ui/shared/BreadcrumbStrip.tsx` + 미니어처 평면들
6. `src/ui/shared/AdjustOrReplaceDialog.tsx` — anchor 변경 시
7. 레이어 전환 CSS 애니메이션
8. 테스트

## 1. Primitive Operations (`src/color/primitive-ops.ts`)

```typescript
import type { IR, OKLCH, PrimitiveId, ShadeIndex, PrimitiveScale } from "../ir/types";
import { createPrimitive } from "./primitive";

/**
 * 새 primitive를 IR에 추가. id 자동 생성 (hue-family 기반).
 * 예: 녹색 계열 첫 번째면 "green-a", 두 번째면 "green-b".
 */
export function addPrimitive(ir: IR, anchor: OKLCH, anchorShade: ShadeIndex): {
  ir: IR;
  primitiveId: PrimitiveId;
};

/**
 * 기존 primitive의 anchor를 변경 (같은 scale 내에서 재계산).
 * 단계는 유지, 값만 바뀜. 이 primitive를 참조하는 slot들의 색은 자동으로 바뀐 값을 받음.
 */
export function adjustPrimitiveAnchor(
  ir: IR,
  primitiveId: PrimitiveId,
  newAnchor: OKLCH
): IR;

/**
 * Role이 참조하는 primitive를 완전히 다른 primitive로 교체.
 * 새 primitive가 생성되고, role이 그것을 가리키도록 변경.
 * 기존 primitive는 IR에 남아있음 (다른 slot이 참조 중일 수 있으므로).
 */
export function replaceRolePrimitive(
  ir: IR,
  roleId: string,
  newAnchor: OKLCH,
  shadeForAnchor: ShadeIndex
): IR;

/**
 * 특정 primitive를 참조하는 slot / role / state의 개수.
 * Atlas에서 사용률 표시용.
 */
export function countPrimitiveReferences(ir: IR, primitiveId: PrimitiveId): number;

/**
 * 참조 0인 primitive 찾기.
 */
export function findOrphanPrimitives(ir: IR): PrimitiveId[];

/**
 * Hue family 이름 결정 (id 생성용).
 * OKLCH의 H 값 → "red" | "orange" | "yellow" | "green" | "cyan" | "blue" | "purple" | "magenta" | "pink" | "neutral"
 * Chroma 낮으면 (< 0.03) "neutral".
 */
export function hueFamily(color: OKLCH): string;

/**
 * 새 primitive id 생성. 같은 family가 이미 있으면 "green-b", "green-c", ...
 */
export function nextPrimitiveId(ir: IR, family: string): PrimitiveId;
```

**추가 구현 요구:**
- Hue family 분할 기준 (대략):
  - H < 15 or H >= 345 → red
  - 15-45 → orange
  - 45-75 → yellow
  - 75-165 → green
  - 165-195 → cyan
  - 195-255 → blue
  - 255-285 → purple
  - 285-315 → magenta
  - 315-345 → pink
  - C < 0.03 → neutral (H 무시)
- "red-a", "red-b" 순차. 문자가 z를 넘으면 "red-aa" 식 (실제로는 거의 일어나지 않음).

## 2. Store 확장 (`src/store/posa-store.ts`)

기존 store에 추가:

```typescript
// 추가 state
pendingPrimitiveDecision: null | {
  roleId: RoleId;
  newAnchor: OKLCH;
  currentPrimitiveId: PrimitiveId;
  shadeForAnchor: ShadeIndex;
};

// 확장 actions
setRoleColor: (roleId: RoleId, color: OKLCH | null) => void;
// 로직:
// - color null: role 할당 제거 (해당 primitive가 고아가 돼도 보존)
// - role이 primitive를 아직 참조하지 않음 → 새 primitive 생성, assign
// - role이 primitive를 참조 중이고 새 color가 기존 primitive scale 내부에 있음 → primitive 내 재계산 (adjustPrimitiveAnchor)
// - role이 primitive를 참조 중이고 새 color가 scale에서 충분히 벗어남 → pendingPrimitiveDecision 세팅 (사용자에게 물어봄)

setSlotStateColor: (slotId: SlotId, state: StateId, color: OKLCH | null) => void;
// Slot의 특정 state에 색을 할당.
// - color null: state override 제거 (role의 color로 fallback)
// - color 있음: 같은 방식으로 primitive 결정 (새로 만들지 기존 걸 재사용할지)
//   단, 여기서는 "replace" 질문 없이 **가장 가까운 기존 primitive의 scale에서 가장 가까운 shade**를 찾아 참조. 없으면 새 primitive 생성.

resolvePendingPrimitive: (choice: "adjust" | "replace") => void;
// pendingPrimitiveDecision을 실행하고 null로 초기화
```

**"scale 내부인지 바깥인지" 판정:**

`isWithinScale(anchor: OKLCH, primitive: PrimitiveScale): boolean`

기준:
- Hue 거리: `hueDistance(anchor.H, primitive.anchor.H) < 20°`
- Chroma 차이: `Math.abs(anchor.C - primitive.anchor.C) < 0.08`
- (L은 제약 안 함. L만 다르면 같은 scale 내 다른 shade에 불과하므로.)

위 조건 모두 만족 시 "scale 내부". 하나라도 벗어나면 "바깥".

**이 임계값은 MVP용. 이후 튜닝 가능하게 상수로 분리.**

## 3. Z1Plane (`src/ui/planes/Z1Plane.tsx`)

현재 `selectedRole`의 universe에서 해당 role을 참조하는 slot들만 렌더.

레이아웃:
- 상단: role swatch + role id + "N slots reference this role"
- 리스트: slot 카드들
- 각 slot 카드:
  - Swatch (slot의 default state 색, 없으면 role에서 상속)
  - Slot id (mono)
  - State dots — 각 state가 할당되었는지 여부 (작은 원들)
  - "{set}/{total} states" 텍스트
  - Descend 버튼 — states.length > 1 일 때만 보임. 클릭 시 Z2로.
- 1-state slot은 descend 버튼 없음. 카드 클릭 시 Inspector만 열림 (default state 설정).

## 4. Z2Plane (`src/ui/planes/Z2Plane.tsx`)

현재 `selectedSlot`의 states 렌더.

각 state 카드:
- Swatch (해당 state의 색, 없으면 default에서, 없으면 role에서 상속)
- State name ("default", "hover", ...)
- "직접 설정" vs "상속됨" 배지
- 카드 클릭 → Inspector에 해당 state의 color picker 열림

## 5. Inspector (`src/ui/shared/Inspector.tsx`)

우측 상단 고정 패널. `focusedNode` 있을 때만 렌더. 슬라이드인 애니메이션.

레이아웃 (flex column, max-height로 viewport 내 유지):
- Header (고정): "Inspector", focused 노드 id, 닫기 버튼
- Body (스크롤): ColorPicker + "Clear" 버튼
- Footer (고정): Descend 버튼 (가능할 때)

**Layer에 따라 다른 동작:**
- Z0: focused = role id. Color picker의 onChange → `setRoleColor(roleId, color)`.
- Z1: focused = slot id. Color picker의 onChange → `setSlotStateColor(slotId, "default", color)`.
- Z2: focused = state id. Color picker의 onChange → `setSlotStateColor(selectedSlot, state, color)`.

**현재 색 표시:**
- Z0: `resolveRoleColor(ir, roleId)` 결과 or null.
- Z1: `resolveSlotColor(ir, slotId, "default")` 결과.
- Z2: `resolveSlotColor(ir, selectedSlot, state)` 결과.

**Clear 버튼:**
- 직접 할당된 경우에만 보임 (상속된 경우엔 clear할 것이 없음).
- 클릭 시 해당 slot-state 혹은 role의 값을 null로.

**이전 프로토타입의 focus halo (color bleed)** 는 여기서 재구현.

## 6. Adjust vs Replace Dialog (`src/ui/shared/AdjustOrReplaceDialog.tsx`)

`pendingPrimitiveDecision`이 non-null일 때 모달로 띄움.

내용:
- 타이틀: "이 색은 기존 ${currentFamily} 팔레트에서 벗어나 있습니다"
- 부제: "어떻게 처리할까요?"
- 두 옵션 카드 (side by side):

**Option A — Adjust this ${family}**
- 설명: "기존 ${primitiveId}의 anchor를 새 색으로 조정합니다. 같은 scale의 다른 shade들도 함께 재계산됩니다. 이 primitive를 참조하는 다른 slot들도 자동으로 영향을 받습니다."
- 미리보기: 기존 scale 11단 → 새 scale 11단 (before/after)
- 참조 수 표시: "이 primitive를 참조하는 slot: ${count}개"

**Option B — Replace with a new ${family}**
- 설명: "새 primitive를 생성합니다. 현재 role은 새 primitive를 참조하게 되고, 기존 primitive는 이전 상태 그대로 보존됩니다. 기존 primitive를 참조하던 다른 slot들은 영향받지 않습니다."
- 미리보기: 새 scale 11단만
- 고아 될 가능성 메시지: "기존 ${primitiveId}는 ${other-ref-count}개 slot이 여전히 참조합니다" (혹은 "고아 primitive가 될 수 있습니다")

하단에 "취소" 버튼.

**키보드:** A/B/Enter/Escape 대응.

## 7. Layer Transitions

CSS keyframes (이전 프로토타입에서 검증됨):

```css
@keyframes plane-enter-descend {
  from { transform: scale(1.07); opacity: 0; filter: blur(6px); }
  to   { transform: scale(1);    opacity: 1; filter: blur(0); }
}
@keyframes plane-enter-ascend {
  from { transform: scale(0.93); opacity: 0; filter: blur(4px); }
  to   { transform: scale(1);    opacity: 1; filter: blur(0); }
}
```

- Descend 시 `plane-descend` 클래스
- Ascend 시 `plane-ascend` 클래스
- Duration: 280-320ms

React key 전략: Plane 컨테이너에 `key={`${layer}-${selectedRole}-${selectedSlot}`}` 주어 재마운트 유도.

## 8. 살아있는 Breadcrumb (`src/ui/shared/BreadcrumbStrip.tsx`)

이전 프로토타입에서 서명이 됐던 요소. 재구현.

- Z0에서: 아무것도 없음 ("root" 텍스트만)
- Z1에서: `MiniZ0` (Z0의 축소 미니어처) → 현재 Z1 chip
- Z2에서: `MiniZ0` → `MiniZ1` → 현재 Z2 chip

### `MiniZ0`
- Universe의 모든 role을 4xN 그리드 dot으로. 각 dot은 실제 할당된 색 (없으면 회색).
- `selectedRole`에 해당하는 dot은 검은 링으로 강조.
- 전체가 버튼. 클릭 시 `jumpToLayer("z0")`.
- Hover 시 "Roles" 라벨.

### `MiniZ1`
- `selectedRole`의 slot들을 가로 막대 stack으로. 각 막대는 slot의 default 색.
- `selectedSlot`에 해당 slot은 링 강조.
- 클릭 시 `jumpToLayer("z1")`.

**살아있음:** 이 미니어처들은 store 구독으로 실시간 업데이트. Z2에서 색을 바꾸면 MiniZ1이 즉시 반영.

## 9. 카드 디자인 (focus glow 재확인)

- `--glow`: focused 카드의 현재 색 + "55" alpha (예: `#22c55e55`).
- `box-shadow: 0 0 0 3px var(--glow), 0 8px 24px -8px rgba(0,0,0,0.15)`
- 색이 없으면 glow 없이 일반 shadow.

## 10. Tests (`tests/`)

**`tests/primitive-ops.test.ts`:**
- `hueFamily` 경계 케이스 (H=15, 45, 75, ...)
- Chroma 낮을 때 "neutral" 반환
- `addPrimitive` 후 IR의 primitives에 추가되고 id 유니크
- `adjustPrimitiveAnchor`는 다른 primitive를 건드리지 않음
- `replaceRolePrimitive` 후 기존 primitive도 IR에 남아 있음
- `countPrimitiveReferences` 정확
- `findOrphanPrimitives` 정확

**`tests/store-flow.test.ts`:** (optional, 통합 테스트 성격)
- 컴포넌트 선택 → exploration 진입
- setRoleColor 처음 호출 시 primitive 생성
- setRoleColor 재호출 시 같은 scale 내 조정이면 primitive id 동일
- setRoleColor 크게 변경 시 pendingPrimitiveDecision 세팅
- resolvePendingPrimitive("adjust") → 기존 primitive의 anchor만 변경
- resolvePendingPrimitive("replace") → 새 primitive 생성, role이 새 것 참조, 기존은 IR에 존재

## Rules

**Do NOT:**
- Primitive를 IR에서 **삭제하지 말 것**. 고아가 되어도 보존. 정리는 사용자 명시적 행동 (Prompt 05의 Atlas에서).
- Anchor 변경 시 자동으로 Adjust vs Replace 결정 내리지 말 것. 반드시 사용자에게 물음.
- Slot state에서 color 설정 시 "Adjust vs Replace" 질문 띄우지 말 것. Role만 물어봄. (Slot/state는 role의 primitive를 따라가는 것이 기본이므로.)
- Layer transition을 복잡하게 만들지 말 것. CSS keyframe 2개면 충분.
- Framer Motion 등 애니메이션 라이브러리 금지.
- Inspector를 dismissable overlay로 만들지 말 것. 단순 fixed 패널로.

**Do:**
- 모든 색 연산은 OKLCH 값 기준. 중간에 hex/rgb로 내려가지 말 것.
- Primitive id는 항상 유니크 보장.
- Store action은 순수 IR transformation 함수를 호출하는 얇은 wrapper.
- Inspector의 color picker는 debounce 없이 즉시 반영 (리얼타임 피드백이 중요).
- 키보드 단축키는 전역이 아니라 각 컴포넌트 스코프에서.

## Deliverables

- [ ] `src/color/primitive-ops.ts` 전체 함수
- [ ] Store의 color setter 완성
- [ ] `Z1Plane.tsx`, `Z2Plane.tsx` 동작
- [ ] `Inspector.tsx` color picker 연결
- [ ] `AdjustOrReplaceDialog.tsx` 모달
- [ ] `BreadcrumbStrip.tsx` + `MiniZ0`, `MiniZ1`
- [ ] Layer transition 애니메이션
- [ ] `tests/primitive-ops.test.ts` 통과
- [ ] E2E 흐름 확인:
  - [ ] Onboarding → Z0 진입
  - [ ] Z0에서 role 카드 클릭 → Inspector 열림
  - [ ] Color picker에서 색 고름 → primitive 자동 생성, role에 assign
  - [ ] Role 카드의 Swatch에 색 나타남
  - [ ] Descend → Z1 진입, 애니메이션 작동
  - [ ] Z1의 slot들이 role 색을 상속받아 Swatch 표시
  - [ ] Slot 카드 클릭 → Inspector 열림 → 색 override 가능
  - [ ] Z2 진입 → state들 각각에 색 지정 가능
  - [ ] Ascend → Z0 복귀, 애니메이션
  - [ ] Breadcrumb 미니어처에 내려온 경로 표시, 클릭 시 점프
  - [ ] 미니어처가 하위 변경을 실시간 반영
  - [ ] Role의 색을 크게 바꾸면 AdjustOrReplace 다이얼로그 뜸
  - [ ] "Replace" 선택 시 새 primitive 생성, IR에 기존 것도 남음

## Out of Scope

- Primitive Atlas view (Prompt 05)
- Export (Prompt 05)
- 자동 Adjust/Replace 판정 (v2 이후)
- 다크모드 (v2 이후)
