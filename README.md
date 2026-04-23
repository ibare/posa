# Posa

> Color system as sediment — what settles when decisions accumulate.

## 출발

대부분의 팔레트 도구가 푸는 문제는 "어울리는 색 5개를 뽑아주는 것"이다. 5개, 많아야 8개. 실무에서 쓰는 디자인 시스템은 20–50개, 큰 SaaS는 수백 개의 색 토큰을 가진다. 이 간극을 메우는 도구가 시장에 없다.

이 도구를 만드는 이유는 단순하다. **내가 필요해서다.** 서비스를 만들 때 컬러 감각이 기가 막힌 디자이너가 수십 종의 어울리는 컬러셋을 뽑아내는 걸 보며, "저건 감각일까, 아니면 이론일까"라는 질문에서 시작했다. 음악에 화성학이 있듯 색에도 구조가 있고, 그 구조가 있다면 도구로 풀 수 있을 거라는 가설이다.

다만 이 도구는 제품으로 경쟁하려는 게 아니다. 내가 매번 새 서비스를 시작할 때마다 색 결정을 반복하며 겪는 피로 — "5개 골라놓았더니 1-2개 맘에 안 들어서 바꾸면 전체 밸런스가 깨진다", "6번째 7번째 색을 추가하는 순간 문제가 터진다" — 를 해소하기 위한 도구다.

## 핵심 관찰

이 도구가 존재하려면 세 가지 조건이 동시에 성립해야 한다:

1. **단일 도메인** — 컬러 하나만 다룬다.
2. **유한 스키마** — 실무에서 쓰이는 토큰 집합은 사실상 정해져 있다. 마스터 그래프가 선험적으로 존재 가능하다.
3. **명확한 완료 조건** — 모든 슬롯이 채워지면 끝이다.

## 설계 철학 — Emergent over Declared

업계 관행은 위에서 아래로 설계하는 방식이다. Primitive scale(brand-50 ~ brand-950)을 먼저 만들고, 그 위에 semantic(primary, surface)을 얹고, 그 위에 component token(button.primary.bg)을 얹는다.

Posa는 이 방향을 뒤집는다. 사용자는 상위 의미 축에서 구체적 결정을 내리고, **primitive는 그 결정의 부산물로 나타난다**. Primitive는 설계 대상이 아니라 사용자의 선택 행적이 쌓여서 생기는 자취다.

이 원칙은 세 축에서 반복된다:

- **Universe emerges from component selection** — 사용자가 선택한 UI 컴포넌트 타입의 합집합이 이 인스턴스의 탐색 범위가 된다.
- **Primitive emerges from color decisions** — 사용자가 특정 색을 고르면 OKLCH 기반으로 11단 primitive scale이 자동 파생된다. 사용자는 primitive를 직접 다루지 않는다.
- **Projection emerges from selection path** — 상위 층에서 무엇을 선택하고 내려왔는지에 따라 하위 층의 가시 범위가 결정된다.

## IR — 4축 데이터 모델

`src/ir/types.ts`의 `IR` 타입이 이 도구의 유일한 진실 원천이다. UI 상태(선택/포커스)는 여기 들어가지 않는다. IR은 네 개 축으로 구성된다:

1. **primitives** — OKLCH anchor와 11단 scale(`50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`). 사용자 결정의 침전물.
2. **symbols** — 상징색 7종. `primary`, `secondary`, `accent`, `success`, `info`, `warning`, `error`. 컴포넌트 variant id가 이 값과 일치하면 symbol 축과 결합된다.
3. **attributes** — 컴포넌트 보편 속성 12종. `background`, `text`, `placeholder`, `border`, `outline`, `icon`, `mark`, `overlay`, `track`, `fill`, `thumb`, `muted`. Z0에서 지정한 값이 전역 기본이 된다.
4. **slots** — `{componentId}.{attributeId}` 또는 variant 있는 경우 `{componentId}.{variantId}.{attributeId}`. 기본 ref와 state별 override(`default`, `hover`, `active`, `disabled`, `focus`, `checked`)를 가진다.

> Role 개념은 없다. "Primary는 색이냐 역할이냐"에 답할 수 없어 제거했다. 대신 symbols(상징색)와 attributes(보편 속성)를 같은 Z0 층에서 나란히 다룬다.

## 탐색 계층 — Z0 / Z1 / Z2 + ZX 오버레이

