import type { ComponentType } from '../../catalog/components';
import { COMPONENT_PREVIEWS, hasPreview } from './previews/registry';
import { PreviewScope } from './previews/PreviewScope';

type Props = {
  component: ComponentType;
  selected: boolean;
  required: boolean;
  onToggle: () => void;
};

export function ComponentTypeCard({ component, selected, required, onToggle }: Props) {
  const hasRealPreview = hasPreview(component.id);
  const Preview = hasRealPreview ? COMPONENT_PREVIEWS[component.id] : null;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={required}
      aria-pressed={selected}
      className={[
        'group relative text-left rounded-lg border overflow-hidden transition-all duration-150',
        selected
          ? 'border-stone-600 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]'
          : 'border-stone-200 bg-white/40 hover:border-stone-400',
        required
          ? 'cursor-not-allowed opacity-90'
          : 'hover:-translate-y-px focus-visible:outline-none focus-visible:border-stone-800',
      ].join(' ')}
    >
      {Preview ? (
        <PreviewScope className="pointer-events-none flex h-24 items-center justify-center border-b border-stone-100 bg-white px-3">
          <Preview />
        </PreviewScope>
      ) : (
        <div className="pointer-events-none flex h-24 items-center justify-center border-b border-stone-100 bg-stone-50/60">
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            {component.label}
          </span>
        </div>
      )}

      <span
        aria-hidden
        className={[
          'absolute top-2 right-2 w-4 h-4 rounded-sm border flex items-center justify-center transition',
          selected
            ? 'bg-stone-900 border-stone-900'
            : 'bg-white/80 border-stone-300 group-hover:border-stone-500',
        ].join(' ')}
      >
        {selected && (
          <svg
            viewBox="0 0 12 12"
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2.5,6.5 5,9 9.5,3.5" />
          </svg>
        )}
      </span>

      <span className="block p-3">
        <span className="block text-sm font-medium text-stone-900">
          {component.label}
        </span>
        <span className="block text-xs text-stone-500 leading-snug mt-0.5">
          {component.description}
        </span>
        {required && (
          <span className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-1">
            auto-included
          </span>
        )}
      </span>
    </button>
  );
}
