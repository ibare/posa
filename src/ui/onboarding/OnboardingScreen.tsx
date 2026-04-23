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
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { LocaleToggle } from '../shared/layout/LocaleToggle';
import { CategorySection } from './CategorySection';
import { useComponentLabel } from '../../store/hooks';

/**
 * 온보딩: 색 지정 대상 컴포넌트 스코프를 고르는 화면.
 *
 * 라이브 커밋 모델 — 체크를 토글하면 즉시 store의 activeComponentIds와 IR이 갱신된다.
 * 제거로 손실이 발생할 가능성이 있으면 그 시점에 확인 다이얼로그를 띄우고 취소 시 원복한다.
 * 마지막 컴포넌트를 빼는 순간에는 전체 wipe 확인을 한다.
 *
 * Continue/Start 버튼은 /explore로 이동만 한다 (커밋 작업 없음). 라벨은 엔트리 스냅샷과
 * 현재 상태가 같으면 Continue, 달라졌으면(또는 처음부터 빈 상태였으면) Start.
 */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const activeComponentIds = usePosaStore((s) => s.activeComponentIds);
  const ir = usePosaStore((s) => s.ir);
  const addActiveComponents = usePosaStore((s) => s.addActiveComponents);
  const removeActiveComponents = usePosaStore((s) => s.removeActiveComponents);
  const startFresh = usePosaStore((s) => s.startFresh);
  const { t } = useTranslation(['onboarding', 'common']);

  // 엔트리 스냅샷 — "변경 없으면 Continue" 판정에 쓴다.
  const [entrySnapshot] = useState<Set<ComponentId>>(
    () => new Set(activeComponentIds),
  );

  const [removalConfirm, setRemovalConfirm] = useState<
    | { kind: 'component'; id: ComponentId; slotCount: number }
    | { kind: 'group'; ids: ComponentId[]; slotCount: number }
    | { kind: 'all' }
    | null
  >(null);

  const componentsByGroup = useMemo(() => {
    const m = new Map<ComponentGroupId, ComponentDefinition[]>();
    for (const c of COMPONENT_DEFINITIONS) {
      const list = m.get(c.group) ?? [];
      list.push(c);
      m.set(c.group, list);
    }
    return m;
  }, []);

  const selected = useMemo(
    () => new Set(activeComponentIds),
    [activeComponentIds],
  );

  const countSlotsFor = (ids: Iterable<ComponentId>): number => {
    const removeSet = new Set(ids);
    let n = 0;
    for (const slotId of Object.keys(ir.slots)) {
      if (removeSet.has(slotId.split('.')[0] as ComponentId)) n++;
    }
    return n;
  };

  const handleRemove = (ids: ComponentId[]) => {
    const uniq = ids.filter((id) => selected.has(id));
    if (uniq.length === 0) return;

    // 이 제거로 activeComponentIds가 0이 되는가?
    const wouldBeEmpty = uniq.length === selected.size;
    if (wouldBeEmpty) {
      setRemovalConfirm({ kind: 'all' });
      return;
    }

    const slotCount = countSlotsFor(uniq);
    if (slotCount === 0) {
      removeActiveComponents(uniq);
      return;
    }
    if (uniq.length === 1) {
      setRemovalConfirm({ kind: 'component', id: uniq[0], slotCount });
    } else {
      setRemovalConfirm({ kind: 'group', ids: uniq, slotCount });
    }
  };

  const toggle = (id: ComponentId) => {
    if (selected.has(id)) handleRemove([id]);
    else addActiveComponents([id]);
  };

  const toggleGroup = (groupId: ComponentGroupId) => {
    const members = componentsByGroup.get(groupId) ?? [];
    const ids = members.map((c) => c.id);
    const allSelected = ids.every((id) => selected.has(id));
    if (allSelected) handleRemove(ids);
    else addActiveComponents(ids);
  };

  const selectAll = () => {
    addActiveComponents(COMPONENT_DEFINITIONS.map((c) => c.id));
  };
  const clearAll = () => {
    handleRemove(COMPONENT_DEFINITIONS.map((c) => c.id));
  };

  const confirmRemoval = () => {
    if (!removalConfirm) return;
    if (removalConfirm.kind === 'all') startFresh();
    else if (removalConfirm.kind === 'component')
      removeActiveComponents([removalConfirm.id]);
    else removeActiveComponents(removalConfirm.ids);
    setRemovalConfirm(null);
  };

  const cancelRemoval = () => setRemovalConfirm(null);

  const count = selected.size;
  const total = COMPONENT_DEFINITIONS.length;
  const isEmpty = count === 0;
  const pristine =
    entrySnapshot.size === selected.size &&
    [...entrySnapshot].every((id) => selected.has(id));
  const isContinue = !isEmpty && pristine && entrySnapshot.size > 0;
  const canProceed = !isEmpty;

  const onProceed = () => {
    if (!canProceed) return;
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
            disabled={isEmpty}
            className="text-xs font-mono text-stone-600 px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-stone-200 disabled:hover:text-stone-600"
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
              onClick={onProceed}
              disabled={!canProceed}
              className={[
                'text-sm font-mono px-4 py-2 rounded border transition',
                canProceed
                  ? 'bg-stone-900 text-cream border-stone-900 hover:-translate-y-px'
                  : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed',
              ].join(' ')}
            >
              {isContinue ? t('continue') : t('start')}
            </button>
          </div>
        </div>
      </div>

      <RemovalConfirmDialog
        confirm={removalConfirm}
        onConfirm={confirmRemoval}
        onCancel={cancelRemoval}
      />
    </div>
  );
}

function RemovalConfirmDialog({
  confirm,
  onConfirm,
  onCancel,
}: {
  confirm:
    | { kind: 'component'; id: ComponentId; slotCount: number }
    | { kind: 'group'; ids: ComponentId[]; slotCount: number }
    | { kind: 'all' }
    | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation(['onboarding', 'common']);
  // Hook 호출 규칙상 조건부가 아니어야 하므로 항상 호출하고 confirm이 해당 kind일 때만 사용한다.
  const componentLabel = useComponentLabel(
    confirm?.kind === 'component' ? confirm.id : '',
  );

  if (!confirm) {
    return (
      <ConfirmDialog
        open={false}
        title=""
        confirmLabel=""
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
  }

  if (confirm.kind === 'all') {
    return (
      <ConfirmDialog
        open
        destructive
        title={t('confirm.removeAll.title')}
        description={t('confirm.removeAll.description')}
        confirmLabel={t('common:action.remove')}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
  }

  if (confirm.kind === 'component') {
    return (
      <ConfirmDialog
        open
        destructive
        title={t('confirm.removeComponent.title', { component: componentLabel })}
        description={t('confirm.removeComponent.description', {
          count: confirm.slotCount,
        })}
        confirmLabel={t('common:action.remove')}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
  }

  return (
    <ConfirmDialog
      open
      destructive
      title={t('confirm.removeGroup.title', { count: confirm.ids.length })}
      description={t('confirm.removeGroup.description', {
        count: confirm.slotCount,
      })}
      confirmLabel={t('common:action.remove')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
