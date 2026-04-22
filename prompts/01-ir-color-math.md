# Prompt 01 — IR Schema + Color Math

## Context

Prompt 00에서 리포 뼈대 완성. 이제 **도구의 로직 코어**를 만든다.

Posa의 설계 철학 (리포 루트 `README.md` 참고):
- IR (Internal Representation)은 색 공간과 참조 관계만 담고, 표현 방식에 중립적이다.
- 모든 색 값은 OKLCH로 저장. sRGB/hex는 렌더링 시점에 변환.
- Primitive는 사용자 선택의 부산물. Anchor 하나에서 11단 scale이 자동 파생.
- Slot이 role을 참조하고, role이 primitive의 특정 shade를 참조한다.

이 프롬프트에서는 UI 없음. **순수 로직 + 타입 + 테스트**.

## Scope

1. `src/ir/types.ts` — IR 스키마 TypeScript 타입
2. `src/color/oklch.ts` — OKLCH ↔ sRGB 변환
3. `src/color/primitive.ts` — Anchor에서 11단 primitive scale 파생
4. `src/color/resolve.ts` — Slot/role에서 실제 색 값 계산
5. 위 3개 모듈에 대한 Vitest 테스트

## 1. IR Schema (`src/ir/types.ts`)

다음 타입을 export 한다:

```typescript
// ----- Color primitives -----
export type OKLCH = {
  L: number;  // 0..1
  C: number;  // 0..0.4 정도 (gamut에 따라 다름)
  H: number;  // 0..360
};

export type ShadeIndex = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export const SHADE_INDICES: ShadeIndex[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// ----- Primitive scale (emergent) -----
export type PrimitiveId = string;  // e.g. "green-a", "neutral-a"

export type PrimitiveScale = {
  id: PrimitiveId;
  anchor: OKLCH;
  anchorShade: ShadeIndex;       // anchor가 11단 중 몇 번에 해당하는가
  scale: Record<ShadeIndex, OKLCH>;
  createdAt: number;             // unix ms, 생성 순서 추적용
};

// ----- Semantic role -----
export type RoleId = string;  // "primary", "surface", "text", "destructive", ...

export type RoleAssignment = {
  primitive: PrimitiveId;
  shade: ShadeIndex;
};

// ----- Component slot -----
export type SlotId = string;  // "button.primary.bg", "input.border", ...
export type StateId = string; // "default", "hover", "active", "disabled", "focus"

export type SlotAssignment = {
  // Default reference: slot이 참조하는 role
  role: RoleId;
  // State마다 다른 색을 쓸 수 있음. 없으면 role의 default 색을 씀.
  states: Partial<Record<StateId, RoleAssignment>>;
};

// ----- Full IR -----
export type IR = {
  meta: {
    version: string;          // "1.0"
    createdAt: number;
    updatedAt: number;
    componentTypes: string[]; // 이 인스턴스의 universe 구성 요소
  };
  primitives: Record<PrimitiveId, PrimitiveScale>;
  roles: Record<RoleId, RoleAssignment>;
  slots: Record<SlotId, SlotAssignment>;
};
```

**Notes:**
- `SlotAssignment.states`의 value가 `RoleAssignment`인 것은 의도적. 각 state도 결국 "어느 primitive의 어느 shade"를 참조하는 구조.
- `role`을 default로 두고 `states`가 필요시에만 override하는 이유: 대부분의 slot은 state가 1개 (default만) 이므로 그 경우 `states`는 비어있고 role에서 상속.
- `PrimitiveId`는 `"{hue-family}-{letter}"` 형식 권장 (예: "green-a", "green-b", "neutral-a"). 생성 시 유니크 보장.

## 2. OKLCH ↔ sRGB (`src/color/oklch.ts`)

Björn Ottosson의 매트릭스 사용. 참고 이전 프로토타입에 이미 구현된 로직을 재사용.

Export:

```typescript
export function oklchToLinearRgb(L: number, C: number, H: number): [number, number, number];
export function oklchToHex(L: number, C: number, H: number): string;          // "#ff0003"
export function oklchToRgbString(L: number, C: number, H: number): string;    // "rgb(255, 0, 3)"
export function oklchToCssString({ L, C, H }: OKLCH): string;                 // "oklch(0.628 0.258 29)"
export function isInSrgbGamut(L: number, C: number, H: number): boolean;      // gamut 안인지
```

**Notes:**
- `oklchToHex`는 gamut을 벗어난 값도 clamp해서 반환 (화면에 뭔가 보여야 하니까).
- `isInSrgbGamut`은 별도 반환. UI에서 경고 뱃지 표시용.
- 변환 전후 정밀도 테스트: white/black/red/green/blue 기준값과 비교.

## 3. Primitive Scale 파생 (`src/color/primitive.ts`)

Anchor 하나와 anchorShade가 주어지면 11단 scale을 자동 파생.

Export:

```typescript
export function deriveScale(anchor: OKLCH, anchorShade: ShadeIndex): Record<ShadeIndex, OKLCH>;
export function createPrimitive(
  id: PrimitiveId,
  anchor: OKLCH,
  anchorShade: ShadeIndex
): PrimitiveScale;
```

**파생 규칙 (MVP 기본값):**

OKLCH의 L 축으로 단계 간격을 둔다. Tailwind와 비슷한 분포:

