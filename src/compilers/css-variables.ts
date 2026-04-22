import { oklchToCssString } from '../color/oklch';
import { countPrimitiveReferences } from '../color/primitive-ops';
import { SHADE_INDICES, type IR } from '../ir/types';
import type { Compiler } from './types';

/** slot id("button.primary.bg") → CSS 변수용 dash 이름. */
function toDashName(id: string): string {
  return id.replace(/\./g, '-');
}

function primitiveVar(primId: string, shade: number): string {
  return `--${primId}-${shade}`;
}

function roleVar(roleId: string): string {
  return `--${roleId}`;
}

function slotVar(slotId: string, state: string): string {
  const base = `--${toDashName(slotId)}`;
  return state === 'default' ? base : `${base}-${state}`;
}

export const cssVariablesCompiler: Compiler = {
  id: 'css-vars',
  label: 'CSS Variables',
  description: 'shadcn / Tailwind v4 호환 :root 변수',
  compile: (ir: IR) => {
    const lines: string[] = [':root {'];

    // 1. Primitive scales
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

    // 2. Semantic roles
    const roleEntries = Object.entries(ir.roles);
    if (roleEntries.length > 0) {
      lines.push('  /* Semantic roles */');
      for (const [roleId, assign] of roleEntries) {
        lines.push(
          `  ${roleVar(roleId)}: var(${primitiveVar(assign.primitive, assign.shade)});`,
        );
      }
      lines.push('');
    }

    // 3. Slot states
    const slotEntries = Object.entries(ir.slots).filter(
      ([, s]) => Object.keys(s.states).length > 0,
    );
    if (slotEntries.length > 0) {
      lines.push('  /* Component slots (state overrides) */');
      for (const [slotId, slot] of slotEntries) {
        for (const [state, override] of Object.entries(slot.states)) {
          if (!override) continue;
          lines.push(
            `  ${slotVar(slotId, state)}: var(${primitiveVar(override.primitive, override.shade)});`,
          );
        }
      }
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
