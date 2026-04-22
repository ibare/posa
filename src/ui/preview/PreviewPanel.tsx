import { useMemo, useState } from 'react';
import { usePosaStore } from '../../store/posa-store';
import { PreviewScope } from '../onboarding/previews/PreviewScope';
import { irToPreviewPalette } from './palette';
import { PREVIEW_SCENES } from './scenes';

/**
 * Exploration 단계 우측 sticky 프리뷰 패널.
 * 현재 IR을 PreviewPalette로 변환해 shadcn 씬에 색을 주입한다.
 */
export function PreviewPanel() {
  const ir = usePosaStore((s) => s.ir);
  const [sceneId, setSceneId] = useState(PREVIEW_SCENES[0].id);

  const palette = useMemo(() => irToPreviewPalette(ir), [ir]);
  const scene =
    PREVIEW_SCENES.find((s) => s.id === sceneId) ?? PREVIEW_SCENES[0];
  const Scene = scene.Component;

  return (
    <aside className="sticky top-20 flex h-[calc(100vh-6rem)] flex-col rounded-lg border border-stone-200 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-3 py-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400">
            Live preview
          </div>
          <div className="text-sm font-medium text-stone-800">
            {scene.label}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-stone-200 px-3 py-2">
        {PREVIEW_SCENES.map((s) => {
          const active = s.id === sceneId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSceneId(s.id)}
              className={[
                'rounded border px-2 py-1 text-xs transition',
                active
                  ? 'border-stone-900 bg-stone-900 text-cream'
                  : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900',
              ].join(' ')}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <PreviewScope
          palette={palette}
          className="flex min-h-full items-start justify-center rounded-md bg-background p-4 text-foreground"
        >
          <Scene />
        </PreviewScope>
      </div>
      <div className="border-t border-stone-200 px-3 py-2 text-[11px] text-stone-500">
        {scene.description}
      </div>
    </aside>
  );
}