| Shade | Target L |
|-------|----------|
| 50    | 0.97     |
| 100   | 0.94     |
| 200   | 0.87     |
| 300   | 0.78     |
| 400   | 0.68     |
| 500   | 0.58     |
| 600   | 0.48     |
| 700   | 0.40     |
| 800   | 0.32     |
| 900   | 0.24     |
| 950   | 0.16     |

**Chroma (C) 처리:**
- Anchor의 C를 그대로 중간 단계(500 근처)에 유지.
- 양끝(50, 950)으로 갈수록 C를 감쇠. 선형으로: `C_at_shade = anchor.C * chromaMultiplier(shade)`
- `chromaMultiplier`: 50→0.3, 100→0.5, 200→0.7, 300→0.85, 400→0.95, 500→1.0, 600→1.0, 700→0.9, 800→0.75, 900→0.55, 950→0.35
- Neutral (C < 0.02) 계열은 C 변화 없음 (그대로 0에 가까움).

**Hue (H):**
- 모든 shade에서 동일하게 유지.

**Anchor 위치 보정:**
- 사용자가 anchor를 500에 찍었고 실제 L=0.58이면 그대로 500에 배치.
- 사용자가 anchor를 500에 찍었는데 실제 L=0.72이면? → **anchor의 L을 존중**해서 해당 shade의 기본 target L을 덮어쓴다. 즉 anchor는 무조건 `scale[anchorShade]`에 정확히 들어가고, 나머지 shade들은 target L 표에 따라 계산하되 **anchor shade 근처 몇 단계는 자연스러운 보간**으로 이어지게 한다.
- 구현 권장: anchor shade 전후 1-2 단계는 anchor.L에서 target L로 선형 블렌드. 먼 단계는 target L 그대로.

## 4. Resolve (`src/color/resolve.ts`)

IR에서 slot + state를 받아 실제 OKLCH를 계산.

Export:

```typescript
export function resolveSlotColor(ir: IR, slotId: SlotId, state?: StateId): OKLCH | null;
export function resolveRoleColor(ir: IR, roleId: RoleId): OKLCH | null;
```

**Resolve 로직 (slot):**
1. `ir.slots[slotId]`가 없으면 null.
2. `state`가 지정되고 `slots[slotId].states[state]`가 있으면 그 값의 primitive/shade로 조회.
3. 아니면 `slots[slotId].role`의 RoleAssignment로 조회 = `resolveRoleColor(ir, role)`.
4. 그 role의 primitive가 없거나 scale에 해당 shade가 없으면 null.

**Resolve 로직 (role):**
1. `ir.roles[roleId]`가 없으면 null.
2. `ir.primitives[assignment.primitive].scale[assignment.shade]`를 반환.

## 5. Tests (`tests/`)

**`tests/oklch.test.ts`:**
- 블랙, 화이트, 순수 R/G/B primaries가 hex로 변환되는 값이 정확한지 (소수점 오차 허용).
- Gamut 바깥 값이 clamp되는지.
- CSS 문자열 포맷이 정확한지.

**`tests/primitive.test.ts`:**
- `deriveScale`이 11개 shade 모두 반환.
- Anchor가 정확히 anchorShade 위치에 들어감.
- Neutral color의 scale 전체가 C=0 유지.
- Colorful color의 중간 shade가 가장 C가 높고 양끝이 낮음.

**`tests/resolve.test.ts`:**
- 간단한 IR을 만들어 slot → role → primitive → scale 체인이 올바르게 풀리는지.
- State override가 있을 때와 없을 때의 동작.
- 존재하지 않는 slot/role은 null.

## Rules

**Do NOT:**
- 외부 컬러 라이브러리 (`culori`, `chroma-js`, `color`) 금지. 전부 직접 구현.
- Primitive scale 파생에서 OKLCH 외 다른 색 공간으로 우회 금지.
- IR 타입에 UI 관련 필드 (expanded, selected, focused 등) 넣지 말 것. 순수 데이터.
- Zustand store 지금 만들지 말 것. 타입만 정의. Store는 Prompt 03에서.
- Resolve 함수가 primitive를 생성하거나 수정하지 말 것. 읽기 전용.

**Do:**
- `any` 금지. TypeScript strict.
- 모든 export 함수에 JSDoc 한 줄 이상.
- 테스트는 describe/it 블록으로 정리.
- 파일당 역할 명확. 한 파일에 관련 없는 함수 섞지 말 것.

## Deliverables

- [ ] `src/ir/types.ts` 위 명세대로
- [ ] `src/color/oklch.ts` 4개 함수 + gamut 체크
- [ ] `src/color/primitive.ts` `deriveScale` + `createPrimitive`
- [ ] `src/color/resolve.ts` `resolveSlotColor` + `resolveRoleColor`
- [ ] `tests/oklch.test.ts` 통과
- [ ] `tests/primitive.test.ts` 통과
- [ ] `tests/resolve.test.ts` 통과
- [ ] `pnpm test` 전부 초록

## Out of Scope

- 컴포넌트 카탈로그 (Prompt 02)
- Universe 파생 (Prompt 02)
- Store / UI (Prompt 03+)
- Export 컴파일러 (Prompt 05)
- Anchor 수정 시 "Adjust vs Replace" 판정 로직 (Prompt 04)
