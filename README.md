# Posa

> Color system as sediment — what settles when decisions accumulate.

## 출발

대부분의 팔레트 도구가 푸는 문제는 "어울리는 색 5개를 뽑아주는 것"이다. 5개, 많아야 8개. 실무에서 쓰는 디자인 시스템은 20–50개, 큰 SaaS는 수백 개의 색 토큰을 가진다. 이 간극을 메우는 도구가 시장에 없다.

이 도구를 만드는 이유는 단순하다. **내가 필요해서다.** 서비스를 만들 때 컬러 감각이 기가 막힌 디자이너가 수십 종의 어울리는 컬러셋을 뽑아내는 걸 보며, "저건 감각일까, 아니면 이론일까"라는 질문에서 시작했다. 음악에 화성학이 있듯 색에도 구조가 있고, 그 구조가 있다면 도구로 풀 수 있을 거라는 가설이다.

다만 이 도구는 제품으로 경쟁하려는 게 아니다. 내가 매번 새 서비스를 시작할 때마다 색 결정을 반복하며 겪는 피로 — "5개 골라놓았더니 1-2개 맘에 안 들어서 바꾸면 전체 밸런스가 깨진다", "6번째 7번째 색을 추가하는 순간 문제가 터진다" — 를 해소하기 위한 도구다. 출발은 개인적이지만, 설계를 밀고 가다 보니 구조적으로 흥미로운 지점에 도달했다.

## 핵심 관찰

이 도구가 존재하려면 세 가지 조건이 동시에 성립해야 한다:

1. **단일 도메인** — 컬러 하나만 다룬다. Roam이나 Notion처럼 무한 개방이 아니다.
2. **유한 스키마** — 실무에서 쓰이는 토큰 집합은 사실상 정해져 있다. 마스터 그래프가 선험적으로 존재 가능하다.
3. **명확한 완료 조건** — 모든 슬롯이 채워지면 끝이다. 언제 "됐다"가 구조적으로 보장된다.

세 조건이 모두 맞물릴 때 "탐색 도구"가 작동한다. Posa는 이 세 조건을 확인하고 그 위에 세운 도구다.

## 설계 철학 — Emergent over Declared

업계 관행은 위에서 아래로 설계하는 방식이다. Primitive scale(brand-50 ~ brand-950)을 먼저 만들고, 그 위에 semantic role(primary, surface)을 얹고, 그 위에 component token(button.primary.bg)을 얹는다.

Posa는 이 방향을 뒤집는다. 사용자는 semantic과 component 레벨에서 구체적 결정을 내리고, **primitive는 그 결정의 부산물로 나타난다**. Primitive는 설계 대상이 아니라 사용자의 선택 행적이 쌓여서 생기는 자취다. 그리고 그 자취는 미래 선택의 기준점이 된다.

이 원칙은 세 축에서 반복된다:

- **Universe emerges from component selection** — 사용자가 선택한 UI 컴포넌트 타입의 합집합이 이 인스턴스의 탐색 범위가 된다. 미리 정의된 거대 그래프를 전부 주는 게 아니다.
- **Primitive emerges from color decisions** — 사용자가 특정 색을 고르면 OKLCH 기반으로 11단 primitive scale이 자동 파생된다. 사용자는 primitive를 직접 다루지 않는다.
- **Projection emerges from selection path** — 상위 층에서 무엇을 선택하고 내려왔는지에 따라 하위 층의 가시 범위가 결정된다. 같은 층이라도 맥락에 따라 보이는 그래프가 다르다.

이 세 축의 공통점은 **사용자의 의도를 묻는 지점을 최소화하고, 나머지는 그 의도의 투영으로 자동 생성**하는 것이다.

## Z축 탐색 — 맥락을 들고 내려가는 구조

