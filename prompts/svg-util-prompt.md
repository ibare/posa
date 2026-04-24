# 프롬프트 — DOM → SVG 변환 유틸리티

## 목적

임의의 DOM element를 받아 SVG 문자열로 변환하는 **순수 유틸리티 함수**를 구현한다. UI 통합은 이 프롬프트 범위 밖 — 유틸리티가 있으면 나중에 Copy 버튼, 다운로드 기능, 자동 export 등 다양한 UX로 자유롭게 연결 가능.

## API

```typescript
// 메인 함수
async function domToSvg(element: HTMLElement, options?: Options): Promise<string>

type Options = {
  waitForFonts?: boolean;  // default: true
};
```

단일 함수만 export. 복사/저장/렌더 같은 side effect 없음. 입력 element를 측정해서 SVG 문자열만 반환.

## 동작

1. (옵션) `document.fonts.ready` 대기
2. 주어진 element를 root로 DOM 트리 재귀 walk
3. 각 요소의 `getBoundingClientRect()`, `getComputedStyle()` 수집
4. Root 기준 상대 좌표로 변환
5. SVG primitive(`<rect>`, `<text>`) 배열 생성
6. 직렬화된 SVG 문자열 반환

## 핵심 원칙

**레이아웃 엔진을 만들지 않는다.** Flex, grid, inline flow 모두 **브라우저가 이미 계산한 결과만** 측정해서 사용. 직접 좌표 계산 금지.

**Posa shape의 CSS subset에 최적화.** 다음은 지원 대상: 배경색, 테두리(균일 1-n px, 단일 border-radius), 텍스트(폰트, 크기, weight, 색, text-align, flex 기반 중앙 정렬), flex/grid 레이아웃의 결과 좌표.

다음은 지원 안 함 (현재 Posa가 사용하지 않으므로): box-shadow, gradient, background-image, pseudo-element, 비대칭 border-radius, CSS filter, transform, opacity 혼합. 미래에 필요해지면 그때 확장.

## 변환 로직 참고

`dom-to-svg-demo.jsx` 파일에 완성된 변환 파이프라인 존재. 이 데모의 `extractSvgNodes`와 `serializeSvg` 함수를 기반으로 Posa 코드베이스 컨벤션에 맞춰 이식.

주의할 구현 디테일:
- Text 좌표: `text-anchor`는 `justify-content`/`text-align`에서, baseline 위치는 `align-items` + font-size에서 계산
- Border: stroke가 경로 중심을 따르므로 border-width의 절반만큼 inset 필요
- Border-radius: shorter side의 절반으로 clamp (pill shape 지원)
- 색: `rgb(r, g, b)` 형식을 hex로 변환하되 alpha 있으면 rgba 문자열 유지
- Leaf text 판정: 자식 중 element 노드 없고 텍스트 콘텐츠 있을 때만 emit

## 파일 구조 제안

```
src/preview/svg-export/
├── domToSvg.ts          # 메인 export 함수
├── extract.ts           # DOM walk + 측정
├── serialize.ts         # SVG 문자열 직렬화
└── color-utils.ts       # rgb → hex 등 작은 헬퍼
```

구조는 에이전트가 Posa 기존 컨벤션에 맞춰 조정 가능.

## 테스트

`tests/dom-to-svg.test.ts` 최소 세 케이스:

1. **단순 박스**: 배경색 + 테두리 + 중앙 텍스트 하나 → 예상 SVG 구조 비교
2. **Flex 레이아웃**: 가로 나열된 요소 3개 → 각 요소의 x 좌표가 순차적으로 증가하는지 검증
3. **중첩 grid**: grid 컨테이너 안에 여러 셀 → 각 셀의 좌표가 grid 계산 결과를 반영하는지

JSDOM 환경에서 `getBoundingClientRect()`는 0을 반환하므로 브라우저 환경 테스트 필요. Vitest `browser` mode 또는 happy-dom 설정 검토. 이 제약으로 테스트가 번거로우면 **E2E 스냅샷 대신 유닛 레벨에서는 serialize 함수만 테스트**하고, 전체 파이프라인은 수동 검증으로 갈음해도 됨.

## 범위 밖

- UI 통합 (Copy 버튼, 토스트, 다운로드 다이얼로그 등 모두 나중에)
- PNG 변환
- SVG 최적화 (SVGO 적용 등)
- 클립보드 API 호출
- 파일 저장
- React 컴포넌트 (유틸리티는 순수 함수)

## Deliverables

- [ ] `domToSvg(element, options)` export 함수
- [ ] 변환 로직 파일들 (extract, serialize, color-utils)
- [ ] 최소 1개 이상의 단위 테스트
- [ ] 수동 검증: Posa preview에서 `domToSvg(document.querySelector('...'))` 호출해 반환 문자열을 콘솔에서 확인, Figma에 수동 붙여넣어 벡터로 인식되는지 체크
