# 프롬프트 — Phase 1: IR 재설계 + Shadcn 제거 + Shape Catalog 프로토타입

## 배경

이 도구는 오늘 시작했고 기존 데이터 호환성은 고려 대상이 아니다. 지금까지 발견된 구조적 문제를 한 번에 정리하고 깨끗한 기반 위에서 다시 시작한다.

발견된 문제:
1. **shadcn/ui 의존성이 IR의 semantic 층위까지 침투** — `Button secondary variant`라는 이름이 존재하지만 대응하는 `secondary` role이 IR에 없고, PreviewProvider에 `--secondary: accent` 같은 가짜 CSS 변수 매핑이 존재. 같은 단어가 서로 다른 세 레이어에서 서로 다른 실체를 가리킴.
2. **Role 계층이 시맨틱과 컴포넌트 구조를 뒤섞음** — `primary`와 `card`가 Z0의 같은 평면에 나열되어 "지금 무슨 질문에 답하는지" 모호해짐.
3. **Slot 이름이 컴포넌트 축을 dot-prefix 문자열로 숨김** — `button.primary.bg`에서 `button` 축이 탐색의 독립 층위가 아니라 문자열의 일부. 컴포넌트 단위 작업이 어색함.
4. **"Primary는 색인가 역할인가"에 답할 수 없음** — 외부 디자인 시스템의 관용어를 빌려왔을 뿐, Posa 내부 논리에서 파생된 개념이 아니었음.

이 Phase는 **IR을 처음부터 새로 설계**하고, **Preview 레이어를 Posa 자체 shape 컴포넌트로 대체**하며, **shadcn 및 관련 의존성을 완전히 제거**한다. Phase 1이 완료되면 5개 컴포넌트로 전체 시스템이 동작하며, Phase 2에서 나머지 shape 컴포넌트를 확장할 기반이 마련된다.

## 핵심 설계 원칙

**1. Symbol은 색이다, 역할이 아니다.**
Primary, Secondary, Accent, Success, Info, Warning, Destructive는 독립된 **상징색**이다. 정의하면 primitive가 생성되고, 정의하지 않으면 존재하지 않는다. 사용자는 필요한 만큼만 정의한다.

**2. Attribute는 컴포넌트의 보편적 시각 속성이다.**
background, text, placeholder, border, outline, icon, mark — 7개. 컴포넌트 독립적이며, Z0에 고정 나열된다.

**3. Slot은 컴포넌트 × Attribute이다.**
`button.background`, `input.border` 같은 slot의 id는 항상 base 형태. 사용자가 이 slot에 symbol을 참조시키면 **표시 이름만** `button.background.primary`로 확장된다. Slot 자체는 단일 존재.

**4. 상속은 CSS cascade를 닮았다.**
Z0 attribute 값 = 글로벌 기본값. Slot이 명시 할당되지 않으면 attribute에서 상속. State가 명시 할당되지 않으면 slot default에서 상속.

**5. Preview는 Posa 전용이다.**
일반 UI 라이브러리는 interaction-driven이지만 Posa의 preview는 **모든 상태를 동시에 정적으로 렌더링**한다. 이 차이를 외부 라이브러리로 해결하려면 hack이 필요하므로 표면만 복제한 전용 컴포넌트를 만든다.

## 작업 범위

### 완전히 삭제

**코드:**
- 기존 IR 타입 (Role/Slot 기반)
- 기존 카탈로그 (`src/catalog/roles.ts`, `src/catalog/slots.ts`) 전부
- 기존 Z0/Z1/Z2 탐색 UI — 새 구조로 재작성
- shadcn/ui 복사 컴포넌트 (`src/components/ui/*` 또는 유사 경로)
- PreviewProvider와 그 안의 가짜 CSS 변수 매핑

**패키지 (`package.json`):**
- `@radix-ui/*` 전부
- `class-variance-authority`
- `cmdk`
- `tailwind-merge`

**유지:**
- Tailwind v4
- Zustand
- Vitest
- `lucide-react` (아이콘용, shadcn 의존 아님)
- `clsx` (간단한 className 결합용)
- OKLCH 색 수학 (`src/color/*`) — 건드리지 않음
- Primitive 생성/파생 로직 — 건드리지 않음

### 신규 구현

**IR 레이어** (`src/ir/`)
- 새 IR 타입
- 새 selectors (slot 표시 이름, 상속 resolve 등)

**카탈로그 레이어** (`src/catalog/`)
- Attribute 정의 (7개)
- Symbol 정의 (7개)
- Component 정의 (5개, Phase 2에서 확장)
- 각 component가 지원하는 attribute 매핑

**탐색 UI 레이어** (`src/ui/`)
- Z0: Symbols 섹션 + Attributes 섹션
- Z1: 선택된 attribute를 가진 컴포넌트 slot 목록
- Z2: 선택된 slot의 state 목록
- ColorExplorer는 기존 설계 유지, IR 변경에 맞춰 props만 업데이트

