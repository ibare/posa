# Prompt 03 — Store + Onboarding + Z0 Plane

## Context

Prompt 02까지 완료하면:
- IR 타입 (`src/ir/types.ts`)
- 색 수학 (`src/color/*`)
- 카탈로그 데이터 (`src/catalog/*`)

이제 첫 UI를 만든다. **Onboarding (컴포넌트 선택) → Z0 (Role 탐색)** 흐름.

이 프롬프트에서 다루는 핵심 감각 (리포 루트 `README.md` 참고):
- "쓰는 맛" — 단순 동작이 아니라 물리적 감각을 주는 인터랙션
- 순차 커밋 — 한 번에 한 결정
- 완결감 — 진행도가 명확

## Scope

1. `src/store/posa-store.ts` — Zustand store
2. `src/ui/shared/*` — 공통 UI 조각
3. `src/ui/onboarding/*` — 컴포넌트 선택 화면
4. `src/ui/planes/Z0Plane.tsx` — Role 탐색 평면
5. `src/ui/shared/ColorPicker.tsx` — OKLCH 슬라이더 피커
6. `src/App.tsx` — 흐름 라우팅 (phase state 기반)

## 1. Store (`src/store/posa-store.ts`)

Zustand store. IR을 관리하되 **스키마-레벨 데이터(catalog)는 건드리지 않는다**. 사용자의 결정(인스턴스)만.

```typescript
import { create } from "zustand";
import type { IR, OKLCH, RoleId, SlotId, StateId, PrimitiveId, ShadeIndex } from "../ir/types";
import type { Universe } from "../catalog/universe";

type Phase = "onboarding" | "exploration" | "export";

type Layer = "z0" | "z1" | "z2";

type PosaState = {
  // Phase
  phase: Phase;

  // Universe (after onboarding)
  universe: Universe | null;

  // IR — the instance being built
  ir: IR;

  // Navigation state
  layer: Layer;
  selectedRole: RoleId | null;      // Z1을 열 때의 context
  selectedSlot: SlotId | null;      // Z2를 열 때의 context
  focusedNode: string | null;       // 현재 평면에서 focus된 노드의 id

  // Transition direction (for animation)
  lastDirection: "ascend" | "descend" | "neutral";

  // Actions
  startWithComponents: (componentIds: string[]) => void;
  resetAll: () => void;

  // Navigation
  descendTo: (targetId: string) => void;
  ascend: () => void;
  jumpToLayer: (layer: Layer) => void;
  setFocus: (nodeId: string | null) => void;

  // Color setters (Prompt 04에서 확장됨)
  setRoleColor: (roleId: RoleId, color: OKLCH | null) => void;
  // (Slot/state setters는 Prompt 04에서 primitive 로직과 함께)
};

export const usePosaStore = create<PosaState>((set, get) => ({
  phase: "onboarding",
  universe: null,
  ir: emptyIR(),
  layer: "z0",
  selectedRole: null,
  selectedSlot: null,
  focusedNode: null,
  lastDirection: "neutral",

  startWithComponents: (componentIds) => {
    const universe = deriveUniverse(componentIds);
    set({
      universe,
      ir: createInitialIR(universe),
      phase: "exploration",
      layer: "z0",
      selectedRole: null,
      selectedSlot: null,
      focusedNode: null,
    });
  },

  resetAll: () => {
    set({
      phase: "onboarding",
      universe: null,
      ir: emptyIR(),
      layer: "z0",
      selectedRole: null,
      selectedSlot: null,
      focusedNode: null,
      lastDirection: "neutral",
    });
  },

  descendTo: (targetId) => {
    const { layer } = get();
    if (layer === "z0") {
      set({ layer: "z1", selectedRole: targetId, focusedNode: null, lastDirection: "descend" });
    } else if (layer === "z1") {
      set({ layer: "z2", selectedSlot: targetId, focusedNode: null, lastDirection: "descend" });
    }
  },

  ascend: () => {
    const { layer } = get();
    if (layer === "z2") {
      set({ layer: "z1", selectedSlot: null, focusedNode: null, lastDirection: "ascend" });
    } else if (layer === "z1") {
      set({ layer: "z0", selectedRole: null, focusedNode: null, lastDirection: "ascend" });
    }
  },

  jumpToLayer: (targetLayer) => {
    const { layer } = get();
    if (targetLayer === layer) return;
    const direction = layerIndex(targetLayer) < layerIndex(layer) ? "ascend" : "descend";
    const patch: Partial<PosaState> = { layer: targetLayer, focusedNode: null, lastDirection: direction };
    if (targetLayer === "z0") { patch.selectedRole = null; patch.selectedSlot = null; }
    if (targetLayer === "z1") { patch.selectedSlot = null; }
    set(patch);
  },

  setFocus: (nodeId) => set({ focusedNode: nodeId }),

  setRoleColor: (roleId, color) => {
    // Prompt 04에서 primitive 생성 로직과 함께 완성.
    // 지금은 간단히: primitive 없이 role에 직접 색 assign은 못 하므로, 이 함수는
    // "primitive 자동 생성 후 role에 assign"을 Prompt 04에서 구현할 자리를 비워둔다.
    // 이 프롬프트에서는 skeleton만.
    console.warn("setRoleColor implemented in Prompt 04");
  },
}));

function emptyIR(): IR { /* version, timestamps, empty records */ }
function createInitialIR(universe: Universe): IR {
  // meta에 componentTypes 세팅
  // roles/slots/primitives는 비워둠 (사용자가 채울 것)
}
function layerIndex(l: Layer): number { return { z0: 0, z1: 1, z2: 2 }[l]; }
```

