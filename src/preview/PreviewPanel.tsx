import { findComponent } from '../catalog/components';
import type { StateId } from '../ir/types';
import { usePosaStore } from '../store/posa-store';
import { PosaPreviewRoot } from './PosaPreviewRoot';
import { StateGroup } from './StateGroup';
import {
  BadgeShape,
  ButtonShape,
  CardShape,
  InputShape,
  ToastShape,
  type BadgeVariant,
  type ButtonVariant,
  type ToastVariant,
} from './shapes';

/**
 * 현재 IR을 5개 shape로 모두 동시 렌더하는 stickied 프리뷰 패널.
 * interaction은 없고 모든 state가 정적으로 병렬로 나타난다 — Posa preview의 원칙.
 */
export function PreviewPanel() {
  const ir = usePosaStore((s) => s.ir);

  const buttonStates = findComponent('button')?.states ?? (['default'] as StateId[]);
  const inputStates = findComponent('input')?.states ?? (['default'] as StateId[]);

  const buttonVariants: ButtonVariant[] = [
    'primary',
    'secondary',
    'destructive',
    'outline',
    'ghost',
  ];
  const badgeVariants: BadgeVariant[] = ['default', 'secondary', 'destructive', 'outline'];
  const toastVariants: ToastVariant[] = ['default', 'destructive', 'warning', 'success'];

  return (
    <aside className="sticky top-20 flex h-[calc(100vh-6rem)] flex-col rounded-lg border border-stone-200 bg-white/70 backdrop-blur">
      <header className="border-b border-stone-200 px-4 py-2.5">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
          Live preview
        </div>
        <div className="text-sm font-medium text-stone-800">5 components</div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <PosaPreviewRoot ir={ir} className="space-y-8">
          <PreviewSection title="Button">
            {buttonVariants.map((v) => (
              <StateGroup key={v} label={v.toUpperCase()} states={buttonStates}>
                {(state) => <ButtonShape variant={v} state={state} label={v} />}
              </StateGroup>
            ))}
          </PreviewSection>

          <PreviewSection title="Input">
            <StateGroup label="INPUT" states={inputStates}>
              {(state) => (
                <InputShape
                  state={state}
                  value={state === 'default' ? undefined : 'Sample'}
                />
              )}
            </StateGroup>
          </PreviewSection>

          <PreviewSection title="Card">
            <CardShape />
          </PreviewSection>

          <PreviewSection title="Badge">
            <div className="flex flex-wrap gap-3 items-start">
              {badgeVariants.map((v) => (
                <div key={v} className="flex flex-col items-start gap-2">
                  <BadgeShape variant={v} label={v} />
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </PreviewSection>

          <PreviewSection title="Toast">
            <div className="flex flex-col gap-3">
              {toastVariants.map((v) => (
                <div key={v} className="flex flex-col items-start gap-1">
                  <ToastShape variant={v} title={`${v[0].toUpperCase()}${v.slice(1)} toast`} />
                  <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </PreviewSection>
        </PosaPreviewRoot>
      </div>
    </aside>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500">
        {title}
      </div>
      {children}
    </section>
  );
}
