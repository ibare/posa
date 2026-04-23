import { useMemo } from 'react';
import { COMPONENT_GROUPS } from '../../catalog/components';
import { useActiveComponentDefs } from '../../store/hooks';
import { usePosaStore } from '../../store/posa-store';
import { ComponentSlotGrid } from './ZXPlane';

/**
 * ZX — Group mode.
 * 그룹을 선택하면 그 그룹의 모든 컴포넌트를 한 화면에 쫙 펼친다. 컴포넌트 단일
 * ZX(ZXPlane)와 동일한 구성요소(ComponentSlotGrid)를 컴포넌트마다 반복한다.
 *
 * 여기서 더 좁히려면 프리뷰에서 컴포넌트 하나를 클릭해 selectedComponentId를 세팅,
 * ExplorationView가 ZXPlane으로 승격해준다. 그룹 필터는 계속 유지.
 */
export function ZXGroupPlane() {
  const selectedGroupId = usePosaStore((s) => s.selectedGroupId);
  const ir = usePosaStore((s) => s.ir);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const setFocus = usePosaStore((s) => s.setFocus);
  const selectComponent = usePosaStore((s) => s.selectComponent);
  const clearSelectedGroup = usePosaStore((s) => s.clearSelectedGroup);
  const components = useActiveComponentDefs();

  const group = useMemo(
    () =>
      selectedGroupId
        ? COMPONENT_GROUPS.find((g) => g.id === selectedGroupId) ?? null
        : null,
    [selectedGroupId],
  );

  const members = useMemo(
    () =>
      selectedGroupId
        ? components.filter((c) => c.group === selectedGroupId)
        : [],
    [components, selectedGroupId],
  );

  if (!group) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex items-start justify-between gap-4 px-1">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            ZX · group
          </div>
          <div className="font-mono text-lg text-stone-900">{group.label}</div>
          <div className="text-xs text-stone-500 mt-0.5">
            {members.length} component{members.length === 1 ? '' : 's'}
          </div>
        </div>
        <button
          type="button"
          onClick={clearSelectedGroup}
          className="flex-none text-xs font-mono text-stone-500 hover:text-stone-900 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 transition"
          title="Close group · back to Z*"
        >
          Close
        </button>
      </header>

      <div className="space-y-8">
        {members.map((component) => (
          <section key={component.id} className="space-y-3">
            <div className="flex items-baseline justify-between gap-2 px-1 border-b border-stone-200 pb-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-sm text-stone-900">
                  {component.label}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  {component.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => selectComponent(component.id)}
                className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-1.5 py-0.5 rounded hover:bg-stone-200/60 transition"
                title="Focus this component"
              >
                focus →
              </button>
            </div>
            <ComponentSlotGrid
              component={component}
              focusedNode={focusedNode}
              setFocus={setFocus}
              ir={ir}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
