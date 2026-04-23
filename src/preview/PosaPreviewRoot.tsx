import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { findComponentBySlotId } from '../catalog/components';
import { oklchToCssString } from '../color/oklch';
import {
  enumerateAllSlotIds,
  getAttributeFromSlotId,
  resolveSlotStateColor,
} from '../ir/selectors';
import type { AttributeId, IR } from '../ir/types';
import { slotVarName } from './slotVarName';

/**
 * Resolve 실패(= 아무것도 할당 안 됨) 시 shape에 그려질 대체 색.
 *   - box-ish (background/border/outline): transparent — 면이 비어 있음을 그대로 보여준다.
 *   - ink-ish  (text/placeholder/icon/mark): 옅은 스톤 회색 — "아직 미지정"을 구분 가능한 고스트로 표시.
 * body의 기본 텍스트 색(stone-900)이 상속되며 '진짜 검정'처럼 보이는 것을 막기 위함.
 */
const UNSET_PLACEHOLDER: Record<AttributeId, string> = {
  background: 'transparent',
  border: 'transparent',
  outline: 'transparent',
  text: 'rgba(68, 64, 60, 0.25)',
  placeholder: 'rgba(68, 64, 60, 0.18)',
  icon: 'rgba(68, 64, 60, 0.25)',
  mark: 'rgba(68, 64, 60, 0.25)',
};

type Props = {
  ir: IR;
  children: ReactNode;
  className?: string;
};

/**
 * IR을 CSS 변수로 주입하는 프리뷰 루트.
 * 모든 slot × state에 대해 `--posa-slot-*` 변수를 만들고 자손 shape 컴포넌트가 이를 소비한다.
 *
 * shadcn의 `--primary` 같은 일반 변수는 만들지 않는다 — 그 레이어는 이제 없다.
 * Slot 단위로만 색이 주입되므로 shape 컴포넌트 입장에서 '컴포넌트 × attribute × state'
 * 3축의 변수 이름만 알면 된다.
 */
export function PosaPreviewRoot({ ir, children, className }: Props) {
  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {};
    for (const slotId of enumerateAllSlotIds()) {
      const comp = findComponentBySlotId(slotId);
      if (!comp) continue;
      const attr = getAttributeFromSlotId(slotId);
      const fallback = UNSET_PLACEHOLDER[attr];
      for (const state of comp.states) {
        const color = resolveSlotStateColor(ir, slotId, state);
        vars[`--${slotVarName(slotId, state)}`] = color
          ? oklchToCssString(color)
          : fallback;
      }
    }
    return vars;
  }, [ir]);

  return (
    <div style={cssVars as CSSProperties} className={className}>
      {children}
    </div>
  );
}
