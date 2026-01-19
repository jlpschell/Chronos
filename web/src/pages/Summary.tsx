// ============================================================================
// Summary Page
// Daily/weekly/monthly summaries
// ============================================================================

import { SummaryPanel } from '../components/features';

export function SummaryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Summaries</h2>
        <p className="text-sm text-ink/60">
          Your narrative view of time, progress, and patterns.
        </p>
      </div>

      <SummaryPanel />
    </div>
  );
}