**주의:**
- 이 프롬프트에서 `setRoleColor`는 **skeleton만**. 실제 primitive 생성은 Prompt 04.
- Universe는 onboarding 완료 후 한 번 설정되고, exploration 동안 불변. (Universe 확장은 v2 이후.)

## 2. Shared UI (`src/ui/shared/`)

### `Swatch.tsx`
```typescript
type Props = {
  color: OKLCH | null;
  size?: "xs" | "sm" | "md" | "lg";
  dim?: boolean;
};
```
- color가 null이면 dashed border의 빈 사각형.
- color가 있으면 해당 OKLCH를 hex로 변환해 배경으로.
- Gamut 바깥이면 top-right에 작은 경고 뱃지.

### `ColorPicker.tsx`
OKLCH L/C/H 슬라이더. 이전 프로토타입의 `SliderRow` 패턴 참고:

```typescript
type Props = {
  value: OKLCH | null;
  onChange: (color: OKLCH) => void;
  onClear?: () => void;  // "inherit from parent" 옵션용
};
```

- 미리보기 (현재 색 큰 패치)
- L 슬라이더 — 트랙이 현재 C, H 고정 상태에서 L=0→1 그라디언트
- C 슬라이더 — 트랙이 L, H 고정 상태에서 C=0→0.37 그라디언트
- H 슬라이더 — 트랙이 L, C 고정 상태에서 H=0→360 무지개
- 하단에 hex + oklch() 문자열
- onClear가 있으면 "Clear (inherit)" 버튼

### `ProgressBadge.tsx`
`{filled}/{total}` 형식으로 진행도 표시. 작은 숫자 칩.

### `layout/Shell.tsx`
전체 앱 레이아웃. Header + content area.
- Header: "Posa" 로고 + 현재 phase + progress + reset 버튼
- Content area: children (phase에 따라 다른 UI)

## 3. Onboarding (`src/ui/onboarding/`)

### `OnboardingScreen.tsx`

사용자가 컴포넌트 타입을 선택하는 화면. 흐름:

**상단:**
- 타이틀: "무엇을 만드시나요?"
- 부제: "필요한 UI 컴포넌트만 선택하세요. 선택한 것들에서 필요한 색이 자동으로 결정됩니다."

**Preset 바로가기:**
- PRESETS 각각 버튼으로 (Minimal / Todo / Dashboard / Full SaaS)
- 클릭하면 해당 preset의 components가 자동 선택됨 (기존 선택은 대체)

**카테고리별 그리드:**
- 카테고리 헤더 (Interactive / Input / Container / ...)
- 각 ComponentType을 카드로 렌더 — `label`, `description`
- 체크박스 + 선택 시 카드 강조
- `alwaysIncluded: true`인 것은 항상 체크되어 있고 해제 불가능 (disabled 상태로 표시)

**하단 CTA:**
- 선택된 컴포넌트 개수 표시
- "시작하기" 버튼 — 클릭 시 `startWithComponents(selectedIds)` 호출
- 최소 1개 이상 선택해야 활성화 (typography는 자동이므로 실질 기준은 "사용자가 1개라도 선택")

**Preview 영역 (우측 사이드 or 하단):**
- 선택이 바뀔 때마다 `deriveUniverse`로 미리 계산
- "${N}개 role, ${M}개 slot이 탐색 대상이 됩니다" 표시
- 이게 **"아, 이만큼만 정하면 되겠군" 감각**을 미리 주는 지점.

### `ComponentTypeCard.tsx`
위 그리드의 개별 카드 컴포넌트.

## 4. Z0 Plane (`src/ui/planes/`)

### `Z0Plane.tsx`

Universe에 포함된 role만 렌더. Role group별로 섹션 분리 (brand / structural / content / state).

각 role 카드에 포함:
- Swatch (role의 현재 색 — Prompt 04에서 완성. 지금은 모두 비어있음)
- Role id (mono font)
- Description (한국어)
- Slot count 뱃지 (`universe.slots` 중 이 role을 참조하는 것들의 수)
- **Descend 버튼 (우측 끝)** — slot count와 chevron 함께. 이 버튼 클릭 시 `descendTo(roleId)`.
- 카드 몸통 클릭 시 → `setFocus(roleId)`. 우측에 Inspector 슬라이드인 (Prompt 04에서 picker 연결).

### 키보드 지원

- 카드 Tab 네비게이션
- Enter → descend (`descendTo`)
- Space → focus 토글 (Inspector 열기)
- Escape → focus 해제, 이미 해제면 ascend

### Breadcrumb (화면 상단)

