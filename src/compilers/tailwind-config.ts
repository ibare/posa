import {
  enumerateActiveSlotIds,
  getActiveAttributeIds,
} from '../ir/selectors';
import {
  SHADE_INDICES,
  SYSTEM_SYMBOL_IDS,
  type SymbolId,
} from '../ir/types';
import type { Compiler } from './types';

function toDashName(id: string): string {
  return id.replace(/\./g, '-');
}

/**
 * Tailwind config 내보내기. 모든 색은 posa-tokens.css가 정의한 CSS 변수 alias로
 * 렌더된다. 실제로는 css-variables compiler와 함께 사용한다.
 */
export const tailwindConfigCompiler: Compiler = {
  id: 'tailwind',
  compile: ({ ir, components }) => {
    const activeAttributeIds = getActiveAttributeIds(components);
    const activeSlotIds = enumerateActiveSlotIds(components, ir);
    const primEntries = Object.values(ir.primitives).sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    const lines: string[] = [];
    lines.push(
      '/** Posa-generated Tailwind color tokens. Merge under theme.extend. */',
    );
    lines.push('export default {');
    lines.push('  theme: {');
    lines.push('    extend: {');
    lines.push('      colors: {');

    for (const p of primEntries) {
      lines.push(`        '${p.id}': {`);
      for (const shade of SHADE_INDICES) {
        lines.push(`          '${shade}': 'var(--${p.id}-${shade})',`);
      }
      lines.push('        },');
    }

    for (const id of Object.keys(ir.symbols) as SymbolId[]) {
      if (!ir.symbols[id]) continue;
      lines.push(`        'symbol-${id}': 'var(--symbol-${id})',`);
    }
    for (const id of SYSTEM_SYMBOL_IDS) {
      lines.push(`        'symbol-${id}': 'var(--symbol-${id})',`);
    }

    for (const id of activeAttributeIds) {
      if (!ir.attributes[id]) continue;
      lines.push(`        'attr-${id}': 'var(--attr-${id})',`);
    }

    for (const slotId of activeSlotIds) {
      const dash = toDashName(slotId);
      lines.push(`        'slot-${dash}': 'var(--slot-${dash})',`);
      const slot = ir.slots[slotId];
      if (!slot) continue;
      for (const state of Object.keys(slot.states)) {
        if (!slot.states[state as keyof typeof slot.states]) continue;
        lines.push(
          `        'slot-${dash}-${state}': 'var(--slot-${dash}--${state})',`,
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
