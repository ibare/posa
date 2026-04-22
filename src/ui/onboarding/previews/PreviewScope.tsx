import type { CSSProperties, ReactNode } from 'react';

/**
 * 프리뷰에 주입되는 shadcn 토큰 팔레트.
 * IR이 아직 없는 온보딩 단계에서는 중립 기본값을 쓰고,
 * 이후 단계에서는 IR에서 resolve한 색으로 대체 가능.
 */
export type PreviewPalette = Partial<{
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}>;

const KEY_TO_VAR: Record<keyof PreviewPalette, string> = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
};

type Props = {
  palette?: PreviewPalette;
  className?: string;
  children: ReactNode;
};

/**
 * shadcn 컴포넌트가 소비하는 CSS 변수를 로컬 DOM 서브트리에만 세팅한다.
 * 바깥 Posa UI(cream/stone 톤)는 영향 없음.
 *
 * palette 생략 시 :root 기본값(중립)이 상속된다.
 */
export function PreviewScope({ palette, className, children }: Props) {
  const style: CSSProperties = {};
  if (palette) {
    for (const key in palette) {
      const value = palette[key as keyof PreviewPalette];
      if (value) {
        const cssVar = KEY_TO_VAR[key as keyof PreviewPalette];
        (style as Record<string, string>)[cssVar] = value;
      }
    }
  }
  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
