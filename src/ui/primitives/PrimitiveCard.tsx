import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  listPrimitiveReferences,
  shadeUsage,
  type PrimitiveReferenceLocation,
} from '../../color/atlas-ops';
import { oklchToCssString, oklchToHex } from '../../color/oklch';
import {
  SHADE_INDICES,
  type PrimitiveScale,
  type ShadeIndex,
} from '../../ir/types';
import { useActiveComponentDefs } from '../../store/hooks';
import { usePosaStore } from '../../store/posa-store';
import { useCopyHex } from '../shared/toast';

type Props = {
  primitive: PrimitiveScale;
  /** 화면 표시용 effective 사용처 수 (상속 체인 resolve 결과 합). */
  refCount: number;
  isOrphan: boolean;
};

export function PrimitiveCard({
  primitive,
  refCount,
  isOrphan,
}: Props) {
  const ir = usePosaStore((s) => s.ir);
  const atlasSelection = usePosaStore((s) => s.atlasSelection);
  const selectAtlasShade = usePosaStore((s) => s.selectAtlasShade);
  const moveAtlasSelection = usePosaStore((s) => s.moveAtlasSelection);
  const rebindPrimitiveShade = usePosaStore((s) => s.rebindPrimitiveShade);
  const components = useActiveComponentDefs();
  const copyHex = useCopyHex();
  const [expanded, setExpanded] = useState(false);
  // draggingShade가 null이 아니면 현재 pointer가 눌린 상태(드래그 이동 중).
  // selection은 store가 보유하지만, drag 제스처 수명은 pointerdown~pointerup으로 짧아
  // 컴포넌트 로컬로 두는 게 cleanup이 깔끔하다.
  const [draggingShade, setDraggingShade] = useState<ShadeIndex | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const { t } = useTranslation('primitives');

  const refs = useMemo(
    () => listPrimitiveReferences(ir, primitive.id),
    [ir, primitive.id],
  );
  const refGroups = useMemo(() => groupRefs(refs), [refs]);
  const usage = useMemo(
    () => shadeUsage(ir, components, primitive.id),
    [ir, components, primitive.id],
  );

  const isSelectedThisCard =
    atlasSelection !== null && atlasSelection.primitiveId === primitive.id;
  const isDragging = draggingShade !== null;

  const handleShadePointerDown = (
    e: ReactPointerEvent<HTMLSpanElement>,
    shade: ShadeIndex,
  ) => {
    if (e.button !== 0) return;
    if ((usage[shade] ?? 0) === 0) return;
    e.preventDefault();
    // 바깥 document listener가 이 클릭을 "빈 공간"으로 오인해 해제하지 않도록.
    e.stopPropagation();
    selectAtlasShade(primitive.id, shade);
    setDraggingShade(shade);
    setPointerPos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (draggingShade == null) return;
    const primitiveId = primitive.id;

    const onMove = (e: PointerEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY });
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const cell = target?.closest<HTMLElement>('[data-atlas-shade]');
      if (!cell) return;
      if (cell.getAttribute('data-atlas-primitive') !== primitiveId) return;
      const raw = cell.getAttribute('data-atlas-shade');
      if (!raw) return;
      const nextShade = Number(raw) as ShadeIndex;
      const currentShade = usePosaStore.getState().atlasSelection?.shade;
      if (currentShade == null || nextShade === currentShade) return;
      rebindPrimitiveShade(primitiveId, currentShade, nextShade);
      moveAtlasSelection(nextShade);
    };
    const onUp = () => {
      setDraggingShade(null);
      setPointerPos(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [draggingShade, primitive.id, rebindPrimitiveShade, moveAtlasSelection]);

  return (
    <div
      className={[
        'rounded-lg border border-stone-200 bg-white/80 p-4 space-y-3 transition',
        isOrphan ? 'opacity-60' : '',
      ].join(' ')}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-stone-900">
              {primitive.id}
            </span>
            {isOrphan && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                {t('card.orphan')}
              </span>
            )}
          </div>
          <div className="text-xs text-stone-500 mt-0.5 font-mono tabular-nums">
            {t('card.anchorAtShade', { shade: primitive.anchorShade })} ·{' '}
            {oklchToCssString(primitive.anchor)}
          </div>
        </div>
        <span className="flex-none text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-stone-100 text-stone-600">
          {t('card.usedIn')} {t('card.placeCount', { count: refCount })}
        </span>
      </header>

      <div>
        <div className="flex rounded overflow-hidden ring-1 ring-stone-200">
          {SHADE_INDICES.map((shade) => {
            const c = primitive.scale[shade];
            const hex = oklchToHex(c.L, c.C, c.H);
            const isAnchor = shade === primitive.anchorShade;
            const isSelected =
              isSelectedThisCard && atlasSelection?.shade === shade;
            return (
              <button
                key={shade}
                type="button"
                data-atlas-primitive={primitive.id}
                data-atlas-shade={shade}
                onClick={() => copyHex(hex)}
                className="flex-1 h-7 relative cursor-copy focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900"
                style={{ backgroundColor: hex }}
                title={`${shade} · ${hex} · ${usage[shade] ?? 0}x`}
                aria-label={`${primitive.id} ${shade} ${hex}`}
              >
                {isAnchor && (
                  <span
                    className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-stone-900/70"
                    aria-label={t('card.anchor')}
                  />
                )}
                {isSelected && (
                  <span className="absolute inset-0 pointer-events-none ring-2 ring-inset ring-white" />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex text-[10px] font-mono text-stone-400 tabular-nums mt-1">
          {SHADE_INDICES.map((shade) => {
            const count = usage[shade] ?? 0;
            const isSelected =
              isSelectedThisCard && atlasSelection?.shade === shade;
            return (
              <span
                key={shade}
                data-atlas-primitive={primitive.id}
                data-atlas-shade={shade}
                onPointerDown={
                  count > 0
                    ? (e) => handleShadePointerDown(e, shade)
                    : undefined
                }
                className={[
                  'flex-1 flex items-center justify-center h-5 select-none',
                  count > 0 ? (isDragging && isSelected ? 'cursor-grabbing' : 'cursor-pointer') : '',
                ].join(' ')}
              >
                {count > 0 ? (
                  isSelected ? (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-stone-900 text-cream text-[10px] font-mono">
                      {count}
                    </span>
                  ) : (
                    <span>{count}</span>
                  )
                ) : null}
              </span>
            );
          })}
        </div>
      </div>

      {isDragging && isSelectedThisCard && pointerPos && atlasSelection &&
        createPortal(
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: pointerPos.x + 14,
              top: pointerPos.y + 14,
            }}
          >
            <div className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-stone-900 text-cream text-[11px] font-mono shadow-lg ring-2 ring-white">
              {usage[atlasSelection.shade] ?? 0}
            </div>
          </div>,
          document.body,
        )}

      {refCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-stone-600 hover:text-stone-900 underline underline-offset-2"
        >
          {expanded ? t('card.hideReferences') : t('card.showReferences')}
        </button>
      )}

      {expanded && (
        <div className="text-xs font-mono space-y-1.5 pt-2 border-t border-stone-100">
          {refGroups.symbols.length > 0 && (
            <div>
              <span className="text-stone-400">{t('card.refSymbols')} </span>
              <span className="text-stone-800">
                {refGroups.symbols.join(', ')}
              </span>
            </div>
          )}
          {refGroups.attributes.length > 0 && (
            <div>
              <span className="text-stone-400">{t('card.refAttributes')} </span>
              <span className="text-stone-800">
                {refGroups.attributes.join(', ')}
              </span>
            </div>
          )}
          {refGroups.slots.length > 0 && (
            <div>
              <span className="text-stone-400">{t('card.refSlots')} </span>
              <span className="text-stone-800">
                {refGroups.slots.join(', ')}
              </span>
            </div>
          )}
          {refGroups.slotStates.length > 0 && (
            <div>
              <span className="text-stone-400">{t('card.refSlotStates')} </span>
              <span className="text-stone-800">
                {refGroups.slotStates.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function groupRefs(refs: PrimitiveReferenceLocation[]) {
  const symbols: string[] = [];
  const attributes: string[] = [];
  const slots: string[] = [];
  const slotStates: string[] = [];
  for (const r of refs) {
    if (r.kind === 'symbol') symbols.push(r.symbolId);
    else if (r.kind === 'attribute') attributes.push(r.attributeId);
    else if (r.kind === 'slot') slots.push(r.slotId);
    else slotStates.push(`${r.slotId} (${r.state})`);
  }
  return { symbols, attributes, slots, slotStates };
}
