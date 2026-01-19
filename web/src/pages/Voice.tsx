// ============================================================================
// Voice Page
// Voice input and memo management
// ============================================================================

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VoicePanel } from '../components/features';

export function VoicePage() {
  const [searchParams] = useSearchParams();
  const eventIdFromUrl = searchParams.get('eventId');
  const [eventId] = useState(eventIdFromUrl);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Voice Commands</h2>
        <p className="text-sm text-ink/60">
          Speak to create events, ask questions, or record memos.
        </p>
      </div>

      <VoicePanel defaultEventId={eventId} />
    </div>
  );
}