**Preview 레이어** (`src/preview/`)
- PosaPreviewRoot: IR을 CSS 변수로 주입
- 5개 shape 컴포넌트 (Button, Input, Card, Badge, Toast)
- StateGroup 헬퍼

---

## 1. 새 IR 타입

`src/ir/types.ts` 전체를 다음으로 대체:

```typescript
// ===== Color primitives (기존 재사용) =====
export type OKLCH = { L: number; C: number; H: number };
export type ShadeIndex = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export const SHADE_INDICES: ShadeIndex[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export type PrimitiveId = string;  // "green-a", "neutral-a" 등
export type PrimitiveScale = {
  id: PrimitiveId;
  family: string;
  anchor: OKLCH;
  anchorShade: ShadeIndex;
  scale: Record<ShadeIndex, OKLCH>;
  createdAt: number;
};

// ===== Symbols — 상징색 =====
export type SymbolId =
  | "primary" | "secondary" | "accent"
  | "success" | "info" | "warning" | "destructive";

export const SYMBOL_IDS: SymbolId[] = [
  "primary", "secondary", "accent",
  "success", "info", "warning", "destructive"
];

export type SymbolAssignment = {
  primitive: PrimitiveId;
  shade: ShadeIndex;
};

// ===== Attributes — 컴포넌트 보편 속성 =====
export type AttributeId =
  | "background" | "text" | "placeholder"
  | "border" | "outline" | "icon" | "mark";

export const ATTRIBUTE_IDS: AttributeId[] = [
  "background", "text", "placeholder",
  "border", "outline", "icon", "mark"
];

export type ColorRef =
  | { kind: "primitive"; primitive: PrimitiveId; shade: ShadeIndex }
  | { kind: "symbol"; symbol: SymbolId };

export type AttributeAssignment = ColorRef;

// ===== Slots — 컴포넌트의 특정 attribute =====
export type ComponentId = string;  // "button", "input", "card", "badge", "toast"
export type SlotId = string;       // "button.background", "input.text" 등 (base form)

export type StateId = "default" | "hover" | "active" | "disabled" | "focus";

export type SlotAssignment = {
  ref: ColorRef | null;  // null이면 attribute에서 상속
  states: Partial<Record<Exclude<StateId, "default">, ColorRef | null>>;
  // states에 없거나 null이면 default ref에서 상속
};

// ===== 전체 IR =====
export type IR = {
  meta: {
    version: string;
    createdAt: number;
    updatedAt: number;
  };
  primitives: Record<PrimitiveId, PrimitiveScale>;
  symbols: Record<SymbolId, SymbolAssignment | null>;
  attributes: Record<AttributeId, AttributeAssignment | null>;
  slots: Record<SlotId, SlotAssignment>;
};
```

**초기 IR 생성 함수:**

```typescript
export function createEmptyIR(): IR {
  return {
    meta: { version: "1.0", createdAt: Date.now(), updatedAt: Date.now() },
    primitives: {},
    symbols: Object.fromEntries(SYMBOL_IDS.map((s) => [s, null])) as IR["symbols"],
    attributes: Object.fromEntries(ATTRIBUTE_IDS.map((a) => [a, null])) as IR["attributes"],
    slots: {},  // 동적 생성
  };
}
```

---

## 2. 카탈로그

### Attributes (`src/catalog/attributes.ts`)

```typescript
export type AttributeDefinition = {
  id: AttributeId;
  label: string;         // "Background"
  description: string;   // 영어
};

export const ATTRIBUTE_DEFINITIONS: AttributeDefinition[] = [
  { id: "background",  label: "Background",  description: "Fill color behind content" },
  { id: "text",        label: "Text",        description: "Foreground text color" },
  { id: "placeholder", label: "Placeholder", description: "Placeholder text in inputs" },
  { id: "border",      label: "Border",      description: "Edge line color" },
  { id: "outline",     label: "Outline",     description: "Focus ring or outer outline" },
  { id: "icon",        label: "Icon",        description: "Decorative or informational icon color" },
  { id: "mark",        label: "Mark",        description: "State indicators (checks, dots, thumbs)" },
];
```

### Symbols (`src/catalog/symbols.ts`)

```typescript
export type SymbolDefinition = {
  id: SymbolId;
  label: string;         // "Primary"
  description: string;   // 영어, 사용자용 설명
};

export const SYMBOL_DEFINITIONS: SymbolDefinition[] = [
  { id: "primary",     label: "Primary",     description: "Main brand color" },
  { id: "secondary",   label: "Secondary",   description: "Secondary brand color" },
  { id: "accent",      label: "Accent",      description: "Highlight or emphasis color" },
  { id: "success",     label: "Success",     description: "Positive confirmation" },
  { id: "info",        label: "Info",        description: "Neutral information" },
  { id: "warning",     label: "Warning",     description: "Caution or attention" },
  { id: "destructive", label: "Destructive", description: "Danger or error" },
];
```

