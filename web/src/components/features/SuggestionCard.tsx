// ============================================================================
// SuggestionCard Component
// Ralph suggestion UI with accept/reject/modify actions
// ============================================================================

import { useCallback, useState } from 'react';

import { useRalph } from '../../hooks/useRalph';
import type { SuggestionType } from '../../types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface SuggestionCardProps {
  type: SuggestionType;
  title: string;
  description: string;
  targetEventId?: string;
  onAccept?: () => void;
  onReject?: () => void;
  onModify?: (modification: string) => void;
  showModify?: boolean;
  autoHide?: boolean;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function SuggestionCard({
  type,
  title,
  description,
  targetEventId,
  onAccept,
  onReject,
  onModify,
  showModify = false,
  autoHide = true,
}: SuggestionCardProps) {
  const { trackSuggestion, shouldSkipSuggestion, isTestingHypothesis } = useRalph();

  const [isVisible, setIsVisible] = useState(true);
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [modifyText, setModifyText] = useState('');

  // Check if we should skip this suggestion based on patterns
  const shouldSkip = shouldSkipSuggestion(type);
  const hypothesis = isTestingHypothesis(type);

  const handleAccept = useCallback(() => {
    trackSuggestion(type, description, 'accepted', undefined, { targetEventId });
    onAccept?.();
    if (autoHide) setIsVisible(false);
  }, [type, description, targetEventId, trackSuggestion, onAccept, autoHide]);

  const handleReject = useCallback(() => {
    trackSuggestion(type, description, 'rejected', undefined, { targetEventId });
    onReject?.();
    if (autoHide) setIsVisible(false);
  }, [type, description, targetEventId, trackSuggestion, onReject, autoHide]);

  const handleModify = useCallback(() => {
    if (!modifyText.trim()) return;
    trackSuggestion(type, description, 'modified', undefined, {
      targetEventId,
      userActionText: modifyText,
    });
    onModify?.(modifyText);
    if (autoHide) setIsVisible(false);
  }, [type, description, targetEventId, modifyText, trackSuggestion, onModify, autoHide]);

  const handleIgnore = useCallback(() => {
    trackSuggestion(type, description, 'ignored', undefined, { targetEventId });
    if (autoHide) setIsVisible(false);
  }, [type, description, targetEventId, trackSuggestion, autoHide]);

  // Don't render if pattern says to skip
  if (shouldSkip || !isVisible) {
    return null;
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div>
            <h4 className="text-sm font-medium">{title}</h4>
            <p className="text-xs text-ink/60 mt-0.5">{description}</p>
          </div>
        </div>
        <button
          type="button"
          className="text-ink/30 hover:text-ink/60 text-xs"
          onClick={handleIgnore}
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Hypothesis indicator */}
      {hypothesis && (
        <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
          🧪 Testing a hypothesis
        </div>
      )}

      {/* Modify input */}
      {showModifyInput && (
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-2 py-1 text-sm rounded border border-border bg-canvas"
            placeholder="How would you modify this?"
            value={modifyText}
            onChange={(e) => setModifyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleModify();
              if (e.key === 'Escape') setShowModifyInput(false);
            }}
            autoFocus
          />
          <button
            type="button"
            className="px-2 py-1 text-xs rounded bg-accent text-white"
            onClick={handleModify}
          >
            Apply
          </button>
        </div>
      )}

      {/* Actions */}
      {!showModifyInput && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded bg-accent text-white hover:bg-accent/90"
            onClick={handleAccept}
          >
            ✓ Accept
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs rounded border border-border hover:bg-ink/5"
            onClick={handleReject}
          >
            ✗ Reject
          </button>
          {showModify && (
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded border border-border hover:bg-ink/5"
              onClick={() => setShowModifyInput(true)}
            >
              ✎ Modify
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Preset Suggestion Types
// ----------------------------------------------------------------------------

interface GapFillSuggestionProps {
  gapStart: Date;
  gapEnd: Date;
  suggestedActivity: string;
  onAccept: () => void;
  onReject: () => void;
}

export function GapFillSuggestion({
  gapStart,
  gapEnd,
  suggestedActivity,
  onAccept,
  onReject,
}: GapFillSuggestionProps) {
  const duration = Math.round((gapEnd.getTime() - gapStart.getTime()) / (1000 * 60));
  const timeStr = gapStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SuggestionCard
      type="gap_fill"
      title={`${duration} min gap at ${timeStr}`}
      description={`How about: ${suggestedActivity}?`}
      onAccept={onAccept}
      onReject={onReject}
      showModify
    />
  );
}

interface BufferSuggestionProps {
  eventTitle: string;
  bufferMinutes: number;
  position: 'before' | 'after';
  onAccept: () => void;
  onReject: () => void;
}

export function BufferSuggestion({
  eventTitle,
  bufferMinutes,
  position,
  onAccept,
  onReject,
}: BufferSuggestionProps) {
  return (
    <SuggestionCard
      type="buffer_add"
      title={`Add ${bufferMinutes}min buffer`}
      description={`${position === 'before' ? 'Before' : 'After'} "${eventTitle}" for prep/transition`}
      onAccept={onAccept}
      onReject={onReject}
    />
  );
}

interface RecoverySuggestionProps {
  afterEventTitle: string;
  onAccept: () => void;
  onReject: () => void;
}

export function RecoverySuggestion({
  afterEventTitle,
  onAccept,
  onReject,
}: RecoverySuggestionProps) {
  return (
    <SuggestionCard
      type="recovery_suggest"
      title="Recovery time?"
      description={`After "${afterEventTitle}" - take a short break to recharge`}
      onAccept={onAccept}
      onReject={onReject}
    />
  );
}

interface GoalNudgeSuggestionProps {
  goalText: string;
  daysSinceActivity: number;
  onAccept: () => void;
  onReject: () => void;
}

export function GoalNudgeSuggestion({
  goalText,
  daysSinceActivity,
  onAccept,
  onReject,
}: GoalNudgeSuggestionProps) {
  return (
    <SuggestionCard
      type="goal_nudge"
      title="Goal check-in"
      description={`"${goalText}" hasn't had activity in ${daysSinceActivity} days. Time to revisit?`}
      onAccept={onAccept}
      onReject={onReject}
    />
  );
}
