import type { CSSProperties } from 'react';
import { slotVarName } from '../slotVarName';

/**
 * shadcn Avatar — 원형 프로필. 이미지 없을 때 initials를 보여주는 형태.
 */
export function AvatarShape() {
  const style: CSSProperties = {
    backgroundColor: `var(--${slotVarName('avatar.background', 'default')})`,
    color: `var(--${slotVarName('avatar.text', 'default')})`,
    border: `1px solid var(--${slotVarName('avatar.border', 'default')})`,
  };
  return (
    <div
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium"
      style={style}
      data-posa-slot="avatar.background"
      data-posa-state="default"
    >
      MK
    </div>
  );
}