### Components (`src/catalog/components.ts`)

Phase 1의 5개 컴포넌트만 정의. Phase 2에서 확장.

```typescript
export type ComponentVariant = {
  id: string;  // "primary", "secondary", "default" 등
  label: string;
};

export type ComponentDefinition = {
  id: ComponentId;
  label: string;
  description: string;
  variants?: ComponentVariant[];  // undefined면 variant 없음
  attributes: AttributeId[];      // 이 컴포넌트가 지원하는 attribute
  states: StateId[];              // 이 컴포넌트가 지원하는 state
};

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    id: "button",
    label: "Button",
    description: "Clickable action",
    variants: [
      { id: "primary",     label: "Primary" },
      { id: "secondary",   label: "Secondary" },
      { id: "destructive", label: "Destructive" },
      { id: "outline",     label: "Outline" },
      { id: "ghost",       label: "Ghost" },
    ],
    attributes: ["background", "text", "border", "outline"],
    states: ["default", "hover", "active", "disabled", "focus"],
  },
  {
    id: "input",
    label: "Input",
    description: "Single-line text field",
    attributes: ["background", "text", "placeholder", "border", "outline"],
    states: ["default", "focus", "disabled"],
  },
  {
    id: "card",
    label: "Card",
    description: "Elevated container",
    attributes: ["background", "text", "border"],
    states: ["default"],
  },
  {
    id: "badge",
    label: "Badge",
    description: "Small status indicator",
    variants: [
      { id: "default",     label: "Default" },
      { id: "secondary",   label: "Secondary" },
      { id: "destructive", label: "Destructive" },
      { id: "outline",     label: "Outline" },
    ],
    attributes: ["background", "text", "border"],
    states: ["default"],
  },
  {
    id: "toast",
    label: "Toast",
    description: "Transient notification",
    variants: [
      { id: "default",     label: "Default" },
      { id: "destructive", label: "Destructive" },
      { id: "warning",     label: "Warning" },
      { id: "success",     label: "Success" },
    ],
    attributes: ["background", "text", "border"],
    states: ["default"],
  },
];
```

**Variant가 있는 경우 slot id 생성:**
- Variant 없음: `{componentId}.{attributeId}` (예: `card.background`)
- Variant 있음: `{componentId}.{variantId}.{attributeId}` (예: `button.primary.background`)

Phase 1 범위에서 이 2-depth vs 3-depth 규칙을 정확히 따른다.

---

## 3. Selectors (`src/ir/selectors.ts`)

```typescript
// 모든 slot id를 component catalog에서 생성
export function enumerateAllSlotIds(): SlotId[] {
  const ids: SlotId[] = [];
  for (const comp of COMPONENT_DEFINITIONS) {
    const variants = comp.variants ?? [{ id: "", label: "" }];
    for (const variant of variants) {
      for (const attr of comp.attributes) {
        const base = variant.id
          ? `${comp.id}.${variant.id}.${attr}`
          : `${comp.id}.${attr}`;
        ids.push(base);
      }
    }
  }
  return ids;
}

// Slot의 표시 이름 — symbol 참조 시 ".{symbol}" 접미사
export function getSlotDisplayName(slotId: SlotId, ir: IR): string {
  const slot = ir.slots[slotId];
  if (!slot || !slot.ref || slot.ref.kind !== "symbol") return slotId;
  return `${slotId}.${slot.ref.symbol}`;
}

// Attribute ID로 필터링된 slot 목록 (Z1 표시용)
export function getSlotsByAttribute(attrId: AttributeId): SlotId[] {
  return enumerateAllSlotIds().filter((id) => id.endsWith(`.${attrId}`));
}

// 상속 고려한 최종 색 resolve
export function resolveSlotStateColor(
  ir: IR,
  slotId: SlotId,
  state: StateId = "default"
): OKLCH | null {
  const slot = ir.slots[slotId];
  
  // State가 명시되지 않았거나 default 요청 시
  if (state === "default" || !slot?.states?.[state as Exclude<StateId, "default">]) {
    const ref = slot?.ref ?? null;
    if (ref) return resolveColorRef(ir, ref);
    
    // Slot에 할당 없음 → attribute에서 상속
    const attrId = getAttributeFromSlotId(slotId);
    const attrAssignment = ir.attributes[attrId];
    if (attrAssignment) return resolveColorRef(ir, attrAssignment);
    
    return null;
  }
  
  // State override 있음
  const stateRef = slot.states[state as Exclude<StateId, "default">];
  if (stateRef) return resolveColorRef(ir, stateRef);
  
  // State가 명시됐지만 null → default로 fallback (재귀)
  return resolveSlotStateColor(ir, slotId, "default");
}

function resolveColorRef(ir: IR, ref: ColorRef): OKLCH | null {
  if (ref.kind === "primitive") {
    return ir.primitives[ref.primitive]?.scale[ref.shade] ?? null;
  }
  // Symbol 참조
  const symbolAssignment = ir.symbols[ref.symbol];
  if (!symbolAssignment) return null;
  return ir.primitives[symbolAssignment.primitive]?.scale[symbolAssignment.shade] ?? null;
}

function getAttributeFromSlotId(slotId: SlotId): AttributeId {
  const parts = slotId.split(".");
  return parts[parts.length - 1] as AttributeId;
}

export function resolveSymbolColor(ir: IR, symbolId: SymbolId): OKLCH | null {
  const assignment = ir.symbols[symbolId];
  if (!assignment) return null;
  return ir.primitives[assignment.primitive]?.scale[assignment.shade] ?? null;
}

export function resolveAttributeColor(ir: IR, attrId: AttributeId): OKLCH | null {
  const assignment = ir.attributes[attrId];
  if (!assignment) return null;
  return resolveColorRef(ir, assignment);
}
```

