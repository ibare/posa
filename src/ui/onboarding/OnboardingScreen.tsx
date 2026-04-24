import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  COMPONENT_DEFINITIONS,
  COMPONENT_GROUPS,
  findComponent,
  type ComponentDefinition,
  type ComponentGroupId,
} from '../../catalog/components';
import type { ComponentId, IR, SymbolId } from '../../ir/types';
import { usePosaStore } from '../../store/posa-store';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { LocaleToggle } from '../shared/layout/LocaleToggle';
import { CategorySection } from './CategorySection';
import { useComponentLabel } from '../../store/hooks';

/**
 * 온보딩: 색 지정 대상 컴포넌트 스코프를 고르는 화면.
 *
 * 라이브 커밋 모델 — 체크를 토글하면 즉시 store의 activeComponentIds와 IR이 갱신된다.
 * 색 연결이 있는 컴포넌트를 해제하려 하면 확인 다이얼로그를 띄우고 취소 시 원복한다.
 * 마지막 컴포넌트를 빼는 순간에는 전체 wipe 확인을 한다.
 *
 * 버튼 라벨: 데이터가 있고 이번 세션에서 0을 거치지 않았다면 Continue, 그 외엔 Start.
 * Continue/Start 클릭 시 네비 컨텍스트를 리셋하고 /explore(Z0)로 이동한다.
 */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const activeComponentIds = usePosaStore((s) => s.activeComponentIds);
  const ir = usePosaStore((s) => s.ir);
  const addActiveComponents = usePosaStore((s) => s.addActiveComponents);
  const removeActiveComponents = usePosaStore((s) => s.removeActiveComponents);
  const startFresh = usePosaStore((s) => s.startFresh);
  const resetNavigation = usePosaStore((s) => s.resetNavigation);
  const { t } = useTranslation(['onboarding', 'common']);

  // 세션 내에서 한 번이라도 0이 되었는가. 0을 거치면 Continue → Start로 고정.
  // 진입 시 비어있었다면 true로 시작해서 처음부터 Start가 뜬다.
  const [wentToZero, setWentToZero] = useState(
    () => activeComponentIds.length === 0,
  );
  useEffect(() => {
    if (activeComponentIds.length === 0) setWentToZero(true);
  }, [activeComponentIds.length]);

  const [removalConfirm, setRemovalConfirm] = useState<
    | { kind: 'component'; id: ComponentId }
    | { kind: 'group'; ids: ComponentId[] }
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

  const hasColorLink = (componentId: ComponentId): boolean => {
    return componentHasColorLink(ir, componentId);
  };
  const anyHasColorLink = (ids: Iterable<ComponentId>): boolean => {
    for (const id of ids) if (hasColorLink(id)) return true;
    return false;
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

    if (!anyHasColorLink(uniq)) {
      removeActiveComponents(uniq);
      return;
    }
    if (uniq.length === 1) {
      setRemovalConfirm({ kind: 'component', id: uniq[0] });
    } else {
      setRemovalConfirm({ kind: 'group', ids: uniq });
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
  // 데이터가 있고, 이번 세션에서 0을 거치지 않았다면 Continue.
  // 0을 거친 순간부터는 "새로 시작"이므로 Start로 고정된다.
  const isContinue = !isEmpty && !wentToZero;
  const canProceed = !isEmpty;

  const onProceed = () => {
    if (!canProceed) return;
    // /explore 진입은 항상 Z0부터. 이전 세션에 남아있던 네비 컨텍스트를 리셋.
    resetNavigation();
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
                <sup className="relative top-[10px] ml-0.5 align-top font-mono not-italic text-[11px] uppercase tracking-[0.15em] text-stone-400">
                  {t('common:app.beta')}
                </sup>
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
    | { kind: 'component'; id: ComponentId }
    | { kind: 'group'; ids: ComponentId[] }
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
        description={t('confirm.removeComponent.description')}
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
      description={t('confirm.removeGroup.description')}
      confirmLabel={t('common:action.remove')}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

/**
 * 주어진 컴포넌트가 현재 IR 상의 "색 연결"을 하나라도 갖는지.
 *  1) 컴포넌트가 소유한 slot  (`{cid}.*`)
 *  2) 컴포넌트가 선언한 attribute 중 IR에 전역 색이 잡힌 것
 *  3) 컴포넌트의 variant id와 일치하는 symbol에 색이 잡힌 것
 *
 * (2)(3)은 제거되지 않지만, 체크 해제하면 프리뷰에서 이 컴포넌트가 사라져
 * 사용자 시점에선 "설정한 색이 사라진" 것처럼 보이기 때문에 경고 대상에 포함한다.
 */
function componentHasColorLink(ir: IR, componentId: ComponentId): boolean {
  for (const slotId of Object.keys(ir.slots)) {
    if (slotId.split('.')[0] === componentId) return true;
  }
  const def = findComponent(componentId);
  if (!def) return false;
  for (const attr of def.attributes) {
    if (ir.attributes[attr]) return true;
  }
  for (const variant of def.variants ?? []) {
    if (ir.symbols[variant.id as SymbolId]) return true;
  }
  return false;
}
