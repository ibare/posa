import type { IR, RoleId } from '../../ir/types';
import { oklchToCssString } from '../../color/oklch';
import { resolveRoleColor } from '../../color/resolve';
import type { PreviewPalette } from '../onboarding/previews/PreviewScope';

/**
 * Posa role → shadcn 토큰 매핑.
 * 키: PreviewPalette 키, 값: 읽어야 할 role id.
 * shadcn에 1:1 매칭되지 않는 role(success/warning/info 등)은 여기서 제외한다.
 */
const ROLE_MAP: Record<keyof PreviewPalette, RoleId> = {
  background: 'background',
  foreground: 'foreground',
  card: 'card',
  cardForeground: 'card-fg',
  popover: 'popover',
  popoverForeground: 'popover-fg',
  primary: 'primary',
  primaryForeground: 'primary-fg',
  // shadcn의 secondary는 Posa에 직접 대응이 없으므로 accent를 재사용한다.
  secondary: 'accent',
  secondaryForeground: 'accent-fg',
  muted: 'muted',
  mutedForeground: 'muted-fg',
  accent: 'accent',
  accentForeground: 'accent-fg',
  destructive: 'destructive',
  destructiveForeground: 'destructive-fg',
  border: 'border',
  input: 'input',
  ring: 'ring',
};

/**
 * IR을 읽어 shadcn 토큰 팔레트를 만든다.
 * 해당 role이 없거나 resolve 실패 시 해당 키를 비워 두어(PreviewScope에서 무시됨)
 * :root 기본값으로 fallback 되도록 한다.
 */
export function irToPreviewPalette(ir: IR): PreviewPalette {
  const palette: PreviewPalette = {};
  for (const key in ROLE_MAP) {
    const paletteKey = key as keyof PreviewPalette;
    const roleId = ROLE_MAP[paletteKey];
    const color = resolveRoleColor(ir, roleId);
    if (color) {
      palette[paletteKey] = oklchToCssString(color);
    }
  }
  return palette;
}