**테스트 필수** (`tests/selectors.test.ts`):
- Slot에 할당 없을 때 attribute에서 상속됨
- Slot에 symbol 참조 할당되면 display name에 `.{symbol}` 접미사
- State override 동작 (hover에 색 있음, 없으면 default)
- Symbol이 null이면 그 symbol 참조하는 slot 색이 null

---

## 4. Store (`src/store/posa-store.ts`)

기존 Store 구조를 유지하되 다음 변경:

```typescript
type Phase = "onboarding" | "exploration" | "export";
type Layer = "z0" | "z1" | "z2";
type Z0Section = "symbols" | "attributes";  // Z0 내부 두 섹션

type PosaState = {
  phase: Phase;
  ir: IR;
  
  // Navigation
  layer: Layer;
  z0Section: Z0Section;                   // Z0에서 어느 섹션을 보는지
  selectedSymbolId: SymbolId | null;      // Z0에서 Symbol focus
  selectedAttributeId: AttributeId | null; // Z1 진입 시 어느 attribute
  selectedSlotId: SlotId | null;           // Z2 진입 시 어느 slot
  focusedNode: string | null;              // 현재 평면에서 focus
  
  // Actions
  startFresh: () => void;
  
  // Symbol 지정
  setSymbol: (symbolId: SymbolId, ref: ColorRef | null) => void;
  
  // Attribute 지정 (Z0 default)
  setAttribute: (attrId: AttributeId, ref: ColorRef | null) => void;
  
  // Slot 지정 (Z1 개별 override)
  setSlot: (slotId: SlotId, ref: ColorRef | null) => void;
  
  // State 지정 (Z2)
  setSlotState: (slotId: SlotId, state: Exclude<StateId, "default">, ref: ColorRef | null) => void;
  
  // Navigation
  selectZ0Section: (section: Z0Section) => void;
  focusSymbol: (symbolId: SymbolId | null) => void;
  descendToAttributeZ1: (attrId: AttributeId) => void;
  descendToSlotZ2: (slotId: SlotId) => void;
  ascend: () => void;
};
```

구현 시 기존 primitive 생성/관리 로직 (`primitive-ops.ts`의 `addPrimitive`, `adjustPrimitiveAnchor` 등)은 **재사용**. 단 이제 "slot에 색을 지정"하는 대신 "slot, attribute, symbol, slot-state 중 하나에 ColorRef를 지정"하는 것이므로, 각 setter가 필요시 primitive 생성 로직을 호출.

Primitive 자동 생성 로직:
- Symbol 지정 시 사용자가 OKLCH 색을 직접 고르면 → 기존 primitive에 없는 색이면 새 primitive 생성 → 그 primitive.shade를 참조하는 SymbolAssignment 설정
- Symbol 지정 시 기존 primitive의 shade를 참조하면 → primitive 생성 없이 바로 할당
- Attribute, Slot, Slot-state도 같은 로직

Primitive 삭제 규칙 (네 기존 원칙):
- Slot/symbol/attribute/state 참조가 제거되는 순간 orphan이 되면 → 그 primitive를 IR에서 제거

---

## 5. UI — 탐색 흐름

### Z0 (`src/ui/planes/Z0Plane.tsx`)

Z0는 두 섹션을 가짐. 토글이 아니라 **둘 다 한 화면에 세로로 나열** (스크롤 가능). 상단에 Symbols, 하단에 Attributes.

