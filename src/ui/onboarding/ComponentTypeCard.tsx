import { useTranslation } from 'react-i18next';
import type { ComponentDefinition } from '../../catalog/components';
import { useComponentDescription, useComponentLabel } from '../../store/hooks';
import { ComponentPreview } from './ComponentPreview';

type Props = {
  component: ComponentDefinition;
  selected: boolean;
  onToggle: () => void;
};

export function ComponentTypeCard({ component, selected, onToggle }: Props) {
  const { t } = useTranslation('onboarding');
  const label = useComponentLabel(component.id);
  const description = useComponentDescription(component.id);
  const variantCount = component.variants?.length ?? 0;
  const stateCount = component.states.length;
  const attrCount = component.attributes.length;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={[
        'block w-full break-inside-avoid mb-2.5 text-left rounded-lg border transition-all duration-150 p-2.5 space-y-2.5',
        selected
          ? 'border-stone-900 bg-white -translate-y-px shadow-sm'
          : 'border-stone-200 bg-white/60 hover:border-stone-400 hover:-translate-y-px',
      ].join(' ')}
    >
      <ComponentPreview component={component} />
      <div className="flex items-start gap-2.5">
        <Checkbox checked={selected} />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm text-stone-900 truncate">
            {label}
          </div>
          <div className="text-[11px] text-stone-500 leading-snug mt-0.5 truncate">
            {description}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-stone-400">
            <span className="tabular-nums">{attrCount}</span>
            <span>{t('metric.attr')}</span>
            <span className="text-stone-300">·</span>
            <span className="tabular-nums">{stateCount}</span>
            <span>{t('metric.state')}</span>
            {variantCount > 0 && (
              <>
                <span className="text-stone-300">·</span>
                <span className="tabular-nums">{variantCount}</span>
                <span>{t('metric.var')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={[
        'flex-none mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded border transition',
        checked
          ? 'border-stone-900 bg-stone-900 text-cream'
          : 'border-stone-300 bg-white',
      ].join(' ')}
    >
      {checked && (
        <svg
          viewBox="0 0 12 12"
          className="w-3 h-3"
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
  );
}
