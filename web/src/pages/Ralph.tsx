// ============================================================================
// Ralph Page
// AI transparency - "What I've learned about you"
// ============================================================================

import { RalphTransparency } from '../components/features';

export function RalphPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Ralph AI</h2>
        <p className="text-sm text-ink/60">
          See what I've learned about your preferences and patterns.
        </p>
      </div>

      <RalphTransparency />

      <div className="rounded-lg border border-border bg-surface/50 p-4 text-sm text-ink/60">
        <p className="font-medium text-ink mb-2">How Ralph works</p>
        <ul className="space-y-1 text-xs">
          <li>• I observe your interactions silently (75-80% autonomous)</li>
          <li>• After 3+ similar actions, I form a hypothesis</li>
          <li>• I test the hypothesis by adjusting suggestions</li>
          <li>• Confirmed patterns become automatic behavior</li>
          <li>• If you override a pattern, I'll ask before removing it</li>
        </ul>
      </div>
    </div>
  );
}