```
┌─────────────────────────────────────────┐
│  SYMBOLS                                 │
│  (7개 칩 — 큰 컬러 샘플 + 라벨)         │
│                                          │
│  [■ Primary]     [□ Secondary]           │
│  [□ Accent]      [■ Success]             │
│  [□ Info]        [□ Warning]             │
│  [□ Destructive]                         │
│                                          │
│  □ = 아직 정의 안 됨                     │
│  ■ = 정의됨 (색으로 표시)                │
├─────────────────────────────────────────┤
│  ATTRIBUTES                              │
│  (7개 행)                                │
│                                          │
│  Background     [■ #faf8f3] 4 slots →   │
│  Text           [■ #1a1a1a] 4 slots →   │
│  Placeholder    [□]         1 slot  →   │
│  Border         [■ #e5e5e5] 4 slots →   │
│  Outline        [□]         2 slots →   │
│  Icon           [□]         0 slots →   │
│  Mark           [□]         0 slots →   │
│                                          │
└─────────────────────────────────────────┘
```

**Symbols 섹션:**
- 각 symbol을 컬러 칩으로 렌더 (96×96 정도)
- 미정의 상태: 점선 테두리 + 회색 배경 + 라벨
- 정의됨: 실제 색으로 채워진 배경 + 라벨 (흰 글자 또는 대비 자동)
- 클릭 시 Inspector가 열림 (ColorExplorer) — 기존 Inspector 패턴 그대로
- Symbol은 Descend 개념 없음. Z1으로 안 내려감.

**Attributes 섹션:**
- 각 attribute를 가로 행으로
- 왼쪽: 라벨 + description
- 중앙: 현재 색 swatch (없으면 점선 박스)
- 오른쪽: "{N} slots" 뱃지 (이 attribute를 지원하는 component 수) + Descend 버튼
- 행 클릭 시 Inspector 열림 (색 지정)
- Descend 버튼 클릭 시 Z1으로

### Z1 (`src/ui/planes/Z1Plane.tsx`)

선택된 attribute의 slot 목록:

```
Z1 · ATTRIBUTE · Background
12 slots have this attribute

┌──────────────────────────────────────────┐
│ button.primary.background          [■]   │
│                                 states > │
├──────────────────────────────────────────┤
│ button.secondary.background        [□]   │
│                                 states > │
├──────────────────────────────────────────┤
│ ... (나머지 컴포넌트의 background)       │
└──────────────────────────────────────────┘
```

**Slot 카드 구성:**
- 표시 이름 (symbol 참조 중이면 `.{symbol}` 접미사 포함) — `getSlotDisplayName` 사용
- 현재 색 swatch (상속이면 attribute 색, 직접 할당이면 그 색)
- 상속 vs 직접 할당 표시 — 구현은 "튜닝 영역"으로 미뤄도 됨, 일단 작동하면 됨
- "states >" 버튼이 Z2 진입 — component의 `states`가 1개(`default`)만 있으면 버튼 없음
- 카드 클릭 시 Inspector 열림

**ColorExplorer 연결:**
기존 `ColorExplorer` 재사용. 단 ColorExplorer의 props `assignment`가 이제 `ColorRef | null`을 받도록 조정. Primitive 참조 / Symbol 참조 둘 다 표현 가능해야 함.

**Symbols 참조 UI (ColorExplorer 확장):**
ColorExplorer에 "Use a symbol" 섹션 추가 — 정의된 Symbol 목록을 칩으로 나열. 클릭 시 해당 slot이 그 symbol을 참조하도록 `setSlot` 호출.

```
YOUR PALETTE         (기존)
────────────────
USE A SYMBOL         (신규)
┌──────────────────────────────┐
│  [■ Primary]    [■ Success]   │
│  [■ Destructive]              │
└──────────────────────────────┘
SUGGESTED             (기존)
────────────────
...
```

미정의 Symbol은 이 섹션에 표시하지 않음.

### Z2 (`src/ui/planes/Z2Plane.tsx`)

선택된 slot의 state 목록:

```
Z2 · SLOT · button.primary.background
5 states

┌──────────────────────────────────────┐
│ default    [■]  (assigned)           │
├──────────────────────────────────────┤
│ hover      [■]  (assigned)           │
├──────────────────────────────────────┤
│ active     [ ]  (inherits default)   │
├──────────────────────────────────────┤
│ disabled   [■]  (assigned)           │
├──────────────────────────────────────┤
│ focus      [ ]  (inherits default)   │
└──────────────────────────────────────┘
```

각 state 행:
- 라벨 (default, hover, ...)
- 색 swatch (상속이면 default 색이 희미하게 표시, 직접 할당이면 진하게)
- "assigned" vs "inherits default" 텍스트
- 클릭 시 Inspector

---

## 6. Shape Catalog (`src/preview/`)

### PosaPreviewRoot (`src/preview/PosaPreviewRoot.tsx`)

