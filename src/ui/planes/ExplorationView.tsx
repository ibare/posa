import { useEffect } from 'react';
import { PreviewPanel } from '../../preview';
import { usePosaStore } from '../../store/posa-store';
import { BreadcrumbStrip } from './BreadcrumbStrip';
import { Z0Plane } from './Z0Plane';
import { Z1Plane } from './Z1Plane';
import { Z2Plane } from './Z2Plane';

export function ExplorationView() {
  const layer = usePosaStore((s) => s.layer);
  const selectedAttributeId = usePosaStore((s) => s.selectedAttributeId);
  const selectedSlotId = usePosaStore((s) => s.selectedSlotId);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const lastDirection = usePosaStore((s) => s.lastDirection);
  const setFocus = usePosaStore((s) => s.setFocus);
  const ascend = usePosaStore((s) => s.ascend);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (focusedNode) {
        setFocus(null);
      } else {
        ascend();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusedNode, setFocus, ascend]);

  const animClass =
    lastDirection === 'descend'
      ? 'plane-descend'
      : lastDirection === 'ascend'
        ? 'plane-ascend'
        : '';

  const planeKey = `${layer}-${selectedAttributeId ?? ''}-${selectedSlotId ?? ''}`;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <BreadcrumbStrip />
        <div key={planeKey} className={animClass}>
          {layer === 'z0' && <Z0Plane />}
          {layer === 'z1' && <Z1Plane />}
          {layer === 'z2' && <Z2Plane />}
        </div>
      </div>
      <div className="hidden xl:block">
        <PreviewPanel />
      </div>
    </div>
  );
}
