// ============================================================================
// Calendar Page
// Calendar sync and management
// ============================================================================

import { CalendarConnect } from '../components/features';

export function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Calendar Integration</h2>
        <p className="text-sm text-ink/60">
          Connect your calendars to sync events.
        </p>
      </div>

      <CalendarConnect />
    </div>
  );
}
