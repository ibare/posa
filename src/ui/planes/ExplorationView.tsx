import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PreviewPanel } from '../../preview';
import { usePosaStore } from '../../store/posa-store';
import { BreadcrumbStrip } from './BreadcrumbStrip';
import { Z0Plane } from './Z0Plane';
import { Z1Plane } from './Z1Plane';
import { Z2Plane } from './Z2Plane';
import { ZXGroupPlane } from './ZXGroupPlane';
import { ZXPlane } from './ZXPlane';

export function ExplorationView() {
  const activeCount = usePosaStore((s) => s.activeComponentIds.length);
  const layer = usePosaStore((s) => s.layer);
  const selectedAttributeId = usePosaStore((s) => s.selectedAttributeId);
  const selectedSlotId = usePosaStore((s) => s.selectedSlotId);
  const selectedComponentId = usePosaStore((s) => s.selectedComponentId);
  const selectedGroupId = usePosaStore((s) => s.selectedGroupId);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const lastDirection = usePosaStore((s) => s.lastDirection);
  const setFocus = usePosaStore((s) => s.setFocus);
  const ascend = usePosaStore((s) => s.ascend);
  const clearSelectedComponent = usePosaStore(
    (s) => s.clearSelectedComponent,
  );
  const clearSelectedGroup = usePosaStore((s) => s.clearSelectedGroup);
  const { t } = useTranslation('planes');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (focusedNode) {
        setFocus(null);
        return;
      }
      // ZX 모드에서 Z2 descend 중이 아니면 ZX 종료가 우선. 단일 컴포넌트 ZX →
      // 그룹 ZX → 기본(Z0) 순서로 한 단계씩 벗겨낸다.
      if (selectedComponentId && layer !== 'z2') {
        clearSelectedComponent();
        return;
      }
      if (selectedGroupId && layer !== 'z2') {
        clearSelectedGroup();
        return;
      }
      ascend();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    focusedNode,
    setFocus,
    ascend,
    selectedComponentId,
    selectedGroupId,
    layer,
    clearSelectedComponent,
    clearSelectedGroup,
  ]);

  if (activeCount === 0) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center border border-dashed border-stone-300 rounded-lg">
        <div className="font-display italic text-xl text-stone-700">
          {t('empty.title')}
        </div>
        <p className="text-sm text-stone-500 mt-2">{t('empty.description')}</p>
      </div>
    );
  }

  const animClass =
    lastDirection === 'descend'
      ? 'plane-descend'
      : lastDirection === 'ascend'
        ? 'plane-ascend'
        : '';

  // ZX 모드가 Z0/Z1을 덮는다. Z2 descend 시에는 state 축을 써야 하므로 Z2Plane을 노출.
  // 단일 컴포넌트 ZX가 그룹 ZX보다 우선(더 좁은 범위).
  const inZxComponent = selectedComponentId != null && layer !== 'z2';
  const inZxGroup =
    !inZxComponent && selectedGroupId != null && layer !== 'z2';
  const planeKey = inZxComponent
    ? `zx-${selectedComponentId}`
    : inZxGroup
      ? `zxg-${selectedGroupId}`
      : `${layer}-${selectedAttributeId ?? ''}-${selectedSlotId ?? ''}`;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <BreadcrumbStrip />
        <div key={planeKey} className={animClass}>
          {inZxComponent ? (
            <ZXPlane />
          ) : inZxGroup ? (
            <ZXGroupPlane />
          ) : (
            <>
              {layer === 'z0' && <Z0Plane />}
              {layer === 'z1' && <Z1Plane />}
              {layer === 'z2' && <Z2Plane />}
            </>
          )}
        </div>
      </div>
      <div className="hidden xl:block">
        <PreviewPanel />
      </div>
    </div>
  );
}
