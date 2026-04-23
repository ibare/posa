import { oklchToCssString } from '../color/oklch';
import { countPrimitiveReferences } from '../color/primitive-ops';
import {
  resolveAttributeColor,
  resolveSlotStateColor,
  resolveSymbolColor,
} from '../ir/selectors';
import {
  ATTRIBUTE_IDS,
  SHADE_INDICES,
  SYMBOL_IDS,
  type IR,
} from '../ir/types';
import type { Compiler } from './types';

function toDashName(id: string): string {
  return id.replace(/\./g, '-');
}

function primitiveVar(primId: string, shade: number): string {
  return `--${primId}-${shade}`;
}

export const cssVariablesCompiler: Compiler = {
  id: 'css-vars',
  label: 'CSS Variables',
  description: 'Design token CSS variables under :root',
  compile: (ir: IR) => {
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
    for (const id of SYMBOL_IDS) {
      const c = resolveSymbolColor(ir, id);
      if (!c) continue;
      symbolLines.push(`  --posa-symbol-${id}: ${oklchToCssString(c)};`);
    }
    if (symbolLines.length > 0) {
      lines.push('  /* Symbols */');
      lines.push(...symbolLines);
      lines.push('');
    }

    const attrLines: string[] = [];
    for (const id of ATTRIBUTE_IDS) {
      const c = resolveAttributeColor(ir, id);
      if (!c) continue;
      attrLines.push(`  --posa-attr-${id}: ${oklchToCssString(c)};`);
    }
    if (attrLines.length > 0) {
      lines.push('  /* Attributes */');
      lines.push(...attrLines);
      lines.push('');
    }

    const slotLines: string[] = [];
    for (const [slotId, slot] of Object.entries(ir.slots)) {
      const dash = toDashName(slotId);
      if (slot.ref) {
        const c = resolveSlotStateColor(ir, slotId, 'default');
        if (c) slotLines.push(`  --posa-slot-${dash}: ${oklchToCssString(c)};`);
      }
      for (const state of Object.keys(slot.states)) {
        const override = slot.states[state as keyof typeof slot.states];
        if (!override) continue;
        const c = resolveSlotStateColor(ir, slotId, state as never);
        if (c) {
          slotLines.push(
            `  --posa-slot-${dash}-${state}: ${oklchToCssString(c)};`,
          );
        }
      }
    }
    if (slotLines.length > 0) {
      lines.push('  /* Slot overrides */');
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
