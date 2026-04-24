import type { ReactNode } from 'react';
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';

type Props = {
  anchor: HTMLElement | null;
  open: boolean;
  children: ReactNode;
};

/**
 * 카드 아래로 붙는 인스펙터 팝오버.
 * 기본 bottom-start, 공간이 부족하면 top-start로 flip, 좌우로 shift.
 * size middleware로 viewport 경계에 따라 max-height를 제한해 내부 스크롤.
 * FloatingPortal로 body에 렌더해 상위 overflow 클리핑을 우회한다.
 */
export function InspectorPopover({ anchor, open, children }: Props) {
  const { refs, floatingStyles } = useFloating({
    open,
    strategy: 'fixed',
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    elements: { reference: anchor },
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ['top-start'] }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, rects, elements }) {
          elements.floating.style.maxHeight = `${Math.max(240, availableHeight)}px`;
          elements.floating.style.minWidth = `${rects.reference.width}px`;
        },
      }),
    ],
  });

  if (!open || !anchor) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="z-30 w-[26rem] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-stone-200 bg-white p-4 shadow-lg"
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
