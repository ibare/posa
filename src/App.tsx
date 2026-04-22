import { usePosaStore } from './store/posa-store';
import { OnboardingScreen } from './ui/onboarding/OnboardingScreen';
import { ExplorationView } from './ui/planes/ExplorationView';
import { Shell } from './ui/shared/layout/Shell';

export default function App() {
  const phase = usePosaStore((s) => s.phase);

  return (
    <Shell>
      {phase === 'onboarding' && <OnboardingScreen />}
      {phase === 'exploration' && <ExplorationView />}
      {phase === 'export' && <ExportPlaceholder />}
    </Shell>
  );
}

function ExportPlaceholder() {
  return (
    <div className="mx-auto max-w-3xl p-10 text-center text-sm text-stone-500">
      Export 뷰는 Prompt 05에서 구현됩니다.
    </div>
  );
}
