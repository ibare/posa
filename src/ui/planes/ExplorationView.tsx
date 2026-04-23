import { useEffect } from 'react';
import { PreviewPanel } from '../../preview';
import { usePosaStore } from '../../store/posa-store';
import { BreadcrumbStrip } from './BreadcrumbStrip';
import { Z0Plane } from './Z0Plane';
import { Z1Plane } from './Z1Plane';
import { Z2Plane } from './Z2Plane';
import { ZXPlane } from './ZXPlane';

export function ExplorationView() {
  const layer = usePosaStore((s) => s.layer);
  const selectedAttributeId = usePosaStore((s) => s.selectedAttributeId);
  const selectedSlotId = usePosaStore((s) => s.selectedSlotId);
  const selectedComponentId = usePosaStore((s) => s.selectedComponentId);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const lastDirection = usePosaStore((s) => s.lastDirection);
  const setFocus = usePosaStore((s) => s.setFocus);
  const ascend = usePosaStore((s) => s.ascend);
  const clearSelectedComponent = usePosaStore(
    (s) => s.clearSelectedComponent,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (focusedNode) {
        setFocus(null);
        return;
      }
      // ZX 모드에서 Z2 descend 중이 아니면 ZX 종료가 우선.
      if (selectedComponentId && layer !== 'z2') {
        clearSelectedComponent();
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
    layer,
    clearSelectedComponent,
  ]);

  const animClass =
    lastDirection === 'descend'
      ? 'plane-descend'
      : lastDirection === 'ascend'
        ? 'plane-ascend'
        : '';

  // ZX 모드가 Z0/Z1을 덮는다. Z2 descend 시에는 state 축을 써야 하므로 Z2Plane을 노출.
  const inZxMode = selectedComponentId != null && layer !== 'z2';
  const planeKey = inZxMode
    ? `zx-${selectedComponentId}`
    : `${layer}-${selectedAttributeId ?? ''}-${selectedSlotId ?? ''}`;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <BreadcrumbStrip />
        <div key={planeKey} className={animClass}>
          {inZxMode ? (
            <ZXPlane />
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
