import { oklchToCssString } from '../color/oklch';
import {
  enumerateActiveSlotIds,
  getActiveAttributeIds,
  getAttributeFromSlotId,
  resolveSlotStateColor,
  resolveSymbolColor,
} from '../ir/selectors';
import {
  SHADE_INDICES,
  SYSTEM_SYMBOL_COLORS,
  SYSTEM_SYMBOL_IDS,
  type ColorRef,
  type IR,
  type PrimitiveId,
  type ShadeIndex,
  type SlotId,
  type SymbolId,
} from '../ir/types';
import type { Compiler } from './types';

/**
 * Design Tokens Community Group 포맷. 각 토큰의 $value는 최종 resolve된 OKLCH
 * 색 문자열로 담고, 원 IR에서의 상속 경로는 $extensions.posa.alias에 남긴다.
 * Style Dictionary·Tokens Studio 등 체인 alias 해석을 지원하지 않는 툴에서도
 * 값을 바로 쓸 수 있고, 원 구조를 복원하려는 툴은 alias를 참조하면 된다.
 */

type ColorNode = {
  $value: string;
  $type: 'color';
  $extensions?: { posa: { alias: string } };
};

function primitivePath(primitiveId: PrimitiveId, shade: ShadeIndex): string {
  return `{color.${primitiveId}.${shade}}`;
}

function symbolPath(symbolId: SymbolId): string {
  return `{color.symbols.${symbolId}}`;
}

function attributePath(attrId: string): string {
  return `{color.attributes.${attrId}}`;
}

function refAliasPath(ir: IR, ref: ColorRef): string | null {
  if (ref.kind === 'primitive') {
    if (!ir.primitives[ref.primitive]) return null;
    return primitivePath(ref.primitive, ref.shade);
  }
  return symbolPath(ref.symbol);
}

function slotDefaultAliasPath(ir: IR, slotId: SlotId): string | null {
  const slot = ir.slots[slotId];
  if (slot?.ref) return refAliasPath(ir, slot.ref);
  const attrId = getAttributeFromSlotId(slotId);
  if (!ir.attributes[attrId]) return null;
  return attributePath(attrId);
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

function colorNode(value: string, alias: string | null): ColorNode {
  const node: ColorNode = { $value: value, $type: 'color' };
  if (alias) node.$extensions = { posa: { alias } };
  return node;
}

export const dtcgCompiler: Compiler = {
  id: 'dtcg',
  compile: ({ ir, components }) => {
    const activeAttributeIds = getActiveAttributeIds(components);
    const activeSlotIds = enumerateActiveSlotIds(components, ir);
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
        family[String(shade)] = colorNode(
          oklchToCssString(p.scale[shade]),
          null,
        );
      }
    }

    const symbolsRoot: Record<string, unknown> = {};
    for (const [id, sym] of Object.entries(ir.symbols)) {
      if (!sym) continue;
      const color = resolveSymbolColor(ir, id as SymbolId);
      if (!color) continue;
      const alias =
        sym.kind === 'primitive' && ir.primitives[sym.primitive]
          ? primitivePath(sym.primitive, sym.shade)
          : null;
      symbolsRoot[id] = colorNode(oklchToCssString(color), alias);
    }
    for (const id of SYSTEM_SYMBOL_IDS) {
      symbolsRoot[id] = colorNode(
        oklchToCssString(SYSTEM_SYMBOL_COLORS[id]),
        null,
      );
    }
    if (Object.keys(symbolsRoot).length > 0) {
      colorRoot.symbols = symbolsRoot;
    }

    const attributesRoot: Record<string, unknown> = {};
    for (const id of activeAttributeIds) {
      const attr = ir.attributes[id];
      if (!attr) continue;
      let valueColor;
      let alias: string | null = null;
      if (attr.kind === 'primitive') {
        if (!ir.primitives[attr.primitive]) continue;
        valueColor = ir.primitives[attr.primitive].scale[attr.shade];
        alias = primitivePath(attr.primitive, attr.shade);
      } else {
        valueColor = SYSTEM_SYMBOL_COLORS[attr.name];
        alias = symbolPath(attr.name);
      }
      attributesRoot[id] = colorNode(oklchToCssString(valueColor), alias);
    }
    if (Object.keys(attributesRoot).length > 0) {
      colorRoot.attributes = attributesRoot;
    }

    if (activeSlotIds.length > 0) {
      const slotsRoot = ensureObject(colorRoot, ['slots']);
      for (const slotId of activeSlotIds) {
        const slot = ir.slots[slotId];
        const slotGroup = ensureObject(slotsRoot, slotId.split('.'));
        const defaultColor = resolveSlotStateColor(ir, slotId, 'default');
        if (defaultColor) {
          slotGroup.default = colorNode(
            oklchToCssString(defaultColor),
            slotDefaultAliasPath(ir, slotId),
          );
        }
        if (!slot) continue;
        for (const [state, override] of Object.entries(slot.states)) {
          if (!override) continue;
          const color = resolveSlotStateColor(ir, slotId, state as never);
          if (!color) continue;
          slotGroup[state] = colorNode(
            oklchToCssString(color),
            refAliasPath(ir, override),
          );
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