Z0에서는 breadcrumb이 "Z0 · root" 텍스트만.
Z1/Z2 진입 후에는 미니어처 평면들이 쌓임 (다음 프롬프트에서 완성).
지금은 Z0 시작 상태만 필요.

## 5. App Routing (`src/App.tsx`)

Phase에 따라 렌더:

```typescript
function App() {
  const phase = usePosaStore((s) => s.phase);

  return (
    <Shell>
      {phase === "onboarding" && <OnboardingScreen />}
      {phase === "exploration" && <ExplorationView />}
      {phase === "export" && <ExportView />}  {/* Prompt 05 */}
    </Shell>
  );
}

function ExplorationView() {
  const layer = usePosaStore((s) => s.layer);
  return (
    <>
      <BreadcrumbStrip />  {/* skeleton */}
      {layer === "z0" && <Z0Plane />}
      {layer === "z1" && <Z1Plane />}  {/* Prompt 04 */}
      {layer === "z2" && <Z2Plane />}  {/* Prompt 04 */}
      <Inspector />  {/* Prompt 04에서 color picker 연결 */}
    </>
  );
}
```

## 6. 시각 디자인 원칙

이전 프로토타입에서 검증된 것들 유지:

**Background:** warm cream (`#faf8f3` 정도). 순백/순흑 금지.
**Typography:**
- Display: Instrument Serif (italic 가능)
- Body: Instrument Sans
- Mono: JetBrains Mono

Google Fonts에서 import. CSS에서 `@import url(...)` 혹은 `<link>` 태그.

**Card design:**
- rounded-lg
- subtle border (stone-200)
- hover 시 border 진해짐 (stone-400)
- focused 시 색 halo (CSS var `--glow`로 선택된 색의 `hex + "55"` alpha)
- **focus glow가 이 도구의 서명** — focused card의 box-shadow에 선택된 컬러의 halo

**Transitions:**
- 카드 hover: 150ms
- Focus: 즉시
- Layer transition: 다음 프롬프트에서 (push/pop)

**Motion:**
- 호버로 `translateY(-1px)` 정도 (pickup 감각)
- 과한 애니메이션 금지. 절제.

## Rules

**Do NOT:**
- Onboarding에서 색 피커 등장 금지. 여기선 컴포넌트 선택만.
- Z0에서 color picker를 permanent panel로 두지 말 것. Focus 시 Inspector로 슬라이드인.
- 라우팅 라이브러리 추가 금지. Phase state로 간단히 분기.
- Heavy animation 라이브러리 (framer-motion 등) 금지. CSS transition으로 충분.
- Inspector를 이번 프롬프트에서 완성시키지 말 것. Skeleton만. Color picker 연결은 Prompt 04.

**Do:**
- 모든 UI는 Universe를 기준으로 렌더. 카탈로그 전체를 렌더하지 말 것.
- Zustand store에서 **선택자로 구독**. 불필요한 리렌더 방지.
- 접근성: tabIndex, aria-label, focus-visible 등 기본.
- 키보드 단축키 힌트는 UI에 작게 노출 (`kbd` 태그).
- 글자 크기는 14-15px 기본, 13px 이하는 캡션용.

## Deliverables

- [ ] `src/store/posa-store.ts` — 위 명세대로 (setRoleColor는 skeleton)
- [ ] `src/ui/shared/Swatch.tsx`
- [ ] `src/ui/shared/ColorPicker.tsx` — 슬라이더 3개 + 미리보기
- [ ] `src/ui/shared/ProgressBadge.tsx`
- [ ] `src/ui/shared/layout/Shell.tsx`
- [ ] `src/ui/onboarding/OnboardingScreen.tsx` — 위 명세
- [ ] `src/ui/onboarding/ComponentTypeCard.tsx`
- [ ] `src/ui/planes/Z0Plane.tsx`
- [ ] `src/App.tsx` — phase 분기
- [ ] 앱 실행 후 흐름 확인:
  - [ ] 앱 시작 시 onboarding 화면
  - [ ] Preset 클릭 시 컴포넌트 일괄 선택
  - [ ] 개별 체크박스로 추가/제거
  - [ ] Typography는 항상 체크됨
  - [ ] "시작하기" → Z0Plane로 진입
  - [ ] Universe에 맞는 role만 표시
  - [ ] 각 role 카드의 slot count가 정확
  - [ ] Descend 버튼이 보이고 눌러도 아직 Z1 없음 (다음 프롬프트) — 일단 `descendTo`가 store를 바꾸고 placeholder Z1Plane이라도 뜨게
  - [ ] Ascend / jump 동작
- [ ] Vitest 기존 테스트 여전히 통과

## Out of Scope

- Z1, Z2 Plane의 완성 (Prompt 04)
- Inspector의 color picker 실제 연결 (Prompt 04)
- Primitive 생성 (Prompt 04)
- Primitive Atlas (Prompt 05)
- Export (Prompt 05)
- Layer transition 애니메이션 (Prompt 04에서 붙일 예정)
- 미니어처 breadcrumb (Prompt 04)

**Placeholder는 OK** — Z1Plane, Z2Plane, Inspector 등을 빈 컴포넌트로 만들어 라우팅만 동작하게.
