import { oklchToCssString } from '../color/oklch';
import {
  ATTRIBUTE_IDS,
  SHADE_INDICES,
  SYMBOL_IDS,
  type ColorRef,
  type IR,
  type PrimitiveId,
  type ShadeIndex,
  type SymbolId,
} from '../ir/types';
import type { Compiler } from './types';

/**
 * Design Tokens Community Group 포맷.
 * - primitive scale은 `color.<family>.<shade>`로 중첩.
 * - symbol/attribute/slot은 alias로 primitive나 symbol을 가리킨다.
 */

type ColorNode = {
  $value?: string;
  $type?: 'color';
  [key: string]: unknown;
};

function primitiveRef(primitiveId: PrimitiveId, shade: ShadeIndex): string {
  return `{color.${primitiveId}.${shade}}`;
}

function symbolRef(symbolId: SymbolId): string {
  return `{color.symbols.${symbolId}}`;
}

function colorRefToAlias(ir: IR, ref: ColorRef): string | null {
  if (ref.kind === 'primitive') {
    if (!ir.primitives[ref.primitive]) return null;
    return primitiveRef(ref.primitive, ref.shade);
  }
  if (!ir.symbols[ref.symbol]) return null;
  return symbolRef(ref.symbol);
}

function ensureObject(
  root: Record<string, unknown>,
  path: string[],
): Record<string, unknown> {
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

    const primEntries = Object.values(ir.primitives).sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    for (const p of primEntries) {
      const family = ensureObject(colorRoot, [p.id]);
      for (const shade of SHADE_INDICES) {
        const c = p.scale[shade];
        family[String(shade)] = {
          $value: oklchToCssString(c),
          $type: 'color',
        } satisfies ColorNode;
      }
    }

    const symbolsRoot: Record<string, unknown> = {};
    for (const id of SYMBOL_IDS) {
      const sym = ir.symbols[id];
      if (!sym) continue;
      if (!ir.primitives[sym.primitive]) continue;
      symbolsRoot[id] = {
        $value: primitiveRef(sym.primitive, sym.shade),
        $type: 'color',
      } satisfies ColorNode;
    }
    if (Object.keys(symbolsRoot).length > 0) {
      colorRoot.symbols = symbolsRoot;
    }

    const attributesRoot: Record<string, unknown> = {};
    for (const id of ATTRIBUTE_IDS) {
      const attr = ir.attributes[id];
      if (!attr) continue;
      const alias = colorRefToAlias(ir, attr);
      if (!alias) continue;
      attributesRoot[id] = {
        $value: alias,
        $type: 'color',
      } satisfies ColorNode;
    }
    if (Object.keys(attributesRoot).length > 0) {
      colorRoot.attributes = attributesRoot;
    }

    const slotEntries = Object.entries(ir.slots).filter(([, s]) => {
      if (s.ref) return true;
      return Object.values(s.states).some((v) => v);
    });
    if (slotEntries.length > 0) {
      const slotsRoot = ensureObject(colorRoot, ['slots']);
      for (const [slotId, slot] of slotEntries) {
        const slotGroup = ensureObject(slotsRoot, slotId.split('.'));
        if (slot.ref) {
          const alias = colorRefToAlias(ir, slot.ref);
          if (alias) {
            slotGroup.default = {
              $value: alias,
              $type: 'color',
            } satisfies ColorNode;
          }
        }
        for (const [state, override] of Object.entries(slot.states)) {
          if (!override) continue;
          const alias = colorRefToAlias(ir, override);
          if (!alias) continue;
          slotGroup[state] = {
            $value: alias,
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
