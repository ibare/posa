import { useMemo } from 'react';
import { ATTRIBUTE_DEFINITIONS } from '../../catalog/attributes';
import {
  COMPONENT_DEFINITIONS,
  type ComponentDefinition,
} from '../../catalog/components';
import { SYMBOL_IDS, type AttributeId, type IR, type SymbolId } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { SlotCard } from '../shared/SlotCard';

const SYMBOL_ID_SET: Set<string> = new Set(SYMBOL_IDS);

const ATTR_LABEL: Record<string, string> = Object.fromEntries(
  ATTRIBUTE_DEFINITIONS.map((a) => [a.id, a.label]),
);

function visibleVariantsOf(component: ComponentDefinition, ir: IR) {
  const variants = component.variants ?? [];
  return variants.filter((v) => {
    if (!SYMBOL_ID_SET.has(v.id)) return true;
    return ir.symbols[v.id as SymbolId] != null;
  });
}

/**
 * 한 컴포넌트의 variant × attribute slot 그리드. ZXPlane 단일, ZXGroupPlane 반복용.
 * focus/setFocus는 상위에서 공유하는 단일 focus 슬롯을 받는다.
 */
export function ComponentSlotGrid({
  component,
  focusedNode,
  setFocus,
  ir,
}: {
  component: ComponentDefinition;
  focusedNode: string | null;
  setFocus: (nodeId: string | null) => void;
  ir: IR;
}) {
  const visibleVariants = visibleVariantsOf(component, ir);
  const hasVariants = (component.variants?.length ?? 0) > 0;

  if (!hasVariants) {
    return (
      <VariantSection
        title={null}
        mono={null}
        componentId={component.id}
        variantId={null}
        attributes={component.attributes}
        focusedNode={focusedNode}
        setFocus={setFocus}
      />
    );
  }
  if (visibleVariants.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-stone-500 border border-dashed border-stone-300 rounded-lg">
        No variants visible. Define the corresponding symbols in Z0 to expose{' '}
        <span className="font-mono">primary</span>,{' '}
        <span className="font-mono">secondary</span>, etc.
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {visibleVariants.map((variant) => (
        <VariantSection
          key={variant.id}
          title={variant.label}
          mono={variant.id}
          componentId={component.id}
          variantId={variant.id}
          attributes={component.attributes}
          focusedNode={focusedNode}
          setFocus={setFocus}
        />
      ))}
    </div>
  );
}

/**
 * ZX — Component mode.
 * 프리뷰에서 컴포넌트 하나를 선택하면 그 컴포넌트의 variant × attribute를
 * 한 화면에 쫙 펼친다. variant별 섹션, 섹션 내부는 attribute slot 카드 가로 나열.
 * Symbol 축은 두지 않는다 (slot 인스펙터의 ColorExplorer에서 참조).
 */
export function ZXPlane() {
  const selectedComponentId = usePosaStore((s) => s.selectedComponentId);
  const ir = usePosaStore((s) => s.ir);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const setFocus = usePosaStore((s) => s.setFocus);
  const clearSelectedComponent = usePosaStore(
    (s) => s.clearSelectedComponent,
  );

  const component = useMemo(
    () =>
      selectedComponentId
        ? COMPONENT_DEFINITIONS.find((c) => c.id === selectedComponentId) ??
          null
        : null,
    [selectedComponentId],
  );

  if (!component) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            ZX · component
          </div>
          <div className="font-mono text-lg text-stone-900">
            {component.label}
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            {component.description}
          </div>
        </div>
        <button
          type="button"
          onClick={clearSelectedComponent}
          className="flex-none text-xs font-mono text-stone-500 hover:text-stone-900 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 transition"
          title="Close ZX · back to Z*"
        >
          Close
        </button>
      </header>

      <ComponentSlotGrid
        component={component}
        focusedNode={focusedNode}
        setFocus={setFocus}
        ir={ir}
      />
    </div>
  );
}

function VariantSection({
  title,
  mono,
  componentId,
  variantId,
  attributes,
  focusedNode,
  setFocus,
}: {
  title: string | null;
  mono: string | null;
  componentId: string;
  variantId: string | null;
  attributes: AttributeId[];
  focusedNode: string | null;
  setFocus: (nodeId: string | null) => void;
}) {
  return (
    <section className="space-y-2">
      {title && (
        <div className="flex items-baseline gap-2 px-1">
          <span className="font-mono text-sm text-stone-900">{title}</span>
          {mono && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              {mono}
            </span>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {attributes.map((attr) => {
          const slotId = variantId
            ? `${componentId}.${variantId}.${attr}`
            : `${componentId}.${attr}`;
          const focusKey = `slot:${slotId}`;
          return (
            <div key={slotId} className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 pl-1">
                {ATTR_LABEL[attr] ?? attr}
              </div>
              <SlotCard
                slotId={slotId}
                focused={focusedNode === focusKey}
                onFocusToggle={() =>
                  setFocus(focusedNode === focusKey ? null : focusKey)
                }
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
