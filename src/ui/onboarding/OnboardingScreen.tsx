import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  COMPONENT_DEFINITIONS,
  COMPONENT_GROUPS,
  type ComponentDefinition,
  type ComponentGroupId,
} from '../../catalog/components';
import type { ComponentId } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { LocaleToggle } from '../shared/layout/LocaleToggle';
import { CategorySection } from './CategorySection';

/**
 * 온보딩: 사용자가 색 지정 대상 컴포넌트 집합(=scope)을 고르는 화면.
 *
 * 완료 시 `setActiveComponents`로 store에 심고 `/explore`로 이동한다.
 * 기존 activeComponentIds가 있으면 체크 상태를 그대로 복원 — 재방문 시 Reset 전까지 유지.
 */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const activeComponentIds = usePosaStore((s) => s.activeComponentIds);
  const setActiveComponents = usePosaStore((s) => s.setActiveComponents);
  const { t } = useTranslation(['onboarding', 'common']);

  const [selected, setSelected] = useState<Set<ComponentId>>(
    () => new Set(activeComponentIds),
  );

  const componentsByGroup = useMemo(() => {
    const m = new Map<ComponentGroupId, ComponentDefinition[]>();
    for (const c of COMPONENT_DEFINITIONS) {
      const list = m.get(c.group) ?? [];
      list.push(c);
      m.set(c.group, list);
    }
    return m;
  }, []);

  const toggle = (id: ComponentId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (groupId: ComponentGroupId) => {
    const members = componentsByGroup.get(groupId) ?? [];
    const ids = members.map((c) => c.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(COMPONENT_DEFINITIONS.map((c) => c.id)));
  };
  const clearAll = () => setSelected(new Set());

  const count = selected.size;
  const total = COMPONENT_DEFINITIONS.length;
  const canProceed = count > 0;

  const onStart = () => {
    if (!canProceed) return;
    // Catalog 순서대로 정규화 — 이후 selector가 이 순서대로 iterate.
    const ids = COMPONENT_DEFINITIONS.map((c) => c.id).filter((id) =>
      selected.has(id),
    );
    setActiveComponents(ids);
    navigate('/explore');
  };

  return (
    <div className="min-h-screen bg-cream text-stone-900 font-body antialiased">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
        <header className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h1 className="font-display italic text-4xl leading-none tracking-tight">
                {t('common:app.title')}
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">
                {t('caption')}
              </span>
            </div>
            <LocaleToggle />
          </div>
          <h2 className="font-display text-2xl text-stone-900">{t('title')}</h2>
          <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
            {t('subtitle')}
          </p>
        </header>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-mono text-stone-600 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
          >
            {t('selectAll')}
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-mono text-stone-600 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition"
          >
            {t('clear')}
          </button>
          <div className="flex-1" />
          <span className="text-xs font-mono tabular-nums text-stone-500">
            <span className="text-stone-900">{count}</span>
            <span className="text-stone-400"> / </span>
            <span>{total}</span>
          </span>
        </div>

        <div className="space-y-8">
          {COMPONENT_GROUPS.map((group) => {
            const members = componentsByGroup.get(group.id) ?? [];
            if (members.length === 0) return null;
            return (
              <CategorySection
                key={group.id}
                group={group}
                members={members}
                selected={selected}
                onToggle={toggle}
                onToggleGroup={() => toggleGroup(group.id)}
              />
            );
          })}
        </div>

        <div className="sticky bottom-4 z-10">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white/95 backdrop-blur px-5 py-3 shadow-sm">
            <div className="text-sm text-stone-700">
              <span className="text-stone-500">
                {t('componentCount', { count })} {t('selected')}
              </span>
            </div>
            <button
              type="button"
              onClick={onStart}
              disabled={!canProceed}
              className={[
                'text-sm font-mono px-4 py-2 rounded border transition',
                canProceed
                  ? 'bg-stone-900 text-cream border-stone-900 hover:-translate-y-px'
                  : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed',
              ].join(' ')}
            >
              {t('start')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
