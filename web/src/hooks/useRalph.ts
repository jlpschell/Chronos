// ============================================================================
// useRalph Hook
// Easy integration with Ralph Loop for any component making suggestions
// ============================================================================

import { useCallback, useMemo } from 'react';
import { useRalphStore } from '../stores/ralph.store';
import { useUserStore } from '../stores/user.store';
import type {
  SuggestionType,
  UserResponse,
  InteractionContext,
  PatternAction,
} from '../types';

// ----------------------------------------------------------------------------
// Context Builder
// ----------------------------------------------------------------------------

function getTimeOfDay(): InteractionContext['timeOfDay'] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getDayType(): InteractionContext['dayType'] {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? 'weekend' : 'weekday';
}

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

export function useRalph() {
  const {
    logInteraction,
    applyPatterns,
    getActiveHypotheses,
    getConfirmedPatterns,
    getUserLearnings,
    pendingNotifications,
    dismissNotification,
  } = useRalphStore();

  const goals = useUserStore((s) => s.goals);

  // Build current context
  const getCurrentContext = useCallback(
    (overrides?: Partial<InteractionContext>): InteractionContext => {
      const recentInteractions = useRalphStore.getState().interactions;
      const recentOverrides = recentInteractions
        .slice(-20)
        .filter(
          (i) =>
            i.userResponse === 'rejected' ||
            i.userResponse === 'modified'
        ).length;

      return {
        timeOfDay: getTimeOfDay(),
        dayOfWeek: new Date().getDay(),
        dayType: getDayType(),
        currentLoad: 'moderate', // TODO: derive from calendar
        previousTaskType: null,
        minutesSincePreviousTask: null,
        energyIndicator: null,
        recentOverrideCount: recentOverrides,
        activeGoalIds: goals.filter((g) => g.status === 'active').map((g) => g.id),
        ...overrides,
      };
    },
    [goals]
  );

  // Track a suggestion and user response
  const trackSuggestion = useCallback(
    (
      type: SuggestionType,
      suggestionText: string,
      response: UserResponse,
      contextOverrides?: Partial<InteractionContext>,
      options?: {
        targetEventId?: string;
        userActionText?: string;
      }
    ) => {
      const context = getCurrentContext(contextOverrides);

      // Check if this is a hypothesis test
      const activeHypothesis = getActiveHypotheses().find(
        (h) => h.triggerCondition.suggestionType === type
      );

      logInteraction(type, suggestionText, response, context, {
        ...options,
        hypothesisId: activeHypothesis?.id,
      });
    },
    [getCurrentContext, getActiveHypotheses, logInteraction]
  );

  // Get modifications to apply based on learned patterns
  const getPatternModifications = useCallback(
    (contextOverrides?: Partial<InteractionContext>): PatternAction[] => {
      const context = getCurrentContext(contextOverrides);
      return applyPatterns(context);
    },
    [getCurrentContext, applyPatterns]
  );

  // Check if we should skip a suggestion type based on patterns
  const shouldSkipSuggestion = useCallback(
    (type: SuggestionType, contextOverrides?: Partial<InteractionContext>): boolean => {
      const modifications = getPatternModifications(contextOverrides);
      return modifications.some((m) => m.type === 'skip_suggestion');
    },
    [getPatternModifications]
  );

  // Check if we're testing a hypothesis for this suggestion type
  const isTestingHypothesis = useCallback(
    (type: SuggestionType) => {
      return getActiveHypotheses().find(
        (h) => h.triggerCondition.suggestionType === type
      );
    },
    [getActiveHypotheses]
  );

  // Get human-readable learnings for transparency UI
  const learnings = useMemo(() => getUserLearnings(), [getUserLearnings]);

  // Get active notifications (learned, auto_action, decay_warning)
  const notifications = useMemo(
    () => pendingNotifications.filter((n) => !n.dismissed),
    [pendingNotifications]
  );

  return {
    // Actions
    trackSuggestion,
    getPatternModifications,
    shouldSkipSuggestion,
    isTestingHypothesis,
    dismissNotification,

    // Context
    getCurrentContext,

    // Data
    learnings,
    notifications,
    patterns: getConfirmedPatterns(),
    activeHypotheses: getActiveHypotheses(),
  };
}

// ----------------------------------------------------------------------------
// Convenience Hooks
// ----------------------------------------------------------------------------

/**
 * Hook for components that only need to track suggestions
 */
export function useTrackSuggestion() {
  const { trackSuggestion, shouldSkipSuggestion } = useRalph();
  return { trackSuggestion, shouldSkipSuggestion };
}

/**
 * Hook for transparency UI ("What have you learned about me?")
 */
export function useLearnings() {
  const { learnings, patterns, activeHypotheses } = useRalph();
  return { learnings, patterns, activeHypotheses };
}

/**
 * Hook for Ralph notifications
 */
export function useRalphNotifications() {
  const { notifications, dismissNotification } = useRalph();
  return { notifications, dismissNotification };
}
