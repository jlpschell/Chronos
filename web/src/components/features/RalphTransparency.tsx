// ============================================================================
// Ralph Transparency Component
// Shows what the AI has learned about the user
// ============================================================================

import { useEffect, useState } from 'react';
import { useRalphStore } from '../../stores/ralph.store';
import type { Pattern, Hypothesis } from '../../types';

export function RalphTransparency() {
  const {
    patterns,
    hypotheses,
    interactions,
    pendingNotifications,
    dismissNotification,
    removePattern,
    loadFromDb,
  } = useRalphStore();

  const [showAll, setShowAll] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const confirmedPatterns = patterns.filter((p) => p.confidence > 0.3);
  const activeHypotheses = hypotheses.filter((h) => h.status === 'testing');
  const recentInteractions = interactions.slice(-10).reverse();
  const activeNotifications = pendingNotifications.filter((n) => !n.dismissed);

  const totalLearnings = confirmedPatterns.length;
  const totalHypotheses = activeHypotheses.length;

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {activeNotifications.length > 0 && (
        <div className="space-y-2">
          {activeNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                notif.type === 'learned'
                  ? 'bg-green-500/10 border-green-500/30'
                  : notif.type === 'decay_warning'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {notif.type === 'learned' && '🧠'}
                  {notif.type === 'decay_warning' && '⚠️'}
                  {notif.type === 'auto_action' && '✨'}
                </span>
                <div>
                  <div className="text-sm font-medium">{notif.message}</div>
                  <div className="text-xs text-ink/50 mt-0.5">
                    {new Date(notif.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="text-ink/40 hover:text-ink text-sm"
                onClick={() => dismissNotification(notif.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">What I've Learned</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="bg-accent/20 text-accent px-2 py-1 rounded">
              {totalLearnings} confirmed
            </span>
            <span className="bg-ink/10 px-2 py-1 rounded">
              {totalHypotheses} testing
            </span>
          </div>
        </div>

        {totalLearnings === 0 && totalHypotheses === 0 ? (
          <div className="text-center py-8 text-ink/50">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm">
              I'm still learning about you. The more you use Chronos,
              the better I'll understand your preferences.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Confirmed Patterns */}
            {confirmedPatterns.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-ink/60 uppercase tracking-wide">
                  Confirmed Patterns
                </div>
                {(showAll ? confirmedPatterns : confirmedPatterns.slice(0, 3)).map(
                  (pattern) => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      onRemove={() => removePattern(pattern.id)}
                    />
                  )
                )}
                {!showAll && confirmedPatterns.length > 3 && (
                  <button
                    type="button"
                    className="text-xs text-accent hover:underline"
                    onClick={() => setShowAll(true)}
                  >
                    Show {confirmedPatterns.length - 3} more...
                  </button>
                )}
              </div>
            )}

            {/* Active Hypotheses */}
            {activeHypotheses.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-ink/60 uppercase tracking-wide">
                  Currently Testing
                </div>
                {activeHypotheses.slice(0, 2).map((hypothesis) => (
                  <HypothesisCard key={hypothesis.id} hypothesis={hypothesis} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {recentInteractions.length > 0 && (
        <details className="rounded-lg border border-border bg-surface">
          <summary className="p-4 cursor-pointer font-medium text-sm">
            Recent Interactions ({interactions.length} total)
          </summary>
          <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
            {recentInteractions.map((interaction) => (
              <div
                key={interaction.id}
                className="text-xs p-2 rounded bg-canvas border border-border"
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium">{interaction.suggestionType}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      interaction.userResponse === 'accepted'
                        ? 'bg-green-500/20 text-green-600'
                        : interaction.userResponse === 'rejected'
                        ? 'bg-red-500/20 text-red-600'
                        : 'bg-amber-500/20 text-amber-600'
                    }`}
                  >
                    {interaction.userResponse}
                  </span>
                </div>
                <div className="text-ink/50 mt-1 truncate">
                  {interaction.suggestionText}
                </div>
                <div className="text-ink/40 mt-0.5">
                  {new Date(interaction.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

interface PatternCardProps {
  pattern: Pattern;
  onRemove: () => void;
}

function PatternCard({ pattern, onRemove }: PatternCardProps) {
  const confidencePercent = Math.round(pattern.confidence * 100);
  const isDecaying = pattern.overridesSinceConfirm > 2;

  return (
    <div className="p-3 rounded-lg bg-canvas border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-medium">{pattern.description}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-ink/50">
            <span>Used {pattern.applicationCount}x</span>
            <span>
              Confidence: {confidencePercent}%
              {isDecaying && <span className="text-amber-500 ml-1">(decaying)</span>}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="text-xs text-ink/40 hover:text-red-500 transition-colors"
          onClick={onRemove}
          title="Remove this pattern"
        >
          ✕
        </button>
      </div>
      <div className="mt-2 h-1 bg-ink/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isDecaying ? 'bg-amber-500' : 'bg-accent'
          }`}
          style={{ width: `${confidencePercent}%` }}
        />
      </div>
    </div>
  );
}

interface HypothesisCardProps {
  hypothesis: Hypothesis;
}

function HypothesisCard({ hypothesis }: HypothesisCardProps) {
  const progress =
    hypothesis.confirmations / hypothesis.confidenceRequired;

  return (
    <div className="p-3 rounded-lg bg-ink/5 border border-border/50">
      <div className="text-sm text-ink/80">{hypothesis.hypothesis}</div>
      <div className="flex items-center gap-3 mt-2 text-xs text-ink/50">
        <span>Tests: {hypothesis.testsRun}</span>
        <span>
          ✓ {hypothesis.confirmations} / ✗ {hypothesis.rejections}
        </span>
      </div>
      <div className="mt-2 h-1 bg-ink/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent/50 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