`Layer` 타입은 `z0 | z1 | z2` 세 값이다. 여기에 **컴포넌트 단위 ZX 오버레이 모드**가 직교로 얹힌다 (`selectedComponentId` 또는 `selectedGroupId` 기반).

### 세 층

- **Z0** — Symbol 섹션(7개 상징색 칩) + Attribute 섹션(12개 보편 속성 목록). `slots` 버튼으로 특정 attribute의 Z1로 descend.
- **Z1** — 선택된 attribute를 참조하는 모든 slot을 한 화면에 띄운다. 예: `border`를 descend하면 모든 컴포넌트·variant의 `.border` slot들이 카드 격자로 펼쳐진다.
- **Z2** — 선택된 slot의 state별(`default`/`hover`/`active`/...) override. 상속 여부가 명시된다.

### ZX 오버레이

프리뷰에서 컴포넌트(또는 그룹)를 선택하면 Z0/Z1 위에 오버레이가 얹혀 그 컴포넌트의 variant × attribute 슬롯 그리드만 보여준다. Z2 descend 중에는 오버레이가 비활성화된다. ESC로 한 단계씩 벗겨낸다 — 단일 ZX → 그룹 ZX → 기본.

### 투영

Z1, Z2는 **고정된 내용을 갖지 않는다**. 위층에서 무엇을 선택하고 내려왔느냐가 아래층의 내용을 결정한다. 사용자는 항상 현재 맥락에서 필요한 만큼의 결정 공간만 본다.

### 살아있는 Breadcrumb

`BreadcrumbStrip`은 지금까지 내려온 경로를 **축소된 미니어처 평면**으로 쌓아 보여준다. Z1이면 `MiniZ0`, Z2면 `MiniZ0 → MiniZ1`. 아래층에서 색을 바꾸면 상단 미니어처가 실시간으로 갱신된다. 미니어처 클릭 시 해당 층으로 점프.

### 층 전환

Descend 시 확대 + blur 감소, ascend 시 축소 + blur 증가 (`plane-descend` / `plane-ascend` 애니메이션). 280–320ms의 짧은 전환이지만 "깊이를 오르락내리락한다"는 감각을 만든다.

## 카탈로그와 스코프

`src/catalog/components.ts`에 **54개 컴포넌트**가 **12개 그룹**(`action`, `input`, `form-control`, `range`, `overlay`, `menu`, `navigation`, `container`, `feedback`, `display`, `data`, `typography`)으로 묶여 있다. shadcn/ui 레퍼런스 기반.

### 라이브 커밋 온보딩

`/` 온보딩 화면에서 컴포넌트 체크박스를 토글하면 **즉시** `activeComponentIds`와 IR이 갱신된다 (`src/ui/onboarding/OnboardingScreen.tsx`).

- 색 연결이 있는 컴포넌트를 해제하려 하면 확인 다이얼로그가 뜬다. 검사 범위: (1) 그 컴포넌트가 소유한 slot, (2) 그 컴포넌트가 선언한 attribute 중 IR에 전역 색이 잡힌 것, (3) 그 컴포넌트의 variant id와 일치하는 symbol에 색이 잡힌 것 — 하나라도 있으면 경고.
- 마지막 컴포넌트 해제는 "모두 삭제" 확인을 띄운다.
- Continue/Start 버튼: 데이터가 있고 세션 중 0을 거치지 않았으면 **Continue**, 그 외엔 **Start**(빈 상태면 disabled). Continue/Start 클릭 시 네비 컨텍스트를 리셋하고 `/explore`(항상 Z0)로 이동.

Shell 헤더의 **Edit Components** 버튼으로 언제든 이 화면에 재진입할 수 있고, **Reset** 버튼은 확인 후 모든 결정을 wipe 한다.

## Primitive Atlas

`/atlas`에서 현재 IR의 모든 primitive를 조망한다 (`src/ui/primitives/`). 각 primitive의 anchor·scale·참조 수를 확인하고 고아 primitive를 제거하거나 두 primitive를 병합할 수 있다.

소비자(symbol/attribute/slot)가 색을 바꿀 때의 내부 규칙 (`rebindColor`):

- 가장 가까운 기존 primitive가 **그 색의 scale 안에** 들어오면 그 primitive를 재사용 (자기 ref만 갈아끼움).
- 그렇지 않으면 새 primitive를 생성해 ref를 꽂는다.

