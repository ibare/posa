import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePosaStore } from './store/posa-store';
import { ExportView } from './ui/export/ExportView';
import { OnboardingScreen } from './ui/onboarding/OnboardingScreen';
import { ExplorationView } from './ui/planes/ExplorationView';
import { PrimitiveAtlas } from './ui/primitives/PrimitiveAtlas';
import { Shell } from './ui/shared/layout/Shell';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OnboardingScreen />} />
      <Route
        path="/explore"
        element={
          <RequireActive>
            <Shell>
              <ExplorationView />
            </Shell>
          </RequireActive>
        }
      />
      <Route
        path="/atlas"
        element={
          <RequireActive>
            <Shell>
              <PrimitiveAtlas />
            </Shell>
          </RequireActive>
        }
      />
      <Route
        path="/review"
        element={
          <RequireActive>
            <Shell>
              <ExportView />
            </Shell>
          </RequireActive>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * 온보딩 미완료 상태에서 하위 화면 진입 차단.
 * activeComponentIds가 비어있으면 무조건 온보딩으로 리다이렉트.
 */
function RequireActive({ children }: { children: ReactNode }) {
  const hasActive = usePosaStore((s) => s.activeComponentIds.length > 0);
  if (!hasActive) return <Navigate to="/" replace />;
  return <>{children}</>;
}
