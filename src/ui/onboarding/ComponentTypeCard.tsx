import type { ComponentType } from '../../catalog/components';

type Props = {
  component: ComponentType;
  selected: boolean;
  required: boolean;
  onToggle: () => void;
};

export function ComponentTypeCard({ component, selected, required, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={required}
      aria-pressed={selected}
      className={[
        'group text-left p-3 rounded-lg border transition-all duration-150',
        selected
          ? 'border-stone-600 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]'
          : 'border-stone-200 bg-white/40 hover:border-stone-400',
        required
          ? 'cursor-not-allowed opacity-90'
          : 'hover:-translate-y-px focus-visible:outline-none focus-visible:border-stone-800',
      ].join(' ')}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden
          className={[
            'mt-0.5 flex-none w-4 h-4 rounded-sm border flex items-center justify-center',
            selected ? 'bg-stone-900 border-stone-900' : 'border-stone-400',
          ].join(' ')}
        >
          {selected && (
            <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2.5,6.5 5,9 9.5,3.5" />
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-stone-900">{component.label}</span>
          <span className="block text-xs text-stone-500 leading-snug mt-0.5">
            {component.description}
          </span>
          {required && (
            <span className="block text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-1">
              auto-included
            </span>
          )}
        </span>
      </div>
    </button>
  );
}
