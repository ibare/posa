import { useMemo, useState } from 'react';
import {
  COMPONENT_TYPES,
  PRESETS,
  type ComponentCategory,
  type ComponentType,
} from '../../catalog/components';
import { applyPreset, deriveUniverse } from '../../catalog/universe';
import { usePosaStore } from '../../store/posa-store';
import { ComponentTypeCard } from './ComponentTypeCard';

const CATEGORY_ORDER: ComponentCategory[] = [
  'interactive',
  'input',
  'container',
  'feedback',
  'navigation',
  'data',
  'typography',
];

const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  interactive: 'Interactive',
  input: 'Input',
  container: 'Container',
  feedback: 'Feedback',
  navigation: 'Navigation',
  data: 'Data',
  typography: 'Typography',
};

const REQUIRED_IDS: string[] = COMPONENT_TYPES.filter(
  (c) => 'alwaysIncluded' in c && c.alwaysIncluded,
).map((c) => c.id);

export function OnboardingScreen() {
  const startWithComponents = usePosaStore((s) => s.startWithComponents);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(REQUIRED_IDS));

  const toggle = (id: string): void => {
    if (REQUIRED_IDS.includes(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyPresetSelection = (presetId: string): void => {
    const ids = applyPreset(presetId);
    setSelected(new Set([...REQUIRED_IDS, ...ids]));
  };

  const byCategory = useMemo<Record<ComponentCategory, ComponentType[]>>(() => {
    const map = {
      interactive: [] as ComponentType[],
      input: [] as ComponentType[],
      container: [] as ComponentType[],
      feedback: [] as ComponentType[],
      navigation: [] as ComponentType[],
      data: [] as ComponentType[],
      typography: [] as ComponentType[],
    };
    for (const c of COMPONENT_TYPES) {
      map[c.category].push(c);
    }
    return map;
  }, []);

  const selectedArr = useMemo(() => Array.from(selected), [selected]);
  const preview = useMemo(() => deriveUniverse(selectedArr), [selectedArr]);
  const userChoseSomething = selectedArr.some((id) => !REQUIRED_IDS.includes(id));

  return (
    <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10">
      <div>
        <header className="mb-8">
          <h2 className="font-display text-4xl leading-tight">What are you building?</h2>
          <p className="text-sm text-stone-600 mt-2 max-w-xl leading-relaxed">
            Pick only the UI components you need. The colors required are derived
            automatically from your selection.
          </p>
        </header>

        <section className="mb-10">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">
            Preset
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPresetSelection(p.id)}
                title={p.description}
                className="px-3 py-1.5 text-sm rounded-full border border-stone-300 bg-white/60 hover:border-stone-700 hover:-translate-y-px transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-8">
          {CATEGORY_ORDER.map((cat) => {
            const items = byCategory[cat];
            if (items.length === 0) return null;
            return (
              <section key={cat}>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-2">
                  {CATEGORY_LABEL[cat]}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                  {items.map((c) => (
                    <ComponentTypeCard
                      key={c.id}
                      component={c}
                      selected={selected.has(c.id)}
                      required={REQUIRED_IDS.includes(c.id)}
                      onToggle={() => toggle(c.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start bg-white/70 border border-stone-200 rounded-lg p-5 space-y-4 text-sm shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div>
          <div className="font-display italic text-2xl leading-tight">
            Exploration scope preview
          </div>
          <div className="text-xs text-stone-500 mt-1">Updates live as you select</div>
        </div>
        <div className="space-y-1.5 text-stone-700">
          <MetricRow label="role" value={preview.roles.length} />
          <MetricRow label="slot" value={preview.slots.length} />
          <MetricRow label="state" value={preview.states.size} />
        </div>
        <div className="pt-2 border-t border-stone-200 text-xs text-stone-500 leading-relaxed">
          "Ah, this is all I need to decide" — seeing the total volume of decisions
          up front is the core feel of Posa.
        </div>
        <button
          type="button"
          disabled={!userChoseSomething}
          onClick={() => startWithComponents(selectedArr)}
          className="w-full mt-2 py-2.5 rounded-md bg-stone-900 text-stone-50 text-sm font-medium hover:bg-stone-800 transition disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed"
        >
          Get started
        </button>
        {!userChoseSomething && (
          <div className="text-[11px] text-stone-400 text-center">
            Select at least one component
          </div>
        )}
      </aside>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono tabular-nums text-2xl text-stone-900">{value}</span>
      <span className="text-xs text-stone-500 font-mono">{label}</span>
    </div>
  );
}
