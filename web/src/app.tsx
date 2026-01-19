import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { IntakeFlow } from './components/features';
import { AppLayout } from './components/layout/AppLayout';
import { TimelinePage } from './pages/Timeline';
import { VoicePage } from './pages/Voice';
import { CalendarPage } from './pages/Calendar';
import { SettingsPage } from './pages/Settings';
import { RalphPage } from './pages/Ralph';
import { SummaryPage } from './pages/Summary';
import { OAuthCallback } from './pages/OAuthCallback';
import { ShowcasePage } from './pages/Showcase';
import { useUserStore } from './stores/user.store';
import { useEventsStore } from './stores/events.store';
import { useBouncerStore } from './stores/bouncer.store';
import { useRalphStore } from './stores/ralph.store';
import { NotificationTriggers } from './services/notification-triggers.service';

export default function App() {
  const location = useLocation();
  const themeId = useUserStore((s) => s.themeId);
  const intakeCompleted = useUserStore((s) => s.intakeCompleted);

  // Load data from DB on mount
  useEffect(() => {
    useUserStore.getState().loadFromDb();
    useEventsStore.getState().loadFromDb();
    useBouncerStore.getState().loadFromDb();
    useRalphStore.getState().loadFromDb();
  }, []);

  // Initialize notification triggers when intake is complete
  useEffect(() => {
    if (intakeCompleted) {
      NotificationTriggers.initialize();
      return () => {
        NotificationTriggers.stop();
      };
    }
  }, [intakeCompleted]);

  // Apply theme to body
  useEffect(() => {
    document.body.dataset.theme = themeId ?? 'moonlit';
  }, [themeId]);

  // Routes that bypass intake flow
  const bypassIntakePaths = ['/showcase', '/oauth/callback'];
  const shouldBypassIntake = bypassIntakePaths.some((path) => location.pathname.startsWith(path));

  // Show intake flow if not completed (unless on bypass route)
  if (!intakeCompleted && !shouldBypassIntake) {
    return <IntakeFlow />;
  }

  return (
    <Routes>
      {/* Showcase route (bypasses intake + layout) */}
      <Route path="/showcase" element={<ShowcasePage />} />

      {/* OAuth callback route (outside layout) */}
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* Main app routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/timeline" replace />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/voice" element={<VoicePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/ralph" element={<RalphPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