```typescript
type Props = {
  ir: IR;
  children: React.ReactNode;
};

export function PosaPreviewRoot({ ir, children }: Props) {
  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {};
    
    for (const slotId of enumerateAllSlotIds()) {
      const slot = ir.slots[slotId];
      const component = findComponentBySlotId(slotId);
      if (!component) continue;
      
      for (const state of component.states) {
        const color = resolveSlotStateColor(ir, slotId, state);
        if (color) {
          const varName = slotVarName(slotId, state);
          vars[`--${varName}`] = oklchToCssString(color);
        }
      }
    }
    
    return vars;
  }, [ir]);

  return <div style={cssVars as React.CSSProperties}>{children}</div>;
}
```

### slotVarName (`src/preview/slotVarName.ts`)

```typescript
export function slotVarName(slotId: SlotId, state: StateId): string {
  const base = `posa-slot-${slotId.replace(/\./g, "-")}`;
  return state === "default" ? base : `${base}-${state}`;
}
```

예:
- `button.primary.background` default → `posa-slot-button-primary-background`
- `button.primary.background` hover → `posa-slot-button-primary-background-hover`
- `input.text` focus → `posa-slot-input-text-focus`

### StateGroup (`src/preview/StateGroup.tsx`)

```typescript
type Props = {
  label: string;          // "PRIMARY"
  states: StateId[];
  children: (state: StateId) => React.ReactNode;
};

export function StateGroup({ label, states, children }: Props) {
  return (
    <div className="flex flex-wrap gap-6 items-start">
      {states.map((state) => (
        <div key={state} className="flex flex-col items-start gap-2">
          {children(state)}
          <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
            {label} · {state}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Shape 컴포넌트 설계 원칙

- 순수 함수 컴포넌트, 상태 없음
- onClick, onFocus, onChange 금지
- aria-* 속성 금지
- `<button>`, `<input>` 금지 — `<div>` 사용
- Tailwind `hover:` modifier 금지 — state는 props로 명시 전달
- CSS transition 금지 — 정확한 끝점 색을 보여야 함
- 외형값은 shadcn을 관찰 복제 (라이브러리 import 아님)

### ButtonShape (`src/preview/shapes/ButtonShape.tsx`)

```typescript
type Variant = "primary" | "secondary" | "destructive" | "outline" | "ghost";

type Props = {
  variant: Variant;
  state?: StateId;
  label?: string;
};

export function ButtonShape({ variant, state = "default", label = "Button" }: Props) {
  const baseClass = "px-4 py-2 rounded-md text-sm font-medium inline-flex items-center justify-center h-9";
  
  const bgVar = `--posa-slot-button-${variant}-background${state === "default" ? "" : `-${state}`}`;
  const textVar = `--posa-slot-button-${variant}-text${state === "default" ? "" : `-${state}`}`;
  const borderVar = `--posa-slot-button-${variant}-border${state === "default" ? "" : `-${state}`}`;
  
  const style: React.CSSProperties = {
    backgroundColor: variant === "outline" || variant === "ghost" ? "transparent" : `var(${bgVar})`,
    color: `var(${textVar})`,
    border: variant === "outline" ? `1px solid var(${borderVar})` : "none",
  };
  
  return (
    <div
      className={baseClass}
      style={style}
      data-posa-slot={`button.${variant}.background`}
      data-posa-state={state}
    >
      {label}
    </div>
  );
}
```

5개 variant × 해당 states를 `StateGroup`으로 렌더. 외형값 기준 (shadcn 관찰):
- Height: 36px
- Padding: px-4 py-2
- Radius: rounded-md (6px)
- Font: 14px medium

### InputShape (`src/preview/shapes/InputShape.tsx`)

```typescript
type Props = {
  state?: StateId;
  placeholder?: string;
  value?: string;
};

