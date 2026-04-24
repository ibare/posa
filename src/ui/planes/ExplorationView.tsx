import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PreviewPanel } from '../../preview';
import { usePosaStore } from '../../store/posa-store';
import { useIsMobile } from '../shared/useMediaQuery';
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
  const previewPanelWidth = usePosaStore((s) => s.previewPanelWidth);
  const { t } = useTranslation('planes');
  const { t: tCommon } = useTranslation();
  const isMobile = useIsMobile();
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) setMobilePreviewOpen(false);
  }, [isMobile]);

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

  const main = (
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
  );

  if (isMobile) {
    return (
      <>
        {main}
        <button
          type="button"
          onClick={() => setMobilePreviewOpen(true)}
          aria-label={tCommon('action.openPreview')}
          className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-900 text-cream px-4 py-2.5 text-xs font-mono shadow-lg active:scale-[0.98] transition"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="3" width="12" height="10" rx="1.5" />
            <path d="M2 6h12" />
          </svg>
          {tCommon('action.openPreview')}
        </button>
        {mobilePreviewOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-40 flex flex-col bg-cream"
          >
            <div className="sticky top-0 z-10 flex items-center justify-end border-b border-stone-200 bg-cream/95 backdrop-blur px-4 py-2.5">
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(false)}
                className="text-xs text-stone-600 hover:text-stone-900 px-2.5 py-1 rounded border border-stone-200 hover:border-stone-400 transition"
              >
                {tCommon('action.closePreview')}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <PreviewPanel />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `minmax(0, 1fr) ${previewPanelWidth}px`,
      }}
    >
      {main}
      <PreviewPanel />
    </div>
  );
}
