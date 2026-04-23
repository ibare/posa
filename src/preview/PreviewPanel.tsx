import { useMemo, type MouseEvent, type ReactNode } from 'react';
import {
  COMPONENT_DEFINITIONS,
  findComponentBySlotId,
} from '../catalog/components';
import {
  SYMBOL_IDS,
  type AttributeId,
  type ComponentId,
  type IR,
  type SlotId,
  type StateId,
  type SymbolId,
} from '../ir/types';
import { usePosaStore, type Layer } from '../store/posa-store';
import { PosaPreviewRoot } from './PosaPreviewRoot';
import { StateGroup } from './StateGroup';
import {
  BadgeShape,
  ButtonShape,
  CardShape,
  InputShape,
  ToastShape,
  type BadgeVariant,
  type ButtonVariant,
  type ToastVariant,
} from './shapes';

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'error'];
const BADGE_VARIANTS: BadgeVariant[] = ['secondary', 'error'];
const TOAST_VARIANTS: ToastVariant[] = ['error', 'warning', 'success'];

type ComponentScope = {
  /** null이면 카탈로그의 모든 variant, []면 variant는 렌더하지 않음. */
  variants: string[] | null;
  /** 기본형(`{comp}.{attr}`) shape를 이 컴포넌트 섹션에 포함할지. */
  includeBase: boolean;
  states: StateId[];
};

type PreviewScope = Map<ComponentId, ComponentScope>;

function variantOf(slotId: SlotId): string | null {
  const parts = slotId.split('.');
  return parts.length === 3 ? parts[1] : null;
}

const DEFAULT_ONLY: StateId[] = ['default'];

function fullScope(states: StateId[]): PreviewScope {
  const m: PreviewScope = new Map();
  for (const c of COMPONENT_DEFINITIONS) {
    m.set(c.id, { variants: null, includeBase: true, states });
  }
  return m;
}

function scopeFromAttribute(
  attrId: AttributeId,
  states: StateId[],
): PreviewScope {
  const m: PreviewScope = new Map();
  for (const c of COMPONENT_DEFINITIONS) {
    if (c.attributes.includes(attrId)) {
      m.set(c.id, { variants: null, includeBase: true, states });
    }
  }
  return m;
}

function scopeFromSlot(
  slotId: SlotId,
  states: StateId[],
): PreviewScope {
  const comp = findComponentBySlotId(slotId);
  if (!comp) return new Map();
  const variant = variantOf(slotId);
  const m: PreviewScope = new Map();
  // 기본형 slot focus면 기본형만, variant slot이면 해당 variant만.
  m.set(comp.id, {
    variants: variant ? [variant] : [],
    includeBase: variant == null,
    states,
  });
  return m;
}

/**
 * Z 레이어 + 선택/포커스 상태를 컴포넌트·variant·state 필터로 환산.
 *   상태 축은 Z2에서만 의미가 있으므로 Z0/Z1은 항상 'default'만 그린다.
 *   Z0 attr 포커스 → 그 attribute를 선언한 컴포넌트만.
 *   Z0 sym 포커스 / 미포커스 → 전체 (symbol은 컴포넌트와 직접 결합되지 않음).
 *   Z1 (attribute 선택됨) → 그 attribute를 선언한 컴포넌트만.
 *     slot 포커스가 있으면 그 slot의 컴포넌트·variant 하나로 더 좁힘.
 *   Z2 (slot 선택됨) → 그 slot의 컴포넌트·variant 하나만, 모든 state.
 *     state 포커스가 있으면 해당 state 1개로 좁힘.
 */
function derivePreviewScope(
  layer: Layer,
  selectedAttributeId: AttributeId | null,
  selectedSlotId: SlotId | null,
  focusedNode: string | null,
): PreviewScope {
  if (layer === 'z2' && selectedSlotId) {
    const comp = findComponentBySlotId(selectedSlotId);
    if (!comp) return new Map();
    let states = comp.states;
    if (focusedNode?.startsWith('state:')) {
      const s = focusedNode.slice('state:'.length) as StateId;
      if (comp.states.includes(s)) states = [s];
    }
    return scopeFromSlot(selectedSlotId, states);
  }

  if (layer === 'z1' && selectedAttributeId) {
    if (focusedNode?.startsWith('slot:')) {
      const slotId = focusedNode.slice('slot:'.length);
      return scopeFromSlot(slotId, DEFAULT_ONLY);
    }
    return scopeFromAttribute(selectedAttributeId, DEFAULT_ONLY);
  }

  if (layer === 'z0' && focusedNode?.startsWith('attr:')) {
    const attrId = focusedNode.slice('attr:'.length) as AttributeId;
    return scopeFromAttribute(attrId, DEFAULT_ONLY);
  }

  return fullScope(DEFAULT_ONLY);
}