export function InputShape({ state = "default", placeholder = "Enter text...", value }: Props) {
  // ...
}
```

Slot 구성:
- `input.background`, `input.text`, `input.placeholder`, `input.border`, `input.outline`

외형값:
- Height: 36px
- Padding: px-3 py-2
- Radius: rounded-md
- Border: 1px solid

렌더: `<div>` 안에 text (value가 있으면 `--input-text`, 없으면 `--input-placeholder` 색).

### CardShape (`src/preview/shapes/CardShape.tsx`)

Slot: `card.background`, `card.text`, `card.border`

외형값: p-6, rounded-lg, border 1px, shadow-sm

렌더: 제목 + 본문 텍스트 placeholder.

### BadgeShape (`src/preview/shapes/BadgeShape.tsx`)

Variant × slot:
- default: `badge.default.background`, `badge.default.text`
- secondary: `badge.secondary.background`, `badge.secondary.text`
- destructive: `badge.destructive.background`, `badge.destructive.text`
- outline: transparent bg, `badge.outline.text`, `badge.outline.border`

외형값: px-2.5 py-0.5, rounded-full, font 12px semibold, height ~22px

### ToastShape (`src/preview/shapes/ToastShape.tsx`)

Variant × slot:
- default: `toast.default.background`, `toast.default.text`, `toast.default.border`
- destructive, warning, success 마찬가지

외형값: p-4, rounded-md, border 1px, width ~320px

렌더: title + description 두 줄 placeholder.

### Preview 통합

Z2 평면 또는 별도 preview 영역에서 shape 컴포넌트들이 `PosaPreviewRoot` 안에 렌더되어 실시간 색 반영.

```tsx
<PosaPreviewRoot ir={ir}>
  <StateGroup label="PRIMARY" states={["default", "hover", "active", "disabled"]}>
    {(state) => <ButtonShape variant="primary" state={state} />}
  </StateGroup>
  <StateGroup label="SECONDARY" states={["default", "hover", "active", "disabled"]}>
    {(state) => <ButtonShape variant="secondary" state={state} />}
  </StateGroup>
  {/* ... 다른 variant */}
