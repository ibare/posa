import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AttributeDefinition } from '../../catalog/attributes';
import type { SymbolDefinition } from '../../catalog/symbols';
import { oklchToHex } from '../../color/oklch';
import {
  enumerateActiveSlotIds,
  getAttributeFromSlotId,
  getDirectChildColorsForAttribute,
  resolveAttributeColor,
  resolveSymbolColor,
} from '../../ir/selectors';
import {
  useActiveAttributeDefs,
  useActiveComponentDefs,
  useActiveSymbolDefs,
} from '../../store/hooks';
import { usePosaStore } from '../../store/posa-store';
import { InspectorBody } from '../shared/InspectorBody';
import { Swatch, checkerboardStyle } from '../shared/Swatch';

/**
 * Z0 — 두 섹션 세로 배치.
 *   Symbols: 7개 칩. 클릭 시 inspector. Descend 개념 없음.
 *   Attributes: 7행. 행 클릭 시 inspector. "slots" 버튼으로 Z1 descent.
 */
export function Z0Plane() {
  const ir = usePosaStore((s) => s.ir);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const setFocus = usePosaStore((s) => s.setFocus);
  const descendToAttribute = usePosaStore((s) => s.descendToAttribute);
  const components = useActiveComponentDefs();
  const activeAttributes = useActiveAttributeDefs();
  const activeSymbols = useActiveSymbolDefs();
  const { t } = useTranslation('planes');

  const slotCountByAttribute = useMemo(() => {
    const m: Record<string, number> = {};
    for (const slotId of enumerateActiveSlotIds(components, ir)) {
      const attr = getAttributeFromSlotId(slotId);
      m[attr] = (m[attr] ?? 0) + 1;
    }
    return m;
  }, [components, ir]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {activeSymbols.length > 0 && (
        <section>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">
            {t('z0.symbols')}
          </div>
          <div className="text-xs text-stone-500 mb-3">
            {t('z0.symbolsHint')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeSymbols.map((sym) => (
              <SymbolChip
                key={sym.id}
                symbol={sym}
                focused={focusedNode === `sym:${sym.id}`}
                onFocusToggle={() =>
                  setFocus(
                    focusedNode === `sym:${sym.id}` ? null : `sym:${sym.id}`,
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {activeAttributes.length > 0 && (
        <section>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">
            {t('z0.attributes')}
          </div>
          <div className="text-xs text-stone-500 mb-3">
            {t('z0.attributesHint')}
          </div>
          <div className="flex flex-col gap-2">
            {activeAttributes.map((attr) => (
              <AttributeRow
                key={attr.id}
                attr={attr}
                slotCount={slotCountByAttribute[attr.id] ?? 0}
                focused={focusedNode === `attr:${attr.id}`}
                onFocusToggle={() =>
                  setFocus(
                    focusedNode === `attr:${attr.id}` ? null : `attr:${attr.id}`,
                  )
                }
                onDescend={() => descendToAttribute(attr.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

type SymbolChipProps = {
  symbol: SymbolDefinition;
  focused: boolean;
  onFocusToggle: () => void;
};

function SymbolChip({ symbol, focused, onFocusToggle }: SymbolChipProps) {
  const ir = usePosaStore((s) => s.ir);
  const color = resolveSymbolColor(ir, symbol.id);
  const hex = color ? oklchToHex(color.L, color.C, color.H) : null;
  const { t } = useTranslation('catalog');

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onFocusToggle}
        className={[
          'w-full text-left rounded-lg border transition-all duration-150 overflow-hidden',
          focused
            ? 'border-stone-900 -translate-y-px'
            : 'border-stone-200 hover:border-stone-400 hover:-translate-y-px',
        ].join(' ')}
      >
        <div
          className="h-20"
          style={hex ? { backgroundColor: hex } : checkerboardStyle(12)}
        />

        <div className="px-3 py-2 bg-white">
          <div className="font-mono text-sm text-stone-900">{symbol.id}</div>
          <div className="text-[11px] text-stone-500 leading-snug">
            {t(`symbols.${symbol.id}.description`)}
          </div>
        </div>
      </button>
      {focused && (
        <div className="absolute left-0 right-0 top-full mt-2 z-20 w-[26rem] max-h-[calc(100vh-10rem)] overflow-y-auto bg-white border border-stone-200 shadow-lg rounded-lg p-4">
          <InspectorBody />
        </div>
      )}
    </div>
  );
}

type AttributeRowProps = {
  attr: AttributeDefinition;
  slotCount: number;
  focused: boolean;
  onFocusToggle: () => void;
  onDescend: () => void;
};

function AttributeRow({
  attr,
  slotCount,
  focused,
  onFocusToggle,
  onDescend,
}: AttributeRowProps) {
  const ir = usePosaStore((s) => s.ir);
  const components = useActiveComponentDefs();
  const color = resolveAttributeColor(ir, attr.id);
  const { t } = useTranslation('planes');
  const { t: tCat } = useTranslation('catalog');
  const directChildColors = useMemo(
    () => getDirectChildColorsForAttribute(components, ir, attr.id),
    [components, ir, attr.id],
  );
  // 모드 2: 하위 slot 중 직접 색이 명시된 게 1개 이상.
  // 클릭 = 즉시 descend. swatch는 분할 표시.
  const isMultiMode = directChildColors.length > 0;

  const onRowClick = isMultiMode ? onDescend : onFocusToggle;
  const showInspector = focused && !isMultiMode;

  return (
    <div className="relative">
      <div
        className={[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/80 border transition-all duration-150 cursor-pointer',
          focused && !isMultiMode
            ? 'border-stone-900 -translate-y-px'
            : 'border-stone-200 hover:border-stone-400 hover:-translate-y-px',
        ].join(' ')}
        onClick={onRowClick}
      >
        {isMultiMode ? (
          <Swatch colors={directChildColors} size="md" />
        ) : (
          <Swatch color={color} size="md" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-stone-900">
              {tCat(`attributes.${attr.id}.label`)}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              {attr.id}
            </span>
          </div>
          <div className="text-xs text-stone-500 leading-snug mt-0.5">
            {isMultiMode
              ? `${t('z0.directColor', { count: directChildColors.length })} ${t('z0.acrossSlots')}`
              : tCat(`attributes.${attr.id}.description`)}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDescend();
          }}
          className="flex-none inline-flex items-center gap-2 text-xs font-mono text-stone-600 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
          title={t('z0.descendToSlot')}
        >
          <span className="tabular-nums">{slotCount}</span>
          <span className="text-stone-400">{t('z0.slotsLabel')}</span>
          <svg
            viewBox="0 0 12 12"
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="4,2 8,6 4,10" />
          </svg>
        </button>
      </div>
      {showInspector && (
        <div className="absolute left-0 right-0 top-full mt-2 z-20 max-w-[26rem] max-h-[calc(100vh-10rem)] overflow-y-auto bg-white border border-stone-200 shadow-lg rounded-lg p-4">
          <InspectorBody />
        </div>
      )}
    </div>
  );
}
