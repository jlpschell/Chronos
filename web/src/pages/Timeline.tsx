// ============================================================================
// Timeline Page
// Time GPS visualization
// ============================================================================

import { useState } from 'react';
import { TimelineView } from '../components/features';
import type { ChronosEvent } from '../types';

export function TimelinePage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleEventClick = (event: ChronosEvent) => {
    setSelectedEventId(event.id);
  };

  return (
    <div className="space-y-4">
      <TimelineView
        onEventClick={handleEventClick}
        selectedEventId={selectedEventId}
      />

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
