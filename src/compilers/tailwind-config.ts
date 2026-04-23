import { oklchToCssString } from '../color/oklch';
import {
  enumerateAllSlotIds,
  getActiveAttributeIds,
  getActiveSymbolIds,
} from '../ir/selectors';
import { SHADE_INDICES } from '../ir/types';
import type { Compiler } from './types';

function toDashName(id: string): string {
  return id.replace(/\./g, '-');
}

/**
 * Tailwind config 내보내기. Primitive scale은 palette로, symbol/attribute/slot은
 * CSS 변수 alias로 export. 실제로는 css-variables compiler와 함께 사용한다.
 */
export const tailwindConfigCompiler: Compiler = {
  id: 'tailwind',
  label: 'Tailwind Config',
  description: 'tailwind.config.js colors (pair with CSS variables)',
  compile: ({ ir, components }) => {
    const activeSymbolIds = getActiveSymbolIds(components);
    const activeAttributeIds = getActiveAttributeIds(components);
    const scopeSlotIds = new Set(enumerateAllSlotIds(components));
    const primEntries = Object.values(ir.primitives).sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    const lines: string[] = [];
    lines.push('/** Posa-generated Tailwind color tokens. Merge under theme.extend. */');
    lines.push('export default {');
    lines.push('  theme: {');
    lines.push('    extend: {');
    lines.push('      colors: {');

    for (const p of primEntries) {
      lines.push(`        '${p.id}': {`);
      for (const shade of SHADE_INDICES) {
        const c = p.scale[shade];
        lines.push(`          '${shade}': '${oklchToCssString(c)}',`);
      }
      lines.push('        },');
    }

    for (const id of activeSymbolIds) {
      if (!ir.symbols[id]) continue;
      lines.push(`        'symbol-${id}': 'var(--posa-symbol-${id})',`);
    }

    for (const id of activeAttributeIds) {
      if (!ir.attributes[id]) continue;
      lines.push(`        'attr-${id}': 'var(--posa-attr-${id})',`);
    }

    for (const [slotId, slot] of Object.entries(ir.slots)) {
      if (!scopeSlotIds.has(slotId)) continue;
      const dash = toDashName(slotId);
      if (slot.ref) {
        lines.push(`        'slot-${dash}': 'var(--posa-slot-${dash})',`);
      }
      for (const state of Object.keys(slot.states)) {
        if (!slot.states[state as keyof typeof slot.states]) continue;
        lines.push(
          `        'slot-${dash}-${state}': 'var(--posa-slot-${dash}-${state})',`,
        );
      }
    }

    lines.push('      },');
    lines.push('    },');
    lines.push('  },');
    lines.push('};');
    lines.push('');

    return {
      filename: 'posa-tailwind.js',
      content: lines.join('\n'),
      language: 'javascript',
    };
  },
};
