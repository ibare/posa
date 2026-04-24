import { useMemo, useState } from 'react';
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
  SYSTEM_SYMBOL_COLORS,
  SYSTEM_SYMBOL_IDS,
  type SystemSymbolId,
} from '../../ir/types';
import {
  useActiveAttributeDefs,
  useActiveComponentDefs,
  useActiveSymbolDefs,
} from '../../store/hooks';
import { usePosaStore } from '../../store/posa-store';
import { InspectorBody } from '../shared/InspectorBody';
import { InspectorPopover } from '../shared/InspectorPopover';
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
      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">
          {t('z0.symbols')}
        </div>
        <div className="text-xs text-stone-500 mb-3">
          {t('z0.symbolsHint')}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
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
          {SYSTEM_SYMBOL_IDS.map((id) => (
            <SystemSymbolChip key={id} id={id} />
          ))}
        </div>
      </section>

      {activeAttributes.length > 0 && (
        <section>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">
            {t('z0.attributes')}
          </div>
          <div className="text-xs text-stone-500 mb-3">
            {t('z0.attributesHint')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
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
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  return (
    <div>
      <button
        ref={setAnchorEl}
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
      <InspectorPopover anchor={anchorEl} open={focused}>
        <InspectorBody />
      </InspectorPopover>
    </div>
  );
}

function SystemSymbolChip({ id }: { id: SystemSymbolId }) {
  const color = SYSTEM_SYMBOL_COLORS[id];
  const hex = oklchToHex(color.L, color.C, color.H);
  const { t } = useTranslation('catalog');
  return (
    <div
      className="rounded-lg border border-stone-200 overflow-hidden opacity-90"
      title={t(`symbols.${id}.description`)}
    >
      <div
        className="h-20 border-b"
        style={{ backgroundColor: hex, borderBottomColor: '#f0f0f0' }}
      />
      <div className="px-3 py-2 bg-white">
        <div className="font-mono text-sm text-stone-900">{id}</div>
        <div className="text-[11px] text-stone-500 leading-snug">
          {t(`symbols.${id}.description`)}
        </div>
      </div>
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
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  return (
    <div>
      <div
        ref={setAnchorEl}
        className={[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/80 border transition-all duration-150 cursor-pointer md:h-[76px]',
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
          <div className="font-mono text-sm text-stone-900 truncate">
            {tCat(`attributes.${attr.id}.label`)}
          </div>
          <div className="hidden md:block mt-0.5">
            <div className="text-xs text-stone-500 leading-snug line-clamp-2">
              {isMultiMode
                ? `${t('z0.directColor', { count: directChildColors.length })} ${t('z0.acrossSlots')}`
                : tCat(`attributes.${attr.id}.description`)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDescend();
          }}
          className="flex-none inline-flex items-center gap-1 text-xs font-mono text-stone-600 px-1.5 py-1 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
          title={t('z0.descendToSlot')}
          aria-label={`${slotCount} ${t('z0.slotsLabel')}`}
        >
          <span className="tabular-nums">{slotCount}</span>
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
      <InspectorPopover anchor={anchorEl} open={showInspector}>
        <InspectorBody />
      </InspectorPopover>
    </div>
  );
}
