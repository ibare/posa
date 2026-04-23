import type { SlotId, StateId } from '../ir/types';

/**
 * Slot × state → CSS 변수 이름.
 *   button.primary.background / default → posa-slot-button-primary-background
 *   button.primary.background / hover   → posa-slot-button-primary-background-hover
 *   input.text / focus                  → posa-slot-input-text-focus
 *
 * default는 suffix 없이 쓴다 — 기본 상태가 CSS의 자연스러운 시작점이어야 한다.
 */
export function slotVarName(slotId: SlotId, state: StateId): string {
  const base = `posa-slot-${slotId.replace(/\./g, '-')}`;
  return state === 'default' ? base : `${base}-${state}`;
}
