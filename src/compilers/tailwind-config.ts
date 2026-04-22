import { oklchToCssString } from '../color/oklch';
import { SHADE_INDICES, type IR } from '../ir/types';
import type { Compiler } from './types';

function toDashName(id: string): string {
  return id.replace(/\./g, '-');
}

/**
 * Tailwind 관행상 설정 키에 점이 들어가지 않도록 slot id는 dash로 변환한다.
 * Role은 그대로 쓴다 (이미 dash 형식).
 */
export const tailwindConfigCompiler: Compiler = {
  id: 'tailwind',
  label: 'Tailwind Config',
  description: 'tailwind.config.js colors 섹션',
  compile: (ir: IR) => {
    const primEntries = Object.values(ir.primitives).sort(
      (a, b) => a.createdAt - b.createdAt,
    );

    const lines: string[] = [];
    lines.push('/** posa가 생성한 Tailwind 색 토큰. 필요하면 extend에 그대로 병합. */');
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

    // Roles 는 CSS 변수를 참조하도록 내보낸다 — 실제 사용 시 CSS vars 컴파일러 결과와 함께 쓴다.
    const roleIds = Object.keys(ir.roles);
    for (const roleId of roleIds) {
      lines.push(`        '${roleId}': 'var(--${roleId})',`);
    }

    // Slot state overrides
    for (const [slotId, slot] of Object.entries(ir.slots)) {
      for (const state of Object.keys(slot.states)) {
        const override = slot.states[state];
        if (!override) continue;
        const key =
          state === 'default'
            ? toDashName(slotId)
            : `${toDashName(slotId)}-${state}`;
        lines.push(`        '${key}': 'var(--${key})',`);
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
