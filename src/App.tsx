import { Navigate, Route, Routes } from 'react-router-dom';
import { ReviewView } from './ui/review/ReviewView';
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
          <Shell>
            <ExplorationView />
          </Shell>
        }
      />
      <Route
        path="/atlas"
        element={
          <Shell>
            <PrimitiveAtlas />
          </Shell>
        }
      />
      <Route
        path="/review"
        element={
          <Shell>
            <ReviewView />
          </Shell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
