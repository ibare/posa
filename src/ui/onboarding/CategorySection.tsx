import { useTranslation } from 'react-i18next';
import type {
  ComponentDefinition,
  ComponentGroupDefinition,
} from '../../catalog/components';
import type { ComponentId } from '../../ir/types';
import { useGroupLabel } from '../../store/hooks';
import { ComponentTypeCard } from './ComponentTypeCard';

type Props = {
  group: ComponentGroupDefinition;
  members: ComponentDefinition[];
  selected: Set<ComponentId>;
  onToggle: (id: ComponentId) => void;
  onToggleGroup: () => void;
};

export function CategorySection({
  group,
  members,
  selected,
  onToggle,
  onToggleGroup,
}: Props) {
  const { t } = useTranslation('onboarding');
  const groupLabel = useGroupLabel(group.id);
  const selectedCount = members.filter((m) => selected.has(m.id)).length;
  const allSelected = selectedCount === members.length;
  const noneSelected = selectedCount === 0;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 px-1 border-b border-stone-200 pb-1.5">
        <div className="flex items-baseline gap-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            {group.id}
          </span>
          <span className="font-mono text-sm text-stone-900">{groupLabel}</span>
          <span className="text-xs font-mono tabular-nums text-stone-500">
            <span className={noneSelected ? 'text-stone-400' : 'text-stone-900'}>
              {selectedCount}
            </span>
            <span className="text-stone-400"> / </span>
            <span>{members.length}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleGroup}
          className="text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 px-1.5 py-0.5 rounded hover:bg-stone-200/60 transition"
        >
          {allSelected ? t('deselectGroup') : t('selectGroup')}
        </button>
      </div>
      <div className="columns-1 sm:columns-2 md:columns-3 gap-2.5">
        {members.map((c) => (
          <ComponentTypeCard
            key={c.id}
            component={c}
            selected={selected.has(c.id)}
            onToggle={() => onToggle(c.id)}
          />
        ))}
      </div>
    </section>
  );
}