function intersectVariants<V extends string>(
  available: V[],
  scope: ComponentScope | undefined,
): V[] {
  if (!scope) return [];
  if (!scope.variants) return available;
  const allowed = new Set(scope.variants);
  return available.filter((v) => allowed.has(v));
}

const SYMBOL_ID_SET: Set<string> = new Set(SYMBOL_IDS);

/**
 * Z* 스테이지에서 비활성으로 숨겨지는 symbol-named variant는 프리뷰도 숨긴다.
 * (스테이지가 진실의 출처. 프리뷰는 그 결과를 보여줄 뿐.)
 */
function filterActiveVariants<V extends string>(
  variants: V[],
  ir: IR,
): V[] {
  return variants.filter((v) => {
    if (!SYMBOL_ID_SET.has(v)) return true;
    return ir.symbols[v as SymbolId] != null;
  });
}

/**
 * 현재 IR과 선택 컨텍스트에 맞는 shape만 렌더하는 sticky 프리뷰.
 * 각 shape는 그대로 모든 state를 정적으로 보여준다 (interaction 없음).
 */
export function PreviewPanel() {
  const ir = usePosaStore((s) => s.ir);
  const layer = usePosaStore((s) => s.layer);
  const selectedAttributeId = usePosaStore((s) => s.selectedAttributeId);
  const selectedSlotId = usePosaStore((s) => s.selectedSlotId);
  const selectedComponentId = usePosaStore((s) => s.selectedComponentId);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const selectComponent = usePosaStore((s) => s.selectComponent);
  const clearSelectedComponent = usePosaStore(
    (s) => s.clearSelectedComponent,
  );

  const scope = useMemo(
    () =>
      derivePreviewScope(
        layer,
        selectedAttributeId,
        selectedSlotId,
        focusedNode,
      ),
    [layer, selectedAttributeId, selectedSlotId, focusedNode],
  );

  // ZX 진입 클릭은 z2(상태 descent)에서는 비활성 — 현재 slot의 상태를 보는 중이므로.
  const canSelectComponent = layer !== 'z2';

  const buttonScope = scope.get('button');
  const inputScope = scope.get('input');
  const cardScope = scope.get('card');
  const badgeScope = scope.get('badge');
  const toastScope = scope.get('toast');

  const visibleButtonVariants = filterActiveVariants(
    intersectVariants(BUTTON_VARIANTS, buttonScope),
    ir,
  );
  const visibleBadgeVariants = filterActiveVariants(
    intersectVariants(BADGE_VARIANTS, badgeScope),
    ir,
  );
  const visibleToastVariants = filterActiveVariants(
    intersectVariants(TOAST_VARIANTS, toastScope),
    ir,
  );

  const hasButton = Boolean(
    buttonScope &&
      (buttonScope.includeBase || visibleButtonVariants.length > 0),
  );
  const hasBadge = Boolean(
    badgeScope &&
      (badgeScope.includeBase || visibleBadgeVariants.length > 0),
  );
  const hasToast = Boolean(
    toastScope && (toastScope.includeBase || visibleToastVariants.length > 0),
  );

  const visibleCount =
    (hasButton ? 1 : 0) +
    (inputScope ? 1 : 0) +
    (cardScope ? 1 : 0) +
    (hasBadge ? 1 : 0) +
    (hasToast ? 1 : 0);
  const totalCount = COMPONENT_DEFINITIONS.length;

  return (
    <aside className="sticky top-20 flex h-[calc(100vh-6rem)] flex-col rounded-lg border border-stone-200 bg-white/70 backdrop-blur">
      <header className="border-b border-stone-200 px-4 py-2.5">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
          Live preview
        </div>
        <div className="text-sm font-medium text-stone-800">
          {visibleCount === totalCount
            ? `${totalCount} components`
            : `${visibleCount} of ${totalCount} components`}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {visibleCount === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
            No component declares this attribute yet.
          </div>
        ) : (
          <PosaPreviewRoot ir={ir} className="space-y-8">
            {hasButton && (
              <PreviewSection
                title="Button"
                componentId="button"
                selected={selectedComponentId === 'button'}
                canSelect={canSelectComponent}
                onSelect={selectComponent}
                onDeselect={clearSelectedComponent}
              >
                {buttonScope!.includeBase && (
                  <StateGroup label="BASE" states={buttonScope!.states}>
                    {(state) => <ButtonShape state={state} label="button" />}
                  </StateGroup>
                )}
                {visibleButtonVariants.map((v) => (
                  <StateGroup
                    key={v}
                    label={v.toUpperCase()}
                    states={buttonScope!.states}
                  >
                    {(state) => (
                      <ButtonShape variant={v} state={state} label={v} />
                    )}
                  </StateGroup>
                ))}
              </PreviewSection>
            )}

            {inputScope && (
              <PreviewSection
                title="Input"
                componentId="input"
                selected={selectedComponentId === 'input'}
                canSelect={canSelectComponent}
                onSelect={selectComponent}
                onDeselect={clearSelectedComponent}
              >
                <StateGroup label="INPUT" states={inputScope.states}>
                  {(state) => (
                    <InputShape
                      state={state}
                      value={state === 'default' ? undefined : 'Sample'}
                    />
                  )}
                </StateGroup>
              </PreviewSection>
            )}

            {cardScope && (
              <PreviewSection
                title="Card"
                componentId="card"
                selected={selectedComponentId === 'card'}
                canSelect={canSelectComponent}
                onSelect={selectComponent}
                onDeselect={clearSelectedComponent}
              >
                <CardShape />
              </PreviewSection>
            )}

            {hasBadge && (
              <PreviewSection
                title="Badge"
                componentId="badge"
                selected={selectedComponentId === 'badge'}
                canSelect={canSelectComponent}
                onSelect={selectComponent}
                onDeselect={clearSelectedComponent}
              >
                <div className="flex flex-wrap gap-3 items-start">
                  {badgeScope!.includeBase && (
                    <div className="flex flex-col items-start gap-2">
                      <BadgeShape label="badge" />
                      <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                        base
                      </div>
                    </div>
                  )}
                  {visibleBadgeVariants.map((v) => (
                    <div key={v} className="flex flex-col items-start gap-2">
                      <BadgeShape variant={v} label={v} />
                      <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {hasToast && (
              <PreviewSection
                title="Toast"
                componentId="toast"
                selected={selectedComponentId === 'toast'}
                canSelect={canSelectComponent}
                onSelect={selectComponent}
                onDeselect={clearSelectedComponent}
              >
                <div className="flex flex-col gap-3">
                  {toastScope!.includeBase && (
                    <div className="flex flex-col items-start gap-1">
                      <ToastShape title="Toast" />
                      <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                        base
                      </div>
                    </div>
                  )}
                  {visibleToastVariants.map((v) => (
                    <div key={v} className="flex flex-col items-start gap-1">
                      <ToastShape
                        variant={v}
                        title={`${v[0].toUpperCase()}${v.slice(1)} toast`}
                      />
                      <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}
          </PosaPreviewRoot>
        )}
      </div>
    </aside>
  );
}

function PreviewSection({
  title,
  componentId,
  selected,
  canSelect,
  onSelect,
  onDeselect,
  children,
}: {
  title: string;
  componentId: ComponentId;
  selected: boolean;
  canSelect: boolean;
  onSelect: (id: ComponentId) => void;
  onDeselect: () => void;
  children: ReactNode;
}) {
  const handleClick = () => {
    if (!canSelect) return;
    if (selected) onDeselect();
    else onSelect(componentId);
  };
  const handleDeselect = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDeselect();
  };

  return (
    <section
      onClick={canSelect ? handleClick : undefined}
      className={[
        'relative space-y-3 rounded-lg border p-3 transition',
        canSelect ? 'cursor-pointer' : '',
        selected
          ? 'border-stone-900 bg-stone-50 ring-2 ring-stone-900/10'
          : canSelect
            ? 'border-transparent hover:border-stone-300 hover:bg-stone-50/60'
            : 'border-transparent',
      ].join(' ')}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500">
          {title}
        </div>
        {selected && (
          <button
            type="button"
            onClick={handleDeselect}
            className="flex-none text-[10px] font-mono text-stone-500 hover:text-stone-900 px-1.5 py-0.5 rounded hover:bg-stone-200/60 transition"
            title="Exit ZX mode"
            aria-label="Exit ZX mode"
          >
            ×
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
