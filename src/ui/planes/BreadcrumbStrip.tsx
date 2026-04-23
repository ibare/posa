import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { oklchToHex } from '../../color/oklch';
import {
  getSlotsByAttribute,
  resolveAttributeColor,
  resolveSlotStateColor,
  resolveSymbolColor,
} from '../../ir/selectors';
import type { AttributeId, SlotId, SymbolId } from '../../ir/types';
import {
  useActiveAttributeDefs,
  useActiveComponentDefs,
  useActiveSymbolDefs,
  useAttributeLabel,
  useGroupLabel,
} from '../../store/hooks';
import { usePosaStore, type Layer } from '../../store/posa-store';

export function BreadcrumbStrip() {
  const layer = usePosaStore((s) => s.layer);
  const selectedAttributeId = usePosaStore((s) => s.selectedAttributeId);
  const selectedComponentId = usePosaStore((s) => s.selectedComponentId);
  const selectedGroupId = usePosaStore((s) => s.selectedGroupId);
  const jumpToLayer = usePosaStore((s) => s.jumpToLayer);
  const clearSelectedComponent = usePosaStore(
    (s) => s.clearSelectedComponent,
  );
  const clearSelectedGroup = usePosaStore((s) => s.clearSelectedGroup);
  const { t } = useTranslation('planes');

  const LAYER_LABEL: Record<Layer, string> = {
    z0: t('breadcrumb.z0'),
    z1: t('breadcrumb.z1'),
    z2: t('breadcrumb.z2'),
  };

  const attrLabel = useAttributeLabel(selectedAttributeId);
  const groupLabelRaw = useGroupLabel(selectedGroupId ?? '');
  const groupLabel = selectedGroupId ? groupLabelRaw : null;

  // ZX 모드: 단일 컴포넌트 > 그룹 순으로 우선. 둘 다 Z2가 아닐 때만 활성.
  const inZxComponent = selectedComponentId != null && layer !== 'z2';
  const inZxGroup =
    !inZxComponent && selectedGroupId != null && layer !== 'z2';

  if (inZxComponent) {
    return (
      <div className="mx-auto max-w-5xl mb-6 flex items-center gap-3 flex-wrap">
        <MiniZ0 onClick={clearSelectedComponent} />
        <button
          type="button"
          onClick={clearSelectedComponent}
          className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-200/60 transition"
          title={
            selectedGroupId
              ? t('breadcrumb.backToGroupZX')
              : t('breadcrumb.exitZX')
          }
        >
          {selectedGroupId ? groupLabel : t('breadcrumb.symbolsAttributes')}
        </button>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
          {t('breadcrumb.zxComponent')}
        </span>
      </div>
    );
  }

  if (inZxGroup) {
    return (
      <div className="mx-auto max-w-5xl mb-6 flex items-center gap-3 flex-wrap">
        <MiniZ0 onClick={clearSelectedGroup} />
        <button
          type="button"
          onClick={clearSelectedGroup}
          className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-200/60 transition"
          title={t('breadcrumb.exitZXGroup')}
        >
          {t('breadcrumb.symbolsAttributes')}
        </button>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
          {t('breadcrumb.zxGroup')}
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl mb-6 flex items-center gap-3 flex-wrap">
      {layer !== 'z0' && (
        <>
          <MiniZ0 onClick={() => jumpToLayer('z0')} />
          <button
            type="button"
            onClick={() => jumpToLayer('z0')}
            className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-200/60 transition"
            title={t('breadcrumb.backToZ0')}
          >
            {t('breadcrumb.symbolsAttributes')}
          </button>
        </>
      )}

      {layer === 'z2' && selectedAttributeId && (
        <>
          <Divider />
          <MiniZ1
            attrId={selectedAttributeId}
            onClick={() => jumpToLayer('z1')}
          />
          <button
            type="button"
            onClick={() => jumpToLayer('z1')}
            className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-200/60 transition"
            title={t('breadcrumb.backToZ1')}
          >
            {attrLabel}
          </button>
        </>
      )}

      <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
        {LAYER_LABEL[layer]}
      </span>
    </div>
  );
}

function Divider() {
  return <span className="text-stone-300">·</span>;
}

// ──────────────────────────────────────────────────────────────────────────
// MiniZ0 — symbols + attributes 을 두 행의 dot 그리드로. 실시간 색 반영.
// selectedAttributeId가 있으면 해당 attribute dot에 링 강조.
// ──────────────────────────────────────────────────────────────────────────

function MiniZ0({ onClick }: { onClick: () => void }) {
  const ir = usePosaStore((s) => s.ir);
  const selectedAttributeId = usePosaStore((s) => s.selectedAttributeId);
  const symbols = useActiveSymbolDefs();
  const attributes = useActiveAttributeDefs();
  const { t } = useTranslation('planes');

  const symbolDots = useMemo(
    () =>
      symbols.map((s) => ({
        id: s.id as SymbolId,
        color: resolveSymbolColor(ir, s.id),
      })),
    [symbols, ir],
  );
  const attributeDots = useMemo(
    () =>
      attributes.map((a) => ({
        id: a.id as AttributeId,
        color: resolveAttributeColor(ir, a.id),
      })),
    [attributes, ir],
  );

  if (symbols.length === 0 && attributes.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={t('breadcrumb.backToZ0')}
      className="flex flex-col gap-0.5 p-1 rounded border border-stone-200 bg-white/60 hover:border-stone-500 hover:-translate-y-px transition"
    >
      {symbolDots.length > 0 && (
        <div className="flex gap-0.5">
          {symbolDots.map((d) => (
            <Dot key={`sym:${d.id}`} color={d.color} focused={false} />
          ))}
        </div>
      )}
      {attributeDots.length > 0 && (
        <div className="flex gap-0.5">
          {attributeDots.map((d) => (
            <Dot
              key={`attr:${d.id}`}
              color={d.color}
              focused={d.id === selectedAttributeId}
            />
          ))}
        </div>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// MiniZ1 — selectedAttribute의 slot들을 가로 막대 stack으로.
// selectedSlotId에 해당 막대 링 강조.
// ──────────────────────────────────────────────────────────────────────────

function MiniZ1({
  attrId,
  onClick,
}: {
  attrId: AttributeId;
  onClick: () => void;
}) {
  const ir = usePosaStore((s) => s.ir);
  const selectedSlotId = usePosaStore((s) => s.selectedSlotId);
  const components = useActiveComponentDefs();
  const { t } = useTranslation('planes');

  const bars = useMemo(() => {
    const slotIds = getSlotsByAttribute(components, attrId, ir);
    return slotIds.map<{ id: SlotId; color: ReturnType<typeof oklchToHex> | null }>(
      (id) => {
        const c = resolveSlotStateColor(ir, id, 'default');
        return { id, color: c ? oklchToHex(c.L, c.C, c.H) : null };
      },
    );
  }, [components, attrId, ir]);

  if (bars.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      title={t('breadcrumb.backToZ1')}
      className="flex items-stretch gap-px p-1 rounded border border-stone-200 bg-white/60 hover:border-stone-500 hover:-translate-y-px transition h-[22px]"
    >
      {bars.map((b) => {
        const active = b.id === selectedSlotId;
        return (
          <span
            key={b.id}
            className={[
              'block w-1 rounded-[1px]',
              active ? 'outline outline-[1.5px] outline-stone-900' : '',
            ].join(' ')}
            style={{ backgroundColor: b.color ?? '#e7e5e4' }}
          />
        );
      })}
    </button>
  );
}

function Dot({ color, focused }: { color: { L: number; C: number; H: number } | null; focused: boolean }) {
  const hex = color ? oklchToHex(color.L, color.C, color.H) : null;
  return (
    <span
      className={[
        'block w-2 h-2 rounded-full',
        focused ? 'outline outline-[1.5px] outline-stone-900' : '',
      ].join(' ')}
      style={{ backgroundColor: hex ?? '#e7e5e4' }}
    />
  );
}
