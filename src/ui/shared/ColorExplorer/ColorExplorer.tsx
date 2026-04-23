import { useMemo, useState } from 'react';
import { oklchToHex } from '../../../color/oklch';
import { hueFamily } from '../../../color/primitive-ops';
import {
  countPrimitiveSlotReferences,
  resolveSymbolColor,
} from '../../../ir/selectors';
import {
  SYMBOL_IDS,
  type ColorRef,
  type IR,
  type OKLCH,
  type PrimitiveId,
  type PrimitiveScale,
  type ShadeIndex,
  type SymbolId,
} from '../../../ir/types';
import { FineTune } from './FineTune';
import { MyPrimitive } from './MyPrimitive';
import { OtherPrimitives } from './OtherPrimitives';
import { Sea } from './Sea';
import { findSameFamilyPrimitives } from './utils';
import * as backgroundSea from './seas/background';
import * as errorSea from './seas/error';
import * as foregroundSea from './seas/foreground';
import * as genericSea from './seas/generic';
import * as primarySea from './seas/primary';
import type { SeaModule } from './seas/shared';
import * as warningSea from './seas/warning';

export type ColorExplorerProps = {
  /**
   * Sea 선택 키. symbolId(primary/error/warning/...) 혹은 attributeId
   * (background/text/border/...) 를 받는다. 매칭이 없으면 generic sea.
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

const SEA_REGISTRY: Record<string, SeaModule> = {
  // Symbol-inspired seas
  primary: primarySea,
  secondary: primarySea,
  accent: primarySea,
  info: primarySea,
  success: primarySea,
  warning: warningSea,
  error: errorSea,

  // Attribute-inspired seas
  background: backgroundSea,
  text: foregroundSea,
  placeholder: foregroundSea,
  border: genericSea,
  outline: primarySea,
  icon: foregroundSea,
  mark: primarySea,
};

function getSea(seaKey: string): SeaModule {
  return SEA_REGISTRY[seaKey] ?? genericSea;
}

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
  const [moreOpen, setMoreOpen] = useState(false);
  const [fineOpen, setFineOpen] = useState(false);

  const sea = getSea(seaKey);
  const tierA = useMemo(() => sea.tierA(), [sea]);
  const tierB = useMemo(() => sea.tierB(), [sea]);

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

  const definedSymbols = useMemo(
    () =>
      SYMBOL_IDS.filter((id) => ir.symbols[id] !== null).map((id) => ({
        id,
        color: resolveSymbolColor(ir, id),
      })),
    [ir],
  );

  const suggestedHeading = assignment
    ? 'Try a different direction'
    : 'Suggested';
  const suggestedHint = assignment
    ? 'A new primitive will be created if you pick outside this scale.'
    : 'Click a tile to commit.';

  const fineValue: OKLCH = value ?? { L: 0.58, C: 0.12, H: 220 };

  return (
    <div className="space-y-5">
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
          <div className="border-t border-stone-100" />
        </>
      )}

      {symbolRef && (
        <>
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-mono">
              Currently references symbol
            </div>
            <div className="font-mono text-sm text-stone-900 mt-0.5">
              {symbolRef.symbol}
            </div>
          </div>
          <div className="border-t border-stone-100" />
        </>
      )}

      {onSelectSymbol && (
        <>
          <UseASymbol
            symbols={definedSymbols}
            activeSymbol={symbolRef?.symbol ?? null}
            onSelect={onSelectSymbol}
          />
          <div className="border-t border-stone-100" />
        </>
      )}

      <div>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[11px] uppercase tracking-[0.15em] text-stone-600 font-mono">
            {suggestedHeading}
          </span>
        </div>
        <div className="text-[10px] text-stone-400 italic mb-3">
          {suggestedHint}
        </div>
        <Sea rows={tierA} value={value} onPick={onChange} />
      </div>

      <div className="border-t border-stone-100" />

      <Collapsible
        open={moreOpen}
        onToggle={() => setMoreOpen((v) => !v)}
        label="More options"
        sublabel="Less typical choices"
      >
        <Sea rows={tierB} value={value} onPick={onChange} />
      </Collapsible>

      <div className="border-t border-stone-100" />

      <Collapsible
        open={fineOpen}
        onToggle={() => setFineOpen((v) => !v)}
        label="Fine-tune"
        sublabel="Precision adjustment"
      >
        <FineTune value={fineValue} onChange={onChange} />
      </Collapsible>
    </div>
  );
}

type UseASymbolProps = {
  symbols: Array<{ id: SymbolId; color: OKLCH | null }>;
  activeSymbol: SymbolId | null;
  onSelect: (symbolId: SymbolId) => void;
};

function UseASymbol({ symbols, activeSymbol, onSelect }: UseASymbolProps) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.15em] text-stone-600 font-mono">
          Use a symbol
        </span>
        <span className="text-[10px] text-stone-400 italic">
          Reference a defined symbol instead of a raw color
        </span>
      </div>
      {symbols.length === 0 ? (
        <div className="text-[11px] text-stone-500 italic px-1">
          No symbols defined yet. Define one in Z0 to reference it here.
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

type CollapsibleProps = {
  open: boolean;
  onToggle: () => void;
  label: string;
  sublabel: string;
  children: React.ReactNode;
};

function Collapsible({
  open,
  onToggle,
  label,
  sublabel,
  children,
}: CollapsibleProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 hover:bg-stone-50 -mx-1 px-1 py-1.5 rounded transition"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] uppercase tracking-[0.15em] text-stone-600 font-mono">
            {label}
          </span>
          <span className="text-[10px] text-stone-400 italic">{sublabel}</span>
        </div>
        <svg
          viewBox="0 0 12 12"
          className={[
            'w-3 h-3 text-stone-500 transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3,4.5 6,8 9,4.5" />
        </svg>
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}
