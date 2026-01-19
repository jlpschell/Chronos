// ============================================================================
// Ralph Page
// AI transparency - "What I've learned about you"
// ============================================================================

import { useState } from 'react';

import { RalphTransparency, CoachingPanel } from '../components/features';
import { useUserStore } from '../stores/user.store';

export function RalphPage() {
  const goals = useUserStore((s) => s.goals);
  const activeGoals = goals.filter((g) => g.status === 'active' || g.status === 'drifting');
  const [showCoaching, setShowCoaching] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const selectedGoal = selectedGoalId ? goals.find((g) => g.id === selectedGoalId) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ralph AI</h2>
          <p className="text-sm text-ink/60">
            See what I've learned about your preferences and patterns.
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 flex items-center gap-2"
          onClick={() => {
            setSelectedGoalId(null);
            setShowCoaching(true);
          }}
        >
          <span>💬</span>
          <span>Talk to Coach</span>
        </button>
      </div>

      <RalphTransparency />

      {/* Coaching for Goals */}
      {activeGoals.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold">Get coaching on a goal</h3>
          <div className="flex flex-wrap gap-2">
            {activeGoals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                className="px-3 py-1.5 text-xs rounded-lg bg-ink/5 hover:bg-accent/10 hover:text-accent transition-colors flex items-center gap-1"
                onClick={() => {
                  setSelectedGoalId(goal.id);
                  setShowCoaching(true);
                }}
              >
                <span>{goal.status === 'drifting' ? '⚠️' : '🎯'}</span>
                <span className="truncate max-w-[150px]">{goal.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Coaching Modal */}
      {showCoaching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md">
            <CoachingPanel goal={selectedGoal} onClose={() => setShowCoaching(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
