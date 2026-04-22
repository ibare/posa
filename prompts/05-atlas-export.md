# Prompt 05 — Primitive Atlas + Export Compilers

## Context

Prompt 04까지 완료하면 핵심 탐색 흐름이 동작. 사용자가 컬러 시스템을 구축할 수 있음. 하지만:

1. **Primitive 공간을 조망할 UI가 없음** — 어떤 primitive가 생겼고, 사용률은 어떤지, 고아는 있는지.
2. **Export가 없음** — 구축한 IR을 실제 코드로 뽑아낼 방법 없음.

이 프롬프트에서 둘을 완성해 MVP를 마감한다. 리포 루트 `README.md` 참고.

## Scope

1. `src/ui/primitives/PrimitiveAtlas.tsx` — 조망 뷰
2. `src/ui/primitives/PrimitiveCard.tsx` — 개별 primitive 표시
3. Atlas 진입 UX (헤더 토글 or 별도 phase)
4. `src/compilers/*` — 3개 export 타겟
5. `src/ui/export/ExportView.tsx` — export 화면
6. 테스트

## 1. PrimitiveAtlas (`src/ui/primitives/PrimitiveAtlas.tsx`)

Atlas는 **읽기 전용 조망 뷰**에 가깝다. 편집 기능은 제한적 (명시적 "정리" 액션만).

### 레이아웃

Atlas 진입 방식: 헤더에 "Atlas" 버튼 추가. 클릭 시 전체 화면을 Atlas로 교체 (exploration 위에 오버레이 혹은 별도 layer).

**상단 요약:**
- "총 ${N}개 primitive, 그 중 ${M}개 사용 중, ${K}개 고아"
- Primitive 간 평균 hue 거리 (대역폭 지표) — "${X}° spread across ${F} hue families"

**본문: 그리드로 각 primitive를 PrimitiveCard로 렌더.**
- Hue family별로 섹션 그룹핑 (green 계열끼리, red 계열끼리)
- 섹션 헤더: "Green (2 variants)"
- 생성 순서대로 정렬 (createdAt)

### `PrimitiveCard.tsx`

각 primitive 하나당 카드:

```
┌────────────────────────────────────────────────┐
│ green-a            [used in 7 slots]           │
│ anchor at shade 500 · oklch(0.58 0.18 145)     │
│                                                │
│ ▮▮▮▮▮▮▮▮▮▮▮  ← 11 shade 스케일 막대          │
│  50 ↑  500 ↑     950                           │
│        anchor                                  │
│                                                │
│ References:                                    │
│   roles: primary, success                      │
│   slots: button.primary.bg (default, hover...) │
│         ↕ expandable list                      │
│                                                │
│ [ Edit anchor ]  [ Merge... ]  [ Remove ]      │
└────────────────────────────────────────────────┘
```

요소:
- **Scale 시각화**: 11개 막대, 각 막대는 해당 shade의 실제 색. Anchor 위치에 작은 마커.
- Hover 시 각 shade의 hex + 사용처 표시.
- **References 목록**: 이 primitive를 참조하는 role / slot / state 의 완전한 목록. Expandable.
- **Edit anchor**: 클릭 시 Inspector에서 anchor 수정. 기존 scale 내 조정 (Replace 옵션 없음 — Atlas는 "정리" 용도이므로 primitive 교체는 탐색 뷰에서).
- **Merge into another**: 이 primitive를 다른 primitive로 병합. 선택 대화:
  - 가능한 target 목록 (다른 primitives)
  - 병합 시 이 primitive를 참조하는 모든 slot/role이 target의 **가장 가까운 shade**로 리매핑
  - 병합 후 이 primitive는 IR에서 제거
- **Remove**: 참조 0 (고아)일 때만 활성. 클릭 시 확인 후 IR에서 제거. (참조가 있으면 disabled, 툴팁으로 "still in use" 표시.)

### 고아 강조

참조 0인 primitive 카드는 시각적으로 흐리게 (opacity 0.5) + 뱃지 "Orphan". 별도 섹션으로 모아도 됨.

### 사용률 시각화 (옵션, MVP 에선 생략 가능)

각 shade별로 몇 번 참조되는지 막대 아래 작은 점들. "500은 많이 쓰이고 50은 0번" 같은 밀도.

## 2. Atlas 진입

### 헤더 버튼

Shell 헤더에 "Atlas" 버튼 추가. exploration phase에서만 활성. 클릭 시:
- exploration view를 hide
- PrimitiveAtlas view를 show
- 상단에 "Back to exploration" 버튼

