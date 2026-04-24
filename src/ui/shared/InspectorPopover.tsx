import type { ReactNode } from 'react';
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import { useIsMobile } from './useMediaQuery';

type Props = {
  anchor: HTMLElement | null;
  open: boolean;
  onDismiss?: () => void;
  children: ReactNode;
};

/**
 * 카드 아래로 붙는 인스펙터 팝오버.
 * 데스크탑: bottom-start, 공간 부족 시 top-start로 flip, 좌우 shift, size로 max-height 제한.
 * 모바일(<768px): 화면 하단 sheet로 표시 (Floating UI 위치 계산 무시).
 * FloatingPortal로 body에 렌더해 상위 overflow 클리핑을 우회한다.
 * onDismiss가 주어지면 바깥 클릭/Esc로 닫힌다 (Floating UI useDismiss).
 */
export function InspectorPopover({ anchor, open, onDismiss, children }: Props) {
  const isMobile = useIsMobile();
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (next) => {
      if (!next) onDismiss?.();
    },
    strategy: 'fixed',
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    elements: { reference: anchor },
    middleware: isMobile
      ? []
      : [
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

  const dismiss = useDismiss(context, { enabled: onDismiss != null });
  const { getFloatingProps } = useInteractions([dismiss]);

  if (!open || !anchor) return null;

  if (isMobile) {
    return (
      <FloatingPortal>
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-stone-900/20"
        />
        <div
          ref={refs.setFloating}
          {...getFloatingProps()}
          role="dialog"
          aria-modal="true"
          className="fixed inset-x-0 bottom-0 z-40 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-stone-200 bg-white p-4 pb-6 shadow-2xl"
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300"
          />
          {children}
        </div>
      </FloatingPortal>
    );
  }

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        className="z-30 w-[26rem] max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-stone-200 bg-white p-4 shadow-lg"
      >
        {children}
      </div>
    </FloatingPortal>
  );
}
