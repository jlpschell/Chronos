// ============================================================================
// Timeline Page
// Time GPS visualization
// ============================================================================

import { useState } from 'react';
import { TimelineView } from '../components/features';
import { useEventsStore } from '../stores/events.store';
import { ConditionalState, EmptyEvents } from '../components/ui';
import type { ChronosEvent } from '../types';

export function TimelinePage() {
  const { events, loading } = useEventsStore();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleEventClick = (event: ChronosEvent) => {
    setSelectedEventId(event.id);
  };

  return (
    <div className="space-y-4">
      <ConditionalState
        isLoading={loading}
        loadingMessage="Loading timeline..."
        isEmpty={events.length === 0}
        emptyState={
          <EmptyEvents
            onAdd={() => {
              // Could open voice panel or event creation
              window.location.href = '/voice';
            }}
          />
        }
      >
        <TimelineView
          onEventClick={handleEventClick}
          selectedEventId={selectedEventId}
        />
      </ConditionalState>

      {selectedEventId && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="text-sm font-medium mb-2">Selected Event</div>
          <div className="text-xs text-ink/60">ID: {selectedEventId}</div>
          <p className="text-xs text-ink/50 mt-2">
            Go to Voice tab to attach memos to this event.
          </p>
        </div>
      )}

      <p className="text-xs text-ink/40 text-center">
        Tip: Try saying "Schedule meeting tomorrow morning" in the Voice tab
      </p>
    </div>
  );
}