Atlas와 exploration은 **같은 IR을 공유**. Atlas에서 한 변경이 exploration에 즉시 반영.

## 3. Export Compilers (`src/compilers/`)

모든 컴파일러는 **순수 함수**. IR 입력, 문자열 출력.

### `src/compilers/types.ts`

```typescript
import type { IR } from "../ir/types";

export type CompileResult = {
  filename: string;
  content: string;
  language: "css" | "typescript" | "javascript" | "json";
};

export type Compiler = {
  id: string;
  label: string;
  description: string;
  compile: (ir: IR) => CompileResult;
};
```

### `src/compilers/css-variables.ts`

Tailwind v4 / shadcn 스타일. CSS 파일로 뽑음.

```typescript
export const cssVariablesCompiler: Compiler = {
  id: "css-vars",
  label: "CSS Variables",
  description: "shadcn / Tailwind v4 compatible",
  compile: (ir) => { /* ... */ },
};
```

출력 예:

```css
:root {
  /* Primitive scales */
  --green-a-50:  oklch(0.97 0.05 145);
  --green-a-100: oklch(0.94 0.09 145);
  /* ... */
  --green-a-950: oklch(0.16 0.06 145);

  --neutral-a-50:  oklch(0.97 0 0);
  /* ... */

  /* Semantic roles */
  --primary: var(--green-a-500);
  --primary-foreground: var(--green-a-50);
  --background: var(--neutral-a-50);
  --foreground: var(--neutral-a-900);
  /* ... */

  /* Component slots */
  --button-primary-bg: var(--primary);
  --button-primary-bg-hover: var(--green-a-600);
  --button-primary-fg: var(--primary-foreground);
  /* ... */
}
```

규칙:
- Primitive shade 전부 쓰지 않아도 전부 정의 (고아까지 포함, 단 commented out)
- Role은 primitive CSS var를 참조
- Slot은 role CSS var를 참조 (state가 default일 때) 혹은 primitive를 직접 참조 (state override 있을 때)
- 변수명은 dash 구분 (shadcn 관행)

### `src/compilers/tailwind-config.ts`

Tailwind config 객체의 `colors` 섹션만. JS 파일로.

```typescript
export default {
  extend: {
    colors: {
      "green-a": {
        "50":  "oklch(0.97 0.05 145)",
        "100": "oklch(0.94 0.09 145)",
        // ...
      },
      primary: "var(--primary)",
      // ...
    },
  },
};
```

### `src/compilers/dtcg.ts`

