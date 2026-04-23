import { slotVarName } from '../slotVarName';

/**
 * shadcn Spinner — 회전하는 로딩 인디케이터. icon 색상이 아크(호)를 결정.
 * 정적 프리뷰이므로 회전 애니메이션은 생략.
 */
export function SpinnerShape() {
  const iconColor = `var(--${slotVarName('spinner.icon', 'default')})`;
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      data-posa-slot="spinner.icon"
      data-posa-state="default"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={iconColor}
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
