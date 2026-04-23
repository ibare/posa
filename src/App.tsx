import { usePosaStore } from './store/posa-store';
import { ExportView } from './ui/export/ExportView';
import { ExplorationView } from './ui/planes/ExplorationView';
import { PrimitiveAtlas } from './ui/primitives/PrimitiveAtlas';
import { Shell } from './ui/shared/layout/Shell';

export default function App() {
  const phase = usePosaStore((s) => s.phase);

  return (
    <Shell>
      {phase === 'exploration' && <ExplorationView />}
      {phase === 'atlas' && <PrimitiveAtlas />}
      {phase === 'export' && <ExportView />}
    </Shell>
  );
}
