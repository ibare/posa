import { useMemo, useState } from 'react';
import { hueFamily } from '../../../color/primitive-ops';
import { countPrimitiveSlotReferences } from '../../../ir/selectors';
import type {
  IR,
  OKLCH,
  PrimitiveId,
  PrimitiveScale,
  RoleAssignment,
  ShadeIndex,
} from '../../../ir/types';
import { FineTune } from './FineTune';
import { MyPrimitive } from './MyPrimitive';
import { OtherPrimitives } from './OtherPrimitives';
import { Sea } from './Sea';
import { findSameFamilyPrimitives } from './utils';
import * as backgroundSea from './seas/background';
import * as destructiveSea from './seas/destructive';
import * as foregroundSea from './seas/foreground';
import * as genericSea from './seas/generic';
import * as primarySea from './seas/primary';
import type { SeaModule } from './seas/shared';
import * as warningSea from './seas/warning';

export type ColorExplorerProps = {
  roleId: string;
  value: OKLCH | null;
  onChange: (color: OKLCH) => void;
  assignment: RoleAssignment | null;
  primitives: Record<PrimitiveId, PrimitiveScale>;
  usedShadesByPrimitive: Record<PrimitiveId, ShadeIndex[]>;
  onSelectShade: (shade: ShadeIndex) => void;
  onSelectPrimitive: (primitiveId: PrimitiveId, shade: ShadeIndex) => void;
  /**
   * "Other {family}s you've used" 리스트에서 각 primitive의 slot 수를 표시할 때 사용.
   * 전달받지 않으면 IR에서 직접 계산해도 되지만, 호출자가 이미 IR을 갖고 있다면 넘겨도 된다.
   */
  ir?: IR;
};

const SEA_REGISTRY: Record<string, SeaModule> = {
  background: backgroundSea,
  card: backgroundSea,
  popover: backgroundSea,

  primary: primarySea,
  accent: primarySea,
  ring: primarySea,

  foreground: foregroundSea,
  'card-fg': foregroundSea,
  'popover-fg': foregroundSea,
  'primary-fg': foregroundSea,
  'accent-fg': foregroundSea,
  'destructive-fg': foregroundSea,
  'warning-fg': foregroundSea,
  'success-fg': foregroundSea,
  'info-fg': foregroundSea,

  warning: warningSea,
  destructive: destructiveSea,
};

function getSea(roleId: string): SeaModule {
  return SEA_REGISTRY[roleId] ?? genericSea;
}

export function ColorExplorer({
  roleId,
  value,
  onChange,
  assignment,
  primitives,
  usedShadesByPrimitive,
  onSelectShade,
  onSelectPrimitive,
  ir,
}: ColorExplorerProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [fineOpen, setFineOpen] = useState(false);

  const sea = getSea(roleId);
  const tierA = useMemo(() => sea.tierA(), [sea]);
  const tierB = useMemo(() => sea.tierB(), [sea]);

  const myPrimitive = assignment ? primitives[assignment.primitive] : null;
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
      slotCount: ir ? countPrimitiveSlotReferences(ir, p.id) : 0,
    }));
  }, [myPrimitive, primitives, ir]);

  const suggestedHeading = assignment
    ? 'Try a different direction'
    : 'Suggested';
  const suggestedHint = assignment
    ? 'A new primitive will be created if you pick outside this scale.'
    : 'Click a tile to commit.';

  const fineValue: OKLCH = value ?? { L: 0.58, C: 0.12, H: 220 };

  return (
    <div className="space-y-5">
      {myPrimitive && assignment && (
        <>
          <MyPrimitive
            primitive={myPrimitive}
            selectedShade={assignment.shade}
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
        aria-expanded={open}
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
          aria-hidden
        >
          <polyline points="3,4.5 6,8 9,4.5" />
        </svg>
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  );
}
