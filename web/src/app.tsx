import { useEffect, useState } from 'react';

import { ThemeSelector, VoicePanel, TimelineView, CalendarConnect, IntakeFlow } from './components/features';
import { useUserStore } from './stores/user.store';
import { useEventsStore } from './stores/events.store';
import type { ChronosEvent } from './types';
import './styles/themes.css';

export default function App() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'voice' | 'calendar'>('timeline');
  const themeId = useUserStore((s) => s.themeId);
  const intakeCompleted = useUserStore((s) => s.intakeCompleted);

  // Load events from DB on mount
  useEffect(() => {
    useEventsStore.getState().loadFromDb();
  }, []);

  useEffect(() => {
    document.body.dataset.theme = themeId ?? 'moonlit';
  }, [themeId]);

  const handleEventClick = (event: ChronosEvent) => {
    setSelectedEventId(event.id);
  };

  // Show intake flow if not completed
  if (!intakeCompleted) {
    return <IntakeFlow />;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <main className="mx-auto max-w-5xl p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Chronos</h1>
            <p className="text-sm text-ink opacity-70">
              Time GPS • Voice-first calendar
            </p>
          </div>
          <ThemeSelector />
        </header>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            type="button"
            className={`px-4 py-2 text-sm rounded-t transition-colors ${
              activeTab === 'timeline'
                ? 'bg-accent text-white'
                : 'hover:bg-ink/5'
            }`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm rounded-t transition-colors ${
              activeTab === 'voice'
                ? 'bg-accent text-white'
                : 'hover:bg-ink/5'
            }`}
            onClick={() => setActiveTab('voice')}
          >
            Voice
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm rounded-t transition-colors ${
              activeTab === 'calendar'
                ? 'bg-accent text-white'
                : 'hover:bg-ink/5'
            }`}
            onClick={() => setActiveTab('calendar')}
          >
            Calendar
          </button>
        </div>

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <TimelineView
              onEventClick={handleEventClick}
              selectedEventId={selectedEventId}
            />

            {selectedEventId && (
              <div className="rounded border border-border bg-surface p-4">
                <div className="text-sm font-medium mb-2">Selected Event</div>
                <div className="text-xs text-ink/60">ID: {selectedEventId}</div>
                <p className="text-xs text-ink/50 mt-2">
                  Use Voice tab to attach memos to this event.
                </p>
              </div>
            )}

            <p className="text-xs text-ink/40 text-center">
              Tip: Try saying "Schedule meeting tomorrow morning" in the Voice tab
            </p>
          </div>
        )}

        {activeTab === 'voice' && (
          <VoicePanel defaultEventId={selectedEventId} />
        )}

        {activeTab === 'calendar' && (
          <CalendarConnect />
        )}
      </main>
    </div>
  );
}