이렇게 해야 "원천이 바뀌면 참조한 모두가 바뀐다, 소비자가 바꾸면 자기 연결만 바뀐다"는 분리가 유지된다.

## Review & Export

`/review`는 Review / Export 두 모드 토글 (`src/ui/review/`).

- **Review 모드** — `ComponentGallery`(선택한 컴포넌트들의 실렌더 갤러리), `ColorScheme`(팔레트 분석), `SystemHealth`(IR 규칙 검사).
- **Export 모드** — 컴파일러 선택 후 결과 복사/다운로드.

### 컴파일러

`src/compilers/`의 세 타겟이 같은 IR을 독립적으로 읽는다:

| 컴파일러 | 출력 파일 | 언어 |
|---|---|---|
| `cssVariablesCompiler` | `posa-tokens.css` | CSS custom properties |
| `tailwindConfigCompiler` | `posa-tailwind.js` | Tailwind config fragment |
| `dtcgCompiler` | `posa-tokens.json` | DTCG JSON |

`Compiler` 인터페이스(`src/compilers/types.ts`)만 구현하면 새 타겟 추가가 끝난다. IR은 손대지 않는다.

## 영속화

Zustand `persist` 미들웨어로 `activeComponentIds`, `ir`, `locale`만 localStorage에 저장한다(`src/store/posa-store.ts`). 네비게이션 상태(`layer`, `selected*`, `focusedNode`)는 **세션 스코프** — 새로고침 시 항상 Z0부터 시작한다. 복구 직후 `i18n.changeLanguage(state.locale)`로 언어를 재적용한다.

## 라우팅

| 경로 | 화면 |
|---|---|
| `/` | `OnboardingScreen` (라이브 커밋 컴포넌트 선택) |
| `/explore` | `Shell` + `ExplorationView` (Z0/Z1/Z2 + ZX) |
| `/atlas` | `Shell` + `PrimitiveAtlas` |
| `/review` | `Shell` + `ReviewView` (Review/Export 토글) |
| `*` | `/`로 리다이렉트 |

`Shell`은 상단에 섹션 네비(`Explore`/`Atlas`/`Review`), `PaletteRibbon`(현재 IR 팔레트 축약 시각화), `LocaleToggle`, `Edit Components`, `Reset` 버튼을 둔다.

## 국제화

`src/i18n/locales/`에 **en / ko** 두 로케일. 9개 네임스페이스: `catalog`, `common`, `explorer`, `export`, `inspector`, `onboarding`, `planes`, `primitives`, `review`. UI 문자열은 모두 리소스 경유 — tsx에 하드코딩하지 않는다.

## 기술 스택

- Vite 5 + React 18 + TypeScript 5
- Tailwind CSS v4 (OKLCH 네이티브 지원)
- Zustand 4 (`persist` + `createJSONStorage` → localStorage)
- React Router v7
- react-i18next + i18next
- lucide-react (아이콘), clsx
- Vitest (로직 테스트, jsdom)
- 서버 없음. 로컬 작업 도구.

## 개발

```bash
pnpm dev          # Vite dev server
pnpm build        # tsc -b && vite build
pnpm preview      # production build 미리보기
pnpm test         # vitest run
pnpm test:watch   # 감시 모드
pnpm lint         # eslint
pnpm format       # prettier
```

## 테스트

`tests/` 하의 9개 파일 (vitest).

- `oklch.test.ts` — OKLCH 변환·거리 계산.
- `primitive.test.ts` — primitive scale 수학.
- `primitive-ops.test.ts` — primitive 추가/가장 가까운 primitive 탐색/scale 내 판정.
- `atlas-ops.test.ts` — primitive 제거·병합.
- `catalog.test.ts` — COMPONENT_DEFINITIONS 무결성.
- `selectors.test.ts` — IR 선택자(resolveColor, enumerate 등).
- `analysis.test.ts` — 색 접근성·가시성 규칙.
- `compilers.test.ts` — CSS/DTCG/Tailwind 컴파일 결과 검증.
- `smoke.test.ts` — 엔드-투-엔드 기본 플로우.

## 이름

"Posa"는 이탈리아어로 침전물, 앙금, 퇴적을 뜻한다. 사용자의 색 결정들이 시간이 지나며 primitive로 가라앉는 이 도구의 철학을 담는다.
