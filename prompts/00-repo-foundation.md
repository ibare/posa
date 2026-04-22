# Prompt 00 — Repo Foundation

## Context

Posa는 컬러 시스템 빌더다. 사용자가 컴포넌트 타입을 선택하면 필요한 role/slot/state가 도출되고, 그 위에 색을 채우면 primitive scale이 자동 파생된다. 자세한 철학은 리포 루트의 `README.md` 참고.

이 프롬프트는 **리포 초기화와 툴체인 세팅**만 다룬다. 로직이나 UI는 다음 프롬프트에서.

## Stack

- **Vite** (React + TypeScript template)
- **Tailwind CSS v4** — OKLCH 네이티브 지원 때문에 필수. v3 쓰지 말 것.
- **Zustand** — IR 상태 관리
- **Vitest** — 로직 테스트 (color math, compilers 검증 필요)
- **ESLint + Prettier** — 기본 세팅만. 엄격한 커스텀 룰 지금 추가하지 말 것.
- **pnpm** 우선. 없으면 npm.

## Scope

다음을 구현한다:

1. Vite + React + TS 템플릿으로 프로젝트 초기화
2. Tailwind v4 설치 및 설정
3. Zustand 설치
4. Vitest 설치 및 설정
5. ESLint + Prettier 기본 설정
6. 디렉토리 구조 생성 (아래 명세)
7. `README.md` 작성 (리포 루트)
8. 기본 앱이 `npm run dev`로 뜨고, `npm test`로 빈 테스트가 돈다

## Directory Structure

프로젝트 루트에 생성:

```
posa/
├── src/
│   ├── ir/              # Internal representation — 스키마 타입, 상태
│   ├── color/           # OKLCH 수학, primitive scale 파생
│   ├── catalog/         # 컴포넌트 카탈로그 데이터, universe 파생
│   ├── compilers/       # Export 컴파일러 (CSS vars, Tailwind, DTCG)
│   ├── ui/              # React 컴포넌트
│   │   ├── onboarding/  # 컴포넌트 선택 화면
│   │   ├── planes/      # Z0/Z1/Z2 탐색 UI
│   │   ├── primitives/  # Z_prim atlas
│   │   └── shared/      # 공통 UI 조각 (swatch, picker 등)
│   ├── store/           # Zustand store
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/               # Vitest
├── prompts/             # 이 구현 프롬프트들 (여기 보관)
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.ts   # v4는 설정 최소화지만 필요시
├── .eslintrc.json
├── .prettierrc
└── .gitignore
```

각 디렉토리에는 빈 `index.ts`를 하나씩 두어 import 경로를 미리 잡아둔다. (실제 구현은 이후 프롬프트에서.)

## README.md (리포 루트)

반드시 첨부된 프로젝트 개요 문서를 `README.md`로 저장한다. 이 문서가 모든 후속 프롬프트의 context가 되므로 절대 누락하지 말 것. (개요 문서는 이 프롬프트와 함께 전달됨.)

## Rules

**Do NOT:**
- Next.js 쓰지 말 것. SSR 불필요.
- Tailwind v3 쓰지 말 것. 반드시 v4.
- 상태 관리 라이브러리를 Zustand 외 다른 것으로 바꾸지 말 것 (Redux Toolkit, Jotai, Valtio 등 금지).
- UI 라이브러리를 설치하지 말 것. shadcn/ui도 지금 단계에선 금지. 카탈로그 참조는 하지만 실제 컴포넌트 코드를 import하지 않는다.
- 라우팅 라이브러리(react-router 등) 설치하지 말 것. 지금 단계에서 불필요.
- 글로벌 CSS 프레임워크를 Tailwind 외 추가하지 말 것.
- `create-next-app`, `create-remix-app` 금지.

**Do:**
- Vite의 기본 React-TS 템플릿으로 시작.
- Tailwind v4는 `@tailwindcss/vite` 플러그인으로 세팅.
- TypeScript strict mode.
- Git 초기화 + 첫 커밋 ("chore: initial setup").

## Deliverables

끝났을 때 확인되어야 하는 것:

- [ ] `pnpm install` (또는 `npm install`)이 에러 없이 완료
- [ ] `pnpm dev`로 앱이 뜨고 빈 화면 ("Posa" 타이틀 정도만)
- [ ] `pnpm test`로 Vitest가 돌고, `tests/smoke.test.ts`에 간단한 통과 테스트 하나 있음
- [ ] `pnpm build`가 에러 없이 완료
- [ ] `src/index.css`에 Tailwind v4 import 되어 있고, `App.tsx`에서 Tailwind 클래스 하나라도 적용되어 동작 확인
- [ ] `README.md`가 리포 루트에 있고 프로젝트 개요 문서 내용이 들어가 있음
- [ ] `.gitignore`에 `node_modules`, `dist`, `.env*` 등 표준 항목 포함

## Out of Scope for This Prompt

- 실제 UI 구현
- IR 타입 정의
- 컬러 수학
- 컴포넌트 카탈로그

이것들은 Prompt 01 이후에서. 이 프롬프트는 오직 **뼈대**만 세운다.
