import { ATTRIBUTE_DEFINITIONS } from '../../catalog/attributes';
import { COMPONENT_GROUPS } from '../../catalog/components';
import { usePosaStore, type Layer } from '../../store/posa-store';

const LAYER_LABEL: Record<Layer, string> = {
  z0: 'Z0 · symbols & attributes',
  z1: 'Z1 · slots of attribute',
  z2: 'Z2 · states of slot',
};

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

  const attrLabel =
    ATTRIBUTE_DEFINITIONS.find((a) => a.id === selectedAttributeId)?.label ??
    selectedAttributeId;
  const groupLabel = selectedGroupId
    ? COMPONENT_GROUPS.find((g) => g.id === selectedGroupId)?.label ??
      selectedGroupId
    : null;

  // ZX 모드: 단일 컴포넌트 > 그룹 순으로 우선. 둘 다 Z2가 아닐 때만 활성.
  const inZxComponent = selectedComponentId != null && layer !== 'z2';
  const inZxGroup =
    !inZxComponent && selectedGroupId != null && layer !== 'z2';

  if (inZxComponent) {
    return (
      <div className="mx-auto max-w-5xl mb-6 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={clearSelectedComponent}
          className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-200/60 transition"
          title={selectedGroupId ? 'Back to group ZX' : 'Exit ZX · back to Z*'}
        >
          {selectedGroupId ? groupLabel : 'symbols & attributes'}
        </button>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
          ZX · component
        </span>
      </div>
    );
  }

  if (inZxGroup) {
    return (
      <div className="mx-auto max-w-5xl mb-6 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={clearSelectedGroup}
          className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-200/60 transition"
          title="Exit ZX group · back to Z*"
        >
          symbols & attributes
        </button>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
          ZX · group
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl mb-6 flex items-center gap-3 flex-wrap">
      {layer !== 'z0' && (
        <button
          type="button"
          onClick={() => jumpToLayer('z0')}
          className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-200/60 transition"
          title="Back to Z0"
        >
          symbols & attributes
        </button>
      )}

      {layer === 'z2' && selectedAttributeId && (
        <>
          <Divider />
          <button
            type="button"
            onClick={() => jumpToLayer('z1')}
            className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-200/60 transition"
            title="Back to Z1"
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