</PosaPreviewRoot>
```

---

## 7. 테스트

**`tests/selectors.test.ts`:**
- `resolveSlotStateColor` — 상속 체인 정확
- `getSlotDisplayName` — symbol 참조 시 접미사, 아니면 base
- `enumerateAllSlotIds` — 5개 컴포넌트의 모든 slot 생성 (variant 고려)
- `resolveSymbolColor` — symbol null이면 null, 있으면 primitive → scale → 색

**`tests/ir-integration.test.ts`:**
- Symbol 지정 → 해당 symbol 참조하는 slot들 색 나타남
- Symbol 해제 → 해당 symbol 참조하던 slot들 색 null
- Attribute 지정 → slot이 아직 할당 안 된 경우 상속
- Slot 개별 할당 → attribute 상속 대체

**기존 테스트:**
- OKLCH, primitive 관련 테스트는 전부 유지 통과

---

## Rules

**Do NOT:**
- 기존 Role/Slot 구조를 남겨두거나 호환 레이어를 두지 말 것. 깨끗하게 삭제.
- shadcn 관련 파일/패키지를 부분적으로 남기지 말 것. 언급된 것은 전부 제거.
- Preview에서 `<button>`, `<input>` 같은 interactive element 사용 금지. `<div>`로.
- Shape 컴포넌트에 onClick, onFocus, onChange, aria-* 추가 금지.
- Shape 컴포넌트에 state (useState 등) 사용 금지.
- Tailwind `hover:` modifier 사용 금지.
- CSS transition 추가 금지.
- Framer Motion, react-spring 등 애니메이션 라이브러리 추가 금지.
- Symbol을 미리 정의된 색으로 초기화하지 말 것. 전부 null로 시작.
- Attribute도 기본값 할당하지 말 것. 전부 null로 시작.
- Primitive를 사용자 지정 없이 자동 생성하지 말 것.
- 기존 IR의 "role" 개념 흔적을 남기지 말 것 — role 변수명, role 타입, role catalog 등.

**Do:**
- 모든 UI 문자열은 영어. 이 프롬프트는 한글이지만 구현물의 표시 문자열은 영어.
- 카탈로그 (attributes, symbols, components)는 정적 데이터. 런타임 생성 금지.
- Slot id는 enumerate 함수로 카탈로그에서 파생. 하드코딩하지 말 것.
- 상속 로직은 `resolveSlotStateColor`에 집중. UI에서 상속 수동 구현 금지.
- Shape 외형값은 shadcn의 공개 CSS를 관찰해서 복제. 근사치 OK, 완벽 일치 불필요.
- 5개 shape 컴포넌트 각각 50–100줄 이하.

---

## 검증 흐름

1. **기존 구조 삭제 확인**
   - [ ] `src/catalog/roles.ts`, `src/catalog/slots.ts` (또는 기존 이름) 제거됨
   - [ ] `src/ir/types.ts`에 `RoleId`, `RoleAssignment`, `SlotAssignment`(기존) 없음
   - [ ] `src/components/ui/*` (또는 shadcn 복사본 경로) 삭제됨
   - [ ] `package.json`에 `@radix-ui/*`, `class-variance-authority`, `cmdk`, `tailwind-merge` 없음
   - [ ] `PreviewProvider`의 가짜 매핑 (`--secondary: accent` 류) 삭제됨

2. **새 구조 확인**
   - [ ] `createEmptyIR()` 호출 시 7개 symbol 전부 null, 7개 attribute 전부 null
   - [ ] `enumerateAllSlotIds()` 호출 시 5개 component의 모든 slot 생성 (Button은 5 variant × 4 attribute = 20 slot 등)

3. **Z0 흐름**
   - [ ] Z0 진입 시 Symbols 섹션 (7개 미정의 칩) + Attributes 섹션 (7개 미정의 행) 나타남
   - [ ] Symbol 하나 클릭 → Inspector 열림 → 색 지정 → 해당 칩에 색 반영
   - [ ] Attribute 행 클릭 → Inspector 열림 → 색 지정 → swatch 반영

4. **Z1 흐름**
   - [ ] Attribute 행의 "Descend" 클릭 → Z1 진입
   - [ ] 해당 attribute를 가진 모든 컴포넌트 slot 목록 나타남
   - [ ] Attribute가 지정되어 있으면 모든 slot 카드 swatch에 attribute 색 상속
   - [ ] Slot 카드 클릭 → Inspector → ColorExplorer에 "Use a symbol" 섹션 존재
   - [ ] Symbol 칩 클릭 → 해당 slot이 symbol 참조 → slot 카드 이름이 `.{symbol}` 접미사 붙음
   - [ ] 같은 이름의 다른 symbol이 없는 컴포넌트의 해당 variant (예: `.secondary`) 표시는 나타나지 않음 — 그 symbol이 아직 정의되지 않았을 때
   - [ ] Symbol이 새로 정의되면 해당 symbol 참조하는 slot들이 색 반영됨

5. **Z2 흐름**
   - [ ] Slot 카드의 "states" 버튼 → Z2 진입
   - [ ] State 목록 (해당 컴포넌트의 `states` 기반)
   - [ ] State 클릭 → Inspector → 색 지정
   - [ ] State에 색 없으면 default에서 상속 표시

6. **Preview 통합**
   - [ ] `PosaPreviewRoot` 내부에 shape 컴포넌트들 렌더
   - [ ] Z0/Z1/Z2에서 색 변경 시 preview의 해당 slot 즉시 업데이트
   - [ ] 5개 shape 컴포넌트가 모든 state를 동시 렌더 (interaction 없이)
   - [ ] grep으로 `onClick`, `onFocus`, `hover:` Shape 코드에 없음 확인

7. **UI 언어**
   - [ ] 모든 표시 문자열 영어
   - [ ] 한글 스트링 없음

---

## Deliverables

**타입 & 카탈로그:**
- [ ] `src/ir/types.ts` — 새 IR 타입 전부
- [ ] `src/ir/selectors.ts` — resolve 함수들
- [ ] `src/catalog/attributes.ts`
- [ ] `src/catalog/symbols.ts`
- [ ] `src/catalog/components.ts` — 5개 컴포넌트

**Store:**
- [ ] `src/store/posa-store.ts` — 새 액션 구조

**UI:**
- [ ] `src/ui/planes/Z0Plane.tsx` — Symbols + Attributes 두 섹션
- [ ] `src/ui/planes/Z1Plane.tsx` — attribute 기반 slot 목록
- [ ] `src/ui/planes/Z2Plane.tsx` — state 목록
- [ ] ColorExplorer 확장 — "Use a symbol" 섹션

**Preview:**
- [ ] `src/preview/PosaPreviewRoot.tsx`
- [ ] `src/preview/slotVarName.ts`
- [ ] `src/preview/StateGroup.tsx`
- [ ] `src/preview/shapes/ButtonShape.tsx`
- [ ] `src/preview/shapes/InputShape.tsx`
- [ ] `src/preview/shapes/CardShape.tsx`
- [ ] `src/preview/shapes/BadgeShape.tsx`
- [ ] `src/preview/shapes/ToastShape.tsx`
- [ ] `src/preview/shapes/index.ts`

**삭제:**
- [ ] 기존 role/slot 카탈로그
- [ ] shadcn 복사본
- [ ] PreviewProvider 가짜 매핑
- [ ] 관련 package.json 종속성

**테스트:**
- [ ] `tests/selectors.test.ts`
- [ ] `tests/ir-integration.test.ts`
- [ ] 기존 OKLCH/primitive 테스트 통과

---

## Out of Scope (Phase 2에서)

- 나머지 ~45개 컴포넌트 shape 구현
- Export 컴파일러 재작성 (현 compiler는 새 IR에 맞춰 최소 수정만, 본격 재설계는 Phase 2)
- `data-posa-slot` attribute를 이용한 slot-level visualization (Inspector에서 현재 focus된 slot을 preview에서 하이라이트)
- Onboarding 흐름 (컴포넌트 선택 → universe 생성) — 현재는 5개 컴포넌트 전부 활성화된 상태로 시작
- Primitive Atlas 재연결 — 새 IR에 맞춰 최소한만 작동, Phase 2에서 정비

Phase 1의 유일한 목적: **깨끗한 새 IR 위에 shadcn 없이 작동하는 5개 컴포넌트 시스템을 세우는 것**. 확장은 Phase 2.
