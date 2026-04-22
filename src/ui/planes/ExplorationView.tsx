import { useEffect } from 'react';
import { usePosaStore } from '../../store/posa-store';
import { BreadcrumbStrip } from './BreadcrumbStrip';
import { Inspector } from './Inspector';
import { Z0Plane } from './Z0Plane';
import { Z1Plane } from './Z1Plane';
import { Z2Plane } from './Z2Plane';

export function ExplorationView() {
  const layer = usePosaStore((s) => s.layer);
  const focusedNode = usePosaStore((s) => s.focusedNode);
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

  return (
    <div>
      <BreadcrumbStrip />
      {layer === 'z0' && <Z0Plane />}
      {layer === 'z1' && <Z1Plane />}
      {layer === 'z2' && <Z2Plane />}
      <Inspector />
    </div>
  );
}