Design Tokens Community Group JSON 포맷.

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format.schema.json",
  "color": {
    "green-a": {
      "500": {
        "$value": "oklch(0.58 0.18 145)",
        "$type": "color"
      }
    },
    "primary": {
      "$value": "{color.green-a.500}",
      "$type": "color"
    }
  }
}
```

## 4. ExportView (`src/ui/export/ExportView.tsx`)

Export 화면 UI.

**접근:** 헤더의 "Export" 버튼 클릭. 혹은 진행도 100%일 때 활성화.

**레이아웃:**
- 좌측: 컴파일러 목록 (CSS Variables / Tailwind Config / DTCG JSON). 탭 혹은 세로 메뉴.
- 우측: 선택된 컴파일러의 출력 미리보기 (syntax-highlighted code block)
- 우측 상단에 "Copy" 버튼 / "Download" 버튼

**Info 영역:**
- "이 export는 현재 IR의 스냅샷입니다"
- 타임스탬프
- 포함된 primitive / role / slot 수

## 5. 기타 자잘한 것

### 진행도 100% 축하 마이크로 모먼트 (optional)

모든 role이 채워지면 잠깐 subtle한 피드백. 과하지 않게. 그냥 progress bar가 100% 되고 Export 버튼이 강조되는 정도.

### 빈 상태

- Atlas에 primitive가 0개일 때: "아직 생성된 primitive가 없습니다. 색을 고르면 여기에 나타납니다."
- Export에서 IR이 비어있을 때: "최소 하나의 role에 색을 할당한 후 export할 수 있습니다."

## 6. Tests (`tests/`)

**`tests/compilers.test.ts`:**
- 빈 IR 입력 시 에러 없이 빈 출력
- 단일 primitive + role + slot 있는 IR → 각 컴파일러의 출력이 예상 형식
- CSS variables 출력이 CSS 문법적으로 유효 (간단한 regex 검증)
- DTCG 출력이 JSON.parse 가능
- Role이 primitive의 특정 shade를 참조할 때 출력에 반영됨
- Slot state override가 있을 때 출력에 반영됨
- Primitive 고아도 출력에 포함됨 (단 주석/플래그 가능)

**`tests/atlas-ops.test.ts`** (Atlas에서 호출하는 로직):
- Primitive remove 시 참조 있으면 거부됨
- Primitive merge 후 대상 primitive의 참조 수가 증가
- Merge 시 shade 리매핑이 가장 가까운 L 값으로

## Rules

**Do NOT:**
- Export에서 `color-mix()` 같은 복잡한 CSS 함수 쓰지 말 것. 단순 `var()` 체인으로.
- DTCG JSON에서 reference syntax (`{color.primary}`)를 쓸 때 존재하지 않는 키 참조 금지.
- Atlas에서 primitive 자동 정리 금지. 사용자가 명시적으로 Remove / Merge.
- Compiler는 상태를 가질 수 없음. 전부 순수 함수.
- 다크모드용 `:root.dark { ... }` 섹션을 지금 추가하지 말 것. v2에서.
- "export as Figma plugin" 같은 복잡한 포맷 지금 추가 금지.

**Do:**
- Code block에 syntax highlighting은 가벼운 것 (prism-react-renderer 등) 또는 그냥 mono 폰트 + preformatted.
- Copy 버튼은 `navigator.clipboard.writeText`로.
- Download는 Blob + URL.createObjectURL.
- Atlas의 scale 시각화는 11개 막대를 CSS grid / flex로.

## Deliverables

- [ ] `src/ui/primitives/PrimitiveAtlas.tsx` + `PrimitiveCard.tsx`
- [ ] Atlas 진입/이탈 (헤더 버튼)
- [ ] `src/compilers/css-variables.ts`
- [ ] `src/compilers/tailwind-config.ts`
- [ ] `src/compilers/dtcg.ts`
- [ ] `src/ui/export/ExportView.tsx`
- [ ] Copy / Download 동작
- [ ] `tests/compilers.test.ts` 통과
- [ ] `tests/atlas-ops.test.ts` 통과
- [ ] E2E 확인:
  - [ ] 탐색 중 Atlas 버튼 → primitive 목록 조망
  - [ ] 각 primitive의 사용처 정확
  - [ ] 고아 primitive 시각적 강조
  - [ ] Atlas에서 Remove / Merge 동작
  - [ ] Export → 3개 타겟 모두 preview
  - [ ] Copy 버튼 동작
  - [ ] Download 시 파일명 합리적 (`posa-tokens.css`, `posa-tailwind.js`, `posa-tokens.json`)

## MVP 완료 체크리스트

이 프롬프트까지 완료되면 Posa MVP가 완성. 아래 전체 흐름이 무리 없이 동작하는지:

1. [ ] 앱 시작 → Onboarding
2. [ ] Preset 선택 또는 개별 체크 → Universe 미리보기
3. [ ] "시작하기" → Z0 탐색 진입
4. [ ] Role 하나 클릭 → Inspector → 색 지정 → primitive 자동 생성
5. [ ] Role 카드 Swatch에 색 반영
6. [ ] Descend → Z1 → Z2 순차 진입, 애니메이션 작동
7. [ ] 여러 role 색 지정 → 다양한 primitive 생성
8. [ ] Role 색을 크게 바꿈 → Adjust/Replace 다이얼로그
9. [ ] Breadcrumb 미니어처 클릭으로 점프 가능
10. [ ] Atlas 열기 → 생성된 모든 primitive 조망, 사용률 확인
11. [ ] 고아 primitive 정리
12. [ ] Export → 3개 포맷 중 하나 복사 또는 다운로드
13. [ ] 다운로드한 CSS를 실제 프로젝트에 붙여 색이 정확히 재현되는지 (외부 검증)

이 13번까지 통과하면 이 도구는 Mintae의 첫 서비스 토큰 구축에 즉시 사용 가능한 상태.

## Out of Scope (v2 이후)

- 다크모드 자동 생성
- 자동 Adjust/Replace 판정
- Figma / iOS / Android 컴파일러
- 팀 협업 / 클라우드 싱크
- 자연어 색 생성
- Component preview (실제 UI 컴포넌트 미리보기)
- Shade 수학 규칙 튜닝 UI
- Typography / Spacing / Motion 토큰으로 확장
