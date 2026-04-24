import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { oklchToHex } from '../../../color/oklch';
import { hueFamily } from '../../../color/primitive-ops';
import {
  countPrimitiveSlotReferences,
  resolveSymbolColor,
} from '../../../ir/selectors';
import type {
  ColorRef,
  IR,
  OKLCH,
  PrimitiveId,
  PrimitiveScale,
  ShadeIndex,
  SymbolId,
} from '../../../ir/types';
import { useActiveSymbolIds } from '../../../store/hooks';
import { FineTune } from './FineTune';
import { MyPrimitive } from './MyPrimitive';
import { OtherPrimitives } from './OtherPrimitives';
import { collectRows } from './recommenders';
import { Sea } from './Sea';
import { findSameFamilyPrimitives } from './utils';

export type ColorExplorerProps = {
  /**
   * 추천을 구성할 때 role 축으로 사용하는 키. symbolId(primary/error/...) 또는
   * attributeId(background/text/border/...). Recommender들은 이 값을 보고
   * row를 생성한다.
   */
  seaKey: string;
  value: OKLCH | null;
  onChange: (color: OKLCH) => void;
  /** 현재 target이 보유한 ColorRef. primitive 참조면 MyPrimitive 섹션이 뜨고,
   *  symbol 참조면 그 사실만 표시. null이면 아무것도 안 뜸. */
  assignment: ColorRef | null;
  primitives: Record<PrimitiveId, PrimitiveScale>;
  usedShadesByPrimitive: Record<PrimitiveId, ShadeIndex[]>;
  onSelectShade: (shade: ShadeIndex) => void;
  onSelectPrimitive: (primitiveId: PrimitiveId, shade: ShadeIndex) => void;
  /** Symbol 참조 바인딩. 넘기지 않으면 "Use a symbol" 섹션이 숨겨진다. */
  onSelectSymbol?: (symbolId: SymbolId) => void;
  ir: IR;
};

export function ColorExplorer({
  seaKey,
  value,
  onChange,
  assignment,
  primitives,
  usedShadesByPrimitive,
  onSelectShade,
  onSelectPrimitive,
  onSelectSymbol,
  ir,
}: ColorExplorerProps) {
  const { t } = useTranslation('explorer');

  const rows = useMemo(
    () => collectRows({ role: seaKey, value, assignment, ir }),
    [seaKey, value, assignment, ir],
  );

  const primitiveRef =
    assignment && assignment.kind === 'primitive' ? assignment : null;
  const symbolRef =
    assignment && assignment.kind === 'symbol' ? assignment : null;

  const myPrimitive = primitiveRef ? primitives[primitiveRef.primitive] : null;
  const family = myPrimitive ? hueFamily(myPrimitive.anchor) : null;

  const otherItems = useMemo(() => {
    if (!myPrimitive) return [];
    const others = findSameFamilyPrimitives(
      primitives,
      myPrimitive.id,
      myPrimitive,
    );
    return others.map((p) => ({
      primitive: p,
      slotCount: countPrimitiveSlotReferences(ir, p.id),
    }));
  }, [myPrimitive, primitives, ir]);

  const activeSymbolIds = useActiveSymbolIds();
  const definedSymbols = useMemo(
    () =>
      activeSymbolIds
        .filter((id) => ir.symbols[id] != null)
        .map((id) => ({
          id,
          color: resolveSymbolColor(ir, id),
        })),
    [activeSymbolIds, ir],
  );

  return (
    <div className="space-y-3">
      {myPrimitive && primitiveRef && (
        <>
          <MyPrimitive
            primitive={myPrimitive}
            selectedShade={primitiveRef.shade}
            usedShades={usedShadesByPrimitive[myPrimitive.id] ?? []}
            onSelectShade={onSelectShade}
          />
          {otherItems.length > 0 && family && (
            <OtherPrimitives
              familyLabel={family}
              items={otherItems}
              onSelect={(primitiveId) => {
                const p = primitives[primitiveId];
                if (!p) return;
                onSelectPrimitive(primitiveId, p.anchorShade);
              }}
            />
          )}
        </>
      )}

      {symbolRef && (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
            {t('referencesSymbol')}
          </div>
          <div className="font-mono text-sm text-stone-900 mt-0.5">
            {symbolRef.symbol}
          </div>
        </div>
      )}

      {onSelectSymbol && (
        <UseASymbol
          symbols={definedSymbols}
          activeSymbol={symbolRef?.symbol ?? null}
          onSelect={onSelectSymbol}
        />
      )}

      {rows.length > 0 && (
        <div>
          {!assignment && (
            <>
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-[11px] uppercase tracking-[0.15em] text-stone-600 font-mono">
                  {t('suggested')}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 italic mb-3">
                {t('suggestedHint')}
              </div>
            </>
          )}
          <Sea rows={rows} value={value} onPick={onChange} />
        </div>
      )}

      <FineTune value={value} onChange={onChange} />
    </div>
  );
}

type UseASymbolProps = {
  symbols: Array<{ id: SymbolId; color: OKLCH | null }>;
  activeSymbol: SymbolId | null;
  onSelect: (symbolId: SymbolId) => void;
};

function UseASymbol({ symbols, activeSymbol, onSelect }: UseASymbolProps) {
  const { t } = useTranslation('explorer');
  return (
    <div>
      {symbols.length === 0 ? (
        <div className="text-[11px] text-stone-500 italic px-1">
          {t('noSymbols')}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {symbols.map(({ id, color }) => {
            const hex = color ? oklchToHex(color.L, color.C, color.H) : '#e7e5e4';
            const active = id === activeSymbol;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={[
                  'inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-mono transition',
                  active
                    ? 'border-stone-900 bg-stone-900 text-cream'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-500',
                ].join(' ')}
              >
                <span
                  className="inline-block w-3.5 h-3.5 rounded-sm ring-1 ring-stone-300"
                  style={{ backgroundColor: hex }}
                />
                {id}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