Posa의 탐색 인터페이스는 3개의 층으로 나뉜다. 평면적인 "목록 — 상세"가 아니라, **위층에서 무엇을 선택했느냐에 따라 아래층에 보이는 내용이 달라지는** 동적 투영 구조다.

### 3개의 층

- **Z0 — Roles (의미 계층)**: `primary`, `surface`, `warning` 같은 의미 역할들. Universe에 포함된 role만 보인다.
- **Z1 — Slots (역할 계층)**: 특정 role을 참조하는 component slot들. 예를 들어 `warning`의 Z1에는 `toast.warning.bg`, `form.warning.border`, `icon.warning.fg` 등이 나타난다.
- **Z2 — States (변주 계층)**: 특정 slot의 상태 variants. 예를 들어 `button.primary.bg`의 Z2에는 `default`, `hover`, `active`, `disabled`.

### 투영 — 같은 층이라도 맥락에 따라 다르게 보임

핵심은 Z1과 Z2가 **고정된 내용을 갖지 않는다**는 점이다. 위층에서 무엇을 선택하고 내려왔느냐가 아래층의 전체 내용을 결정한다:

- Z0에서 `warning`을 선택하고 내려가면 → Z1에는 warning을 참조하는 5개 slot만 보인다. "아, warning은 5개만 정하면 되겠군."
- Z0에서 `primary`를 선택하고 내려가면 → Z1에는 primary를 참조하는 8개 slot이 보인다. 완전히 다른 그래프.
- Z1에서 `button.primary.bg`를 선택하고 Z2로 내려가면 → Z2에는 그 slot의 4개 state만 보인다.

이게 수백~수천 개 토큰의 바다에서 길을 잃지 않게 하는 방법이다. 사용자는 항상 **현재 맥락에서 필요한 만큼의 결정 공간**만 본다.

### 맥락은 누적된다

깊이 내려가도 위층의 맥락은 사라지지 않는다. 상단에는 지금까지 내려온 경로가 **축소된 미니어처 평면**으로 쌓여 있다:

- Z0에 있을 때는 breadcrumb이 비어있음.
- Z1에 있으면 상단에 `MiniZ0` — Z0의 모든 role이 작은 그리드 dot들로 축소되고, 선택한 role에 링이 쳐짐.
- Z2에 있으면 `MiniZ0 → MiniZ1` 두 개가 쌓임.

이 미니어처들은 **살아있다 (live)**. 아래층에서 색을 바꾸면 상단 미니어처가 실시간으로 반영한다. Z2에서 `button.primary.bg`의 hover 색을 조정하면, 상단 `MiniZ1` 막대가 즉시 업데이트된다. 미니어처 클릭 시 해당 층으로 점프 가능.

이게 Posa의 시각적 서명이다. 일반적 breadcrumb(텍스트 경로)이 아니라 **탐색의 공간감 자체를 UI로 만든 것**이다. 사용자는 언제든 "나는 어디에서 와서 지금 어디에 있고, 지나온 층들은 지금 어떤 상태인가"를 한눈에 본다.

### 층 이동의 물리적 감각

층 간 이동은 깊이감을 가진다. 아래로 내려갈 때는 현재 평면이 확대되며 사라지고 새 평면이 뒤에서 선명해지며 등장 (scale 1.07 → 1, blur 6px → 0). 위로 올라갈 때는 반대 방향으로 (scale 0.93 → 1). 280-320ms의 짧은 전환이지만 "층을 이동했다"가 아니라 "깊이를 오르락내리락한다"는 감각을 만든다.

Focus된 카드는 선택된 컬러의 halo를 뿜는다 — `box-shadow`에 그 색의 alpha 버전이 번진다. 컬러 도구에서만 가능한 이 feedback이 "색을 다루는 도구"라는 정체성을 매 클릭마다 새긴다.

## 도구의 차별점

시장에 존재하는 거의 모든 컬러 도구와 Posa는 다음 지점에서 구분된다:

**1. 마스터 그래프 + 인스턴스 모델**
Posa는 모든 서비스가 필요로 하는 토큰의 **완전한 스키마**를 내장한다. 사용자는 이 스키마에 색을 채우는 **인스턴스**를 만든다. 이는 완결성("내가 뭘 놓쳤지?" 불안 없음), 검증(스키마 제약으로 대비비 등 자동 체크), 마이그레이션(스키마 업데이트 시 기존 인스턴스 자동 반영)이라는 속성을 낳는다.

**2. 순차 커밋 + 맥락 유지 탐색**
기존 도구는 5-8개 팔레트를 병렬로 보여주고 뽑게 하는 모델이다. Posa는 한 번에 한 결정씩 내리고, 이전 결정의 맥락이 다음 선택의 제약이 되며, 언제든 돌아가 수정해도 맥락이 보존된다. 층 간 이동은 이전 평면의 축소 미니어처가 상단에 살아있는 형태로 시각화된다.

**3. Primitive를 기록으로 관리**
사용자가 색을 바꿀 때, Posa는 기존 primitive scale을 덮어쓰지 않는다. 기존 primitive는 보존되고, 새 primitive가 생성된다. 사용자는 어느 primitive가 몇 개 slot에서 참조되는지 조망할 수 있고, 고아가 된 primitive를 정리하거나 병합하는 능동적 리팩토링이 가능하다. 팔레트 편집의 Git이다.

**4. IR + 컴파일러 구조**
내부 표현(IR)은 색 공간(OKLCH 기반)과 참조 관계만을 담고, 표현 방식에 중립적이다. Export 시 여러 타겟(Tailwind config, CSS variables, DTCG JSON, Figma Variables 등)으로 독립 컴파일된다. 타겟 추가는 IR을 건드리지 않고 컴파일러만 추가하면 된다.

## MVP 범위

**포함:**
- shadcn 기반 50여 개 컴포넌트 카탈로그
- 컴포넌트 선택을 통한 universe 파생
- Z0 (Role) / Z1 (Slot) / Z2 (State) 3층 순차 탐색
- OKLCH 기반 primitive scale 자동 파생
- Primitive atlas (조망 / 사용률 / 고아 확인)
- Anchor 수정 시 "Adjust vs Replace" 사용자 선택
- 3종 export 컴파일러 (CSS variables / Tailwind config / DTCG JSON)

**제외 (v2 이후):**
- Hue 거리 기반 자동 "Adjust vs Replace" 판정
- 다크모드 자동 생성
- Shade 수학 규칙 커스터마이즈 (L 곡선 튜닝)
- Figma / iOS / Android 타겟 컴파일러
- 팀 협업, 클라우드 싱크
- 자연어 색 생성 / AI 추천

MVP에서 중요한 건 **구조의 완성도**지 기능의 폭이 아니다. 위의 네 가지 차별점 중 어느 하나라도 빠지면 설계의 의미가 약해진다.

## 이름

"Posa"는 이탈리아어로 침전물, 앙금, 퇴적을 뜻한다. 사용자의 색 결정들이 시간이 지나며 primitive로 가라앉는 이 도구의 철학을 담는다.

## 기술 스택

- Vite + React + TypeScript
- Tailwind CSS v4 (OKLCH 네이티브 지원)
- Zustand (IR 상태 관리)
- Vitest (로직 테스트)
- 서버 없음. 로컬 작업 도구.

## 문서

- `prompts/00-repo-foundation.md` — 리포 초기화
- `prompts/01-ir-color-math.md` — IR 스키마 + OKLCH 수학
- `prompts/02-catalog-universe.md` — 컴포넌트 카탈로그 + universe 파생
- `prompts/03-onboarding-z0.md` — Onboarding + Role 탐색
- `prompts/04-z1-z2-primitives.md` — Slot / State + primitive 생성 흐름
- `prompts/05-atlas-export.md` — Primitive atlas + export 컴파일러
