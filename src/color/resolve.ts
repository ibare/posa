import type { IR, OKLCH, RoleId, SlotId, StateId } from '../ir/types';

/**
 * IR을 읽어 최종 OKLCH 값으로 풀어내는 함수들.
 * 이 모듈은 반드시 읽기 전용 — primitive 생성이나 IR 수정 금지.
 */

/** Role → primitive → scale[shade]로 풀어낸 OKLCH를 돌려준다. 없으면 null. */
export function resolveRoleColor(ir: IR, roleId: RoleId): OKLCH | null {
  const role = ir.roles[roleId];
  if (!role) return null;

  const primitive = ir.primitives[role.primitive];
  if (!primitive) return null;

  const color = primitive.scale[role.shade];
  return color ?? null;
}

/**
 * Slot을 state와 함께 해석한다.
 * state가 지정되고 해당 state override가 있으면 그 override를 따른다.
 * 아니면 slot.role의 기본 색을 따른다.
 */
export function resolveSlotColor(
  ir: IR,
  slotId: SlotId,
  state?: StateId,
): OKLCH | null {
  const slot = ir.slots[slotId];
  if (!slot) return null;

  if (state) {
    const override = slot.states[state];
    if (override) {
      const primitive = ir.primitives[override.primitive];
      if (!primitive) return null;
      return primitive.scale[override.shade] ?? null;
    }
  }

  return resolveRoleColor(ir, slot.role);
}
