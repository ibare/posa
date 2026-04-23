import type { CSSProperties } from 'react';
import type { StateId } from '../../ir/types';
import { slotVarName } from '../slotVarName';

type Props = { state?: StateId };

/**
 * shadcn Breadcrumb — 경로 세그먼트 + 구분자. 마지막 세그먼트가 현재 state로 강조.
 * 이전 세그먼트와 구분자는 muted.
 */
export function BreadcrumbShape({ state = 'default' }: Props) {
  const highlightedStyle: CSSProperties = {
    color: `var(--${slotVarName('breadcrumb.text', state)})`,
  };
  const mutedColor = `var(--${slotVarName('breadcrumb.muted', 'default')})`;

  return (
    <nav
      className="inline-flex items-center gap-1.5 text-xs"
      data-posa-slot="breadcrumb.background"
      data-posa-state={state}
    >
      <span style={{ color: mutedColor }}>Home</span>
      <span style={{ color: mutedColor }}>/</span>
      <span style={{ color: mutedColor }}>Components</span>
      <span style={{ color: mutedColor }}>/</span>
      <span style={highlightedStyle}>Breadcrumb</span>
    </nav>
  );
}
