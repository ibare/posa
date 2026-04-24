import { oklchToCssString } from '../color/oklch';
import { countPrimitiveReferences } from '../color/primitive-ops';
import {
  enumerateActiveSlotIds,
  getActiveAttributeIds,
  getAttributeFromSlotId,
} from '../ir/selectors';
import {
  SHADE_INDICES,
  SYSTEM_SYMBOL_COLORS,
  SYSTEM_SYMBOL_IDS,
  type ColorRef,
  type IR,
  type SlotId,
} from '../ir/types';
import type { Compiler } from './types';

function toDashName(id: string): string {
  return id.replace(/\./g, '-');
}

function primitiveVar(primId: string, shade: number): string {
  return `--${primId}-${shade}`;
}

function refToAlias(ir: IR, ref: ColorRef): string | null {
  if (ref.kind === 'primitive') {
    if (!ir.primitives[ref.primitive]) return null;
    return `var(${primitiveVar(ref.primitive, ref.shade)})`;
  }
  return `var(--symbol-${ref.symbol})`;
}

function slotDefaultAlias(ir: IR, slotId: SlotId): string | null {
  const slot = ir.slots[slotId];
  if (slot?.ref) return refToAlias(ir, slot.ref);
  const attrId = getAttributeFromSlotId(slotId);
  if (!ir.attributes[attrId]) return null;
  return `var(--attr-${attrId})`;
}

export const cssVariablesCompiler: Compiler = {
  id: 'css-vars',
  compile: ({ ir, components }) => {
    const activeAttributeIds = getActiveAttributeIds(components);
    const activeSlotIds = enumerateActiveSlotIds(components, ir);
    const lines: string[] = [':root {'];

    const primEntries = Object.values(ir.primitives).sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    if (primEntries.length > 0) {
      lines.push('  /* Primitive scales */');
      for (const p of primEntries) {
        const refs = countPrimitiveReferences(ir, p.id);
        const orphanTag = refs === 0 ? ' /* orphan */' : '';
        lines.push(`  /* ${p.id}${orphanTag} */`);
        for (const shade of SHADE_INDICES) {
          const c = p.scale[shade];
          const prefix = refs === 0 ? '/* ' : '';
          const suffix = refs === 0 ? ' */' : '';
          lines.push(
            `  ${prefix}${primitiveVar(p.id, shade)}: ${oklchToCssString(c)};${suffix}`,
          );
        }
        lines.push('');
      }
    }

    const symbolLines: string[] = [];
    for (const [id, sym] of Object.entries(ir.symbols)) {
      if (!sym) continue;
      if (sym.kind === 'primitive') {
        if (!ir.primitives[sym.primitive]) continue;
        symbolLines.push(
          `  --symbol-${id}: var(${primitiveVar(sym.primitive, sym.shade)});`,
        );
      } else {
        symbolLines.push(`  --symbol-${id}: ${oklchToCssString(sym.color)};`);
      }
    }
    for (const id of SYSTEM_SYMBOL_IDS) {
      symbolLines.push(
        `  --symbol-${id}: ${oklchToCssString(SYSTEM_SYMBOL_COLORS[id])};`,
      );
    }
    if (symbolLines.length > 0) {
      lines.push('  /* Symbols */');
      lines.push(...symbolLines);
      lines.push('');
    }

    const attrLines: string[] = [];
    for (const id of activeAttributeIds) {
      const attr = ir.attributes[id];
      if (!attr) continue;
      if (attr.kind === 'primitive') {
        if (!ir.primitives[attr.primitive]) continue;
        attrLines.push(
          `  --attr-${id}: var(${primitiveVar(attr.primitive, attr.shade)});`,
        );
      } else {
        attrLines.push(`  --attr-${id}: var(--symbol-${attr.name});`);
      }
    }
    if (attrLines.length > 0) {
      lines.push('  /* Attributes */');
      lines.push(...attrLines);
      lines.push('');
    }

    const slotLines: string[] = [];
    for (const slotId of activeSlotIds) {
      const dash = toDashName(slotId);
      const defaultAlias = slotDefaultAlias(ir, slotId);
      if (defaultAlias) {
        slotLines.push(`  --slot-${dash}: ${defaultAlias};`);
      }
      const slot = ir.slots[slotId];
      if (!slot) continue;
      for (const [state, override] of Object.entries(slot.states)) {
        if (!override) continue;
        const alias = refToAlias(ir, override);
        if (!alias) continue;
        slotLines.push(`  --slot-${dash}--${state}: ${alias};`);
      }
    }
    if (slotLines.length > 0) {
      lines.push('  /* Slots */');
      lines.push(...slotLines);
    }

    lines.push('}');
    lines.push('');

    return {
      filename: 'posa-tokens.css',
      content: lines.join('\n'),
      language: 'css',
    };
  },
};
