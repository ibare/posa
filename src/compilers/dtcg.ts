import { oklchToCssString } from '../color/oklch';
import { SHADE_INDICES, type IR } from '../ir/types';
import type { Compiler } from './types';

/**
 * Design Tokens Community Group 포맷.
 * - primitive scale은 "color.<family>.<shade>"로 중첩.
 * - role / slot는 reference alias로 primitive를 가리킨다 — 존재하지 않는 키를 참조하지 않도록 주의.
 */

type ColorNode = {
  $value?: string;
  $type?: 'color';
  [key: string]: unknown;
};

function toRefPath(primitiveId: string, shade: number): string {
  return `{color.${primitiveId}.${shade}}`;
}

function ensureObject(root: Record<string, unknown>, path: string[]): Record<string, unknown> {
  let cur: Record<string, unknown> = root;
  for (const seg of path) {
    const existing = cur[seg];
    if (typeof existing !== 'object' || existing === null) {
      const next: Record<string, unknown> = {};
      cur[seg] = next;
      cur = next;
    } else {
      cur = existing as Record<string, unknown>;
    }
  }
  return cur;
}

export const dtcgCompiler: Compiler = {
  id: 'dtcg',
  label: 'Design Tokens JSON',
  description: 'W3C DTCG 포맷 (`{ref}` alias)',
  compile: (ir: IR) => {
    const out: Record<string, unknown> = {
      $schema:
        'https://design-tokens.github.io/community-group/format.schema.json',
      color: {},
    };

    const colorRoot = out.color as Record<string, unknown>;

    // Primitive scales
    const primEntries = Object.values(ir.primitives).sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    for (const p of primEntries) {
      const family = ensureObject(colorRoot, [p.id]);
      for (const shade of SHADE_INDICES) {
        const c = p.scale[shade];
        const leaf: ColorNode = {
          $value: oklchToCssString(c),
          $type: 'color',
        };
        family[String(shade)] = leaf;
      }
    }

    // Roles → alias
    for (const [roleId, assign] of Object.entries(ir.roles)) {
      if (!ir.primitives[assign.primitive]) continue;
      colorRoot[roleId] = {
        $value: toRefPath(assign.primitive, assign.shade),
        $type: 'color',
      } satisfies ColorNode;
    }

    // Slot state overrides — color.slots.<slot-id>.<state>
    const slotEntries = Object.entries(ir.slots).filter(
      ([, s]) => Object.keys(s.states).length > 0,
    );
    if (slotEntries.length > 0) {
      const slotsRoot = ensureObject(colorRoot, ['slots']);
      for (const [slotId, slot] of slotEntries) {
        const slotGroup = ensureObject(
          slotsRoot,
          slotId.split('.'),
        );
        for (const [state, override] of Object.entries(slot.states)) {
          if (!override) continue;
          if (!ir.primitives[override.primitive]) continue;
          slotGroup[state] = {
            $value: toRefPath(override.primitive, override.shade),
            $type: 'color',
          } satisfies ColorNode;
        }
      }
    }

    return {
      filename: 'posa-tokens.json',
      content: JSON.stringify(out, null, 2) + '\n',
      language: 'json',
    };
  },
};
