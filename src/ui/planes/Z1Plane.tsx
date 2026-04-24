import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getSlotsByAttribute,
  resolveAttributeColor,
} from '../../ir/selectors';
import {
  useActiveComponentDefs,
  useAttributeLabel,
} from '../../store/hooks';
import { usePosaStore } from '../../store/posa-store';
import { SlotCard } from '../shared/SlotCard';
import { Swatch } from '../shared/Swatch';

export function Z1Plane() {
  const ir = usePosaStore((s) => s.ir);
  const selectedAttributeId = usePosaStore((s) => s.selectedAttributeId);
  const focusedNode = usePosaStore((s) => s.focusedNode);
  const setFocus = usePosaStore((s) => s.setFocus);
  const components = useActiveComponentDefs();
  const attrLabel = useAttributeLabel(selectedAttributeId);
  const { t } = useTranslation('planes');

  const slotIds = useMemo(() => {
    if (!selectedAttributeId) return [];
    return getSlotsByAttribute(components, selectedAttributeId, ir);
  }, [components, selectedAttributeId, ir]);

  if (!selectedAttributeId) return null;

  const attrColor = resolveAttributeColor(ir, selectedAttributeId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center gap-4 px-1">
        <Swatch color={attrColor} size="lg" />
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
            {t('z1.label')}
          </div>
          <div className="font-mono text-lg text-stone-900">{attrLabel}</div>
          <div className="text-xs text-stone-500 mt-0.5">
            {t('z1.slotCount', { count: slotIds.length })} {t('z1.acrossAll')}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {slotIds.map((slotId) => (
          <SlotCard
            key={slotId}
            slotId={slotId}
            focused={focusedNode === `slot:${slotId}`}
            onFocusToggle={() =>
              setFocus(
                focusedNode === `slot:${slotId}` ? null : `slot:${slotId}`,
              )
            }
            hideAttributeSuffix
          />
        ))}
        {slotIds.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-stone-500 border border-dashed border-stone-300 rounded-lg">
            {t('z1.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
