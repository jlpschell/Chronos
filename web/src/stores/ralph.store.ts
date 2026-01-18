// ============================================================================
// RALPH LOOP STORE
// Self-learning intelligence engine - handles 75-80% of decisions autonomously
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { RALPH_CONFIG } from '../lib/config';
import { db } from '../db/schema';
import type {
  Interaction,
  Hypothesis,
  Pattern,
  SuggestionType,
  UserResponse,
  InteractionContext,
  PatternAction,
  PatternTrigger,
  TriggerCondition,
} from '../types';

// ----------------------------------------------------------------------------
// Store Interface
// ----------------------------------------------------------------------------

interface RalphStore {
  // State
  interactions: Interaction[];
  hypotheses: Hypothesis[];
  patterns: Pattern[];
  pendingNotifications: RalphNotification[];

  // Core actions
  logInteraction: (
    type: SuggestionType,
    text: string,
    response: UserResponse,
    context: InteractionContext,
    options?: {
      targetEventId?: string;
      userActionText?: string;
      hypothesisId?: string;
    }
  ) => void;

  // Hypothesis management
  checkForHypothesis: (interaction: Interaction) => Hypothesis | null;
  testHypothesis: (hypothesisId: string, wasAccepted: boolean) => void;

  // Pattern management
  promoteToPattern: (hypothesisId: string) => Pattern;
  applyPatterns: (context: InteractionContext) => PatternAction[];
  checkPatternDecay: (patternId: string, wasOverridden: boolean) => void;
  removePattern: (patternId: string) => void;

  // Queries
  getActiveHypotheses: () => Hypothesis[];
  getConfirmedPatterns: () => Pattern[];
  getSimilarOverrides: (type: SuggestionType, context: InteractionContext) => Interaction[];
  getUserLearnings: () => string[];

  // Notifications
  addNotification: (notification: Omit<RalphNotification, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;

  // Persistence
  syncToDb: () => Promise<void>;
  loadFromDb: () => Promise<void>;
}

// ----------------------------------------------------------------------------
// Notification Type (for "Learned: X" notifications)
// ----------------------------------------------------------------------------

interface RalphNotification {
  id: string;
  type: 'learned' | 'auto_action' | 'decay_warning';
  message: string;
  createdAt: Date;
  dismissed: boolean;
}

// ----------------------------------------------------------------------------
// Store Implementation
// ----------------------------------------------------------------------------

export const useRalphStore = create<RalphStore>()(
  persist(
    immer((set, get) => ({
      interactions: [],
      hypotheses: [],
      patterns: [],
      pendingNotifications: [],

      // ------------------------------------------------------------------
      // Core: Log Interaction
      // ------------------------------------------------------------------

      logInteraction: (type, text, response, context, options = {}) => {
        const interaction: Interaction = {
          id: nanoid(),
          timestamp: new Date(),
          suggestionType: type,
          suggestionText: text,
          userResponse: response,
          context,
          targetEventId: options.targetEventId ?? null,
          userActionText: options.userActionText ?? null,
          hypothesisId: options.hypothesisId ?? null,
        };

        set((state) => {
          state.interactions.push(interaction);

          // Keep only last 1000 interactions
          if (state.interactions.length > 1000) {
            state.interactions = state.interactions.slice(-1000);
          }
        });

        // Check if this triggers a hypothesis (silent - 75-80% autonomy)
        if (response === 'rejected' || response === 'modified') {
          const hypothesis = get().checkForHypothesis(interaction);
          if (hypothesis) {
            set((state) => {
              state.hypotheses.push(hypothesis);
            });
          }
        }

        // Check if this was a hypothesis test
        if (options.hypothesisId) {
          get().testHypothesis(options.hypothesisId, response === 'accepted');
        }

        // Check pattern decay
        const patterns = get().patterns;
        const relevantPatterns = patterns.filter((p) => {
          const cond = p.trigger.conditions as TriggerCondition;
          return cond.suggestionType === type;
        });

        relevantPatterns.forEach((p) => {
          get().checkPatternDecay(p.id, response !== 'accepted');
        });

        // Sync to IndexedDB
        db.interactions.add(interaction);
      },

      // ------------------------------------------------------------------
      // Hypothesis Management
      // ------------------------------------------------------------------

      checkForHypothesis: (interaction) => {
        const { hypotheses } = get();

        // Don't create if too many active
        const activeCount = hypotheses.filter((h) => h.status === 'testing').length;
        if (activeCount >= RALPH_CONFIG.maxActiveHypotheses) return null;

        // Find similar overrides
        const similar = get().getSimilarOverrides(
          interaction.suggestionType,
          interaction.context
        );

        // Need threshold overrides to generate hypothesis
        if (similar.length < RALPH_CONFIG.hypothesisThreshold) return null;

        // Check for existing hypothesis on this pattern
        const existing = hypotheses.find(
          (h) =>
            h.status === 'testing' &&
            h.triggerCondition.suggestionType === interaction.suggestionType &&
            contextMatches(h.triggerCondition.contextMatchers, interaction.context)
        );
        if (existing) return null;

        // Generate hypothesis (silent - no user notification)
        return generateHypothesis(similar, interaction);
      },

      testHypothesis: (hypothesisId, wasAccepted) => {
        set((state) => {
          const hypothesis = state.hypotheses.find((h) => h.id === hypothesisId);
          if (!hypothesis || hypothesis.status !== 'testing') return;

          hypothesis.testsRun++;

          if (wasAccepted) {
            hypothesis.confirmations++;

            if (hypothesis.confirmations >= hypothesis.confidenceRequired) {
              hypothesis.status = 'confirmed';
              hypothesis.resolvedAt = new Date();

              // Promote to pattern
              const pattern = get().promoteToPattern(hypothesisId);
              hypothesis.resultingPatternId = pattern.id;

              // Notify user (this is the 20-25% where we surface)
              if (RALPH_CONFIG.notifyOnNewPattern) {
                get().addNotification({
                  type: 'learned',
                  message: `Learned: ${pattern.description}`,
                });
              }
            }
          } else {
            hypothesis.rejections++;

            if (hypothesis.rejections >= hypothesis.confidenceRequired) {
              hypothesis.status = 'rejected';
              hypothesis.resolvedAt = new Date();
            }
          }

          // Mark stale if too many tests
          if (hypothesis.testsRun >= RALPH_CONFIG.maxTestsBeforeStale) {
            hypothesis.status = 'stale';
            hypothesis.resolvedAt = new Date();
          }
        });
      },

      promoteToPattern: (hypothesisId) => {
        const hypothesis = get().hypotheses.find((h) => h.id === hypothesisId);
        if (!hypothesis) throw new Error('Hypothesis not found');

        const pattern: Pattern = {
          id: nanoid(),
          description: hypothesis.hypothesis,
          trigger: {
            type: inferTriggerType(hypothesis.triggerCondition),
            conditions: hypothesis.triggerCondition as unknown as Record<string, unknown>,
          },
          action: inferAction(hypothesis.testApproach),
          confidence: RALPH_CONFIG.initialConfidence,
          confirmedAt: new Date(),
          sourceHypothesisId: hypothesisId,
          applicationCount: 0,
          overridesSinceConfirm: 0,
          lastApplied: null,
          decayWarningIssued: false,
        };

        set((state) => {
          state.patterns.push(pattern);
        });

        // Persist to DB
        db.patterns.add(pattern);

        return pattern;
      },

      applyPatterns: (context) => {
        const patterns = get().getConfirmedPatterns();
        const actions: PatternAction[] = [];

        for (const pattern of patterns) {
          if (patternMatchesContext(pattern.trigger, context)) {
            actions.push(pattern.action);

            // Update tracking (silent)
            set((state) => {
              const p = state.patterns.find((x) => x.id === pattern.id);
              if (p) {
                p.applicationCount++;
                p.lastApplied = new Date();
                p.confidence = Math.min(1, p.confidence + RALPH_CONFIG.confidenceBoostPerUse);
              }
            });
          }
        }

        return actions;
      },

      checkPatternDecay: (patternId, wasOverridden) => {
        if (!wasOverridden) return;

        set((state) => {
          const pattern = state.patterns.find((p) => p.id === patternId);
          if (!pattern) return;

          pattern.overridesSinceConfirm++;
          pattern.confidence = Math.max(
            0,
            pattern.confidence - RALPH_CONFIG.confidenceDecayPerOverride
          );

          // Warn user if pattern is decaying (this is the 20-25%)
          if (
            pattern.overridesSinceConfirm >= RALPH_CONFIG.decayThreshold &&
            !pattern.decayWarningIssued
          ) {
            pattern.decayWarningIssued = true;

            if (RALPH_CONFIG.askBeforeRemovingPattern) {
              get().addNotification({
                type: 'decay_warning',
                message: `I thought you ${pattern.description.toLowerCase()}, but you've been doing the opposite. Should I forget this?`,
              });
            }
          }
        });
      },

      removePattern: (patternId) => {
        set((state) => {
          state.patterns = state.patterns.filter((p) => p.id !== patternId);
        });
        db.patterns.delete(patternId);
      },

      // ------------------------------------------------------------------
      // Queries
      // ------------------------------------------------------------------

      getActiveHypotheses: () => {
        return get().hypotheses.filter((h) => h.status === 'testing');
      },

      getConfirmedPatterns: () => {
        return get().patterns.filter((p) => p.confidence > 0.3);
      },

      getSimilarOverrides: (type, context) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - RALPH_CONFIG.observationWindowDays);

        return get().interactions.filter(
          (i) =>
            i.timestamp > cutoff &&
            i.suggestionType === type &&
            (i.userResponse === 'rejected' || i.userResponse === 'modified') &&
            contextSimilarity(i.context, context) > 0.6
        );
      },

      getUserLearnings: () => {
        return get()
          .getConfirmedPatterns()
          .map((p) => p.description);
      },

      // ------------------------------------------------------------------
      // Notifications
      // ------------------------------------------------------------------

      addNotification: (notification) => {
        set((state) => {
          state.pendingNotifications.push({
            ...notification,
            id: nanoid(),
            createdAt: new Date(),
            dismissed: false,
          });
        });
      },

      dismissNotification: (id) => {
        set((state) => {
          const notif = state.pendingNotifications.find((n) => n.id === id);
          if (notif) notif.dismissed = true;
        });
      },

      clearNotifications: () => {
        set((state) => {
          state.pendingNotifications = [];
        });
      },

      // ------------------------------------------------------------------
      // Persistence
      // ------------------------------------------------------------------

      syncToDb: async () => {
        const state = get();
        await db.hypotheses.bulkPut(state.hypotheses);
        await db.patterns.bulkPut(state.patterns);
      },

      loadFromDb: async () => {
        const [interactions, hypotheses, patterns] = await Promise.all([
          db.interactions.orderBy('timestamp').reverse().limit(500).toArray(),
          db.hypotheses.toArray(),
          db.patterns.toArray(),
        ]);

        set((state) => {
          state.interactions = interactions.reverse();
          state.hypotheses = hypotheses;
          state.patterns = patterns;
        });
      },
    })),
    {
      name: 'chronos-ralph',
      partialize: (state) => ({
        interactions: state.interactions.slice(-200),
        hypotheses: state.hypotheses,
        patterns: state.patterns,
      }),
    }
  )
);

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function contextMatches(
  matchers: Partial<InteractionContext>,
  context: InteractionContext
): boolean {
  for (const [key, value] of Object.entries(matchers)) {
    if (context[key as keyof InteractionContext] !== value) return false;
  }
  return true;
}

function contextSimilarity(a: InteractionContext, b: InteractionContext): number {
  let score = 0;
  const w = RALPH_CONFIG.contextMatchWeight;

  if (a.timeOfDay === b.timeOfDay) score += w.timeOfDay;
  if (a.dayType === b.dayType) score += w.dayType;
  if (a.currentLoad === b.currentLoad) score += w.currentLoad;
  if (a.energyIndicator === b.energyIndicator) score += w.energyIndicator;

  return score;
}

function generateHypothesis(similar: Interaction[], trigger: Interaction): Hypothesis {
  const commonContext = findCommonContext(similar);
  const observation = describeObservation(trigger.suggestionType, similar.length, commonContext);
  const hypothesis = inferHypothesis(trigger.suggestionType, commonContext);
  const testApproach = inferTestApproach(trigger.suggestionType, hypothesis);

  return {
    id: nanoid(),
    createdAt: new Date(),
    triggerInteractionIds: similar.map((i) => i.id),
    observation,
    hypothesis,
    testApproach,
    triggerCondition: {
      suggestionType: trigger.suggestionType,
      contextMatchers: commonContext,
    },
    testsRun: 0,
    confirmations: 0,
    rejections: 0,
    confidenceRequired: RALPH_CONFIG.confirmationRequired,
    status: 'testing',
    resolvedAt: null,
    resultingPatternId: null,
  };
}

function findCommonContext(interactions: Interaction[]): Partial<InteractionContext> {
  const common: Partial<InteractionContext> = {};
  const threshold = interactions.length * 0.7;

  const counts = {
    timeOfDay: new Map<string, number>(),
    energyIndicator: new Map<string, number>(),
    dayType: new Map<string, number>(),
  };

  for (const i of interactions) {
    counts.timeOfDay.set(i.context.timeOfDay, (counts.timeOfDay.get(i.context.timeOfDay) || 0) + 1);
    counts.dayType.set(i.context.dayType, (counts.dayType.get(i.context.dayType) || 0) + 1);
    if (i.context.energyIndicator) {
      counts.energyIndicator.set(
        i.context.energyIndicator,
        (counts.energyIndicator.get(i.context.energyIndicator) || 0) + 1
      );
    }
  }

  for (const [time, count] of counts.timeOfDay) {
    if (count >= threshold) common.timeOfDay = time as InteractionContext['timeOfDay'];
  }
  for (const [energy, count] of counts.energyIndicator) {
    if (count >= threshold) common.energyIndicator = energy as InteractionContext['energyIndicator'];
  }
  for (const [day, count] of counts.dayType) {
    if (count >= threshold) common.dayType = day as InteractionContext['dayType'];
  }

  return common;
}

function describeObservation(
  type: SuggestionType,
  count: number,
  context: Partial<InteractionContext>
): string {
  const ctxDesc = Object.entries(context)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  return `User rejected ${type} suggestions ${count}x when ${ctxDesc || 'no specific context'}`;
}

function inferHypothesis(type: SuggestionType, ctx: Partial<InteractionContext>): string {
  const templates: Record<SuggestionType, (c: Partial<InteractionContext>) => string> = {
    gap_fill: (c) =>
      c.energyIndicator === 'post_focus_dip'
        ? 'User prefers recovery time after deep work blocks'
        : 'User prefers to protect small gaps rather than fill them',
    buffer_add: () => 'User has sufficient buffer preferences already',
    time_estimate: () => 'User prefers more generous time estimates',
    priority_order: () => 'User has different priority logic than suggested',
    notification_hold: () => 'User wants more notifications to come through',
    morning_routine: () => 'User prefers different morning routine than suggested',
    goal_nudge: () => 'User finds goal nudges at this frequency annoying',
    conflict_resolve: () => 'User prefers to resolve conflicts differently',
    recovery_suggest: () => 'User does not need recovery time in this context',
  };

  return templates[type]?.(ctx) || `User prefers different behavior for ${type}`;
}

function inferTestApproach(type: SuggestionType, hypothesis: string): string {
  if (hypothesis.includes('recovery')) return 'Suggest break instead of tasks after deep work';
  if (hypothesis.includes('protect')) return 'Do not suggest filling small gaps';
  if (hypothesis.includes('generous')) return 'Increase time estimates by 50%';
  return `Adjust ${type} suggestions based on learned preference`;
}

function inferTriggerType(condition: TriggerCondition): PatternTrigger['type'] {
  if (condition.contextMatchers.energyIndicator === 'post_focus_dip') return 'event_end';
  if (condition.contextMatchers.timeOfDay) return 'time_of_day';
  if (condition.suggestionType === 'gap_fill') return 'gap_detected';
  return 'time_of_day';
}

function inferAction(testApproach: string): PatternAction {
  if (testApproach.includes('recovery') || testApproach.includes('break')) {
    return { type: 'suggest_alternative', params: { suggest: 'recovery' } };
  }
  if (testApproach.includes('protect') || testApproach.includes('Do not')) {
    return { type: 'skip_suggestion', params: {} };
  }
  if (testApproach.includes('50%')) {
    return { type: 'adjust_estimate', params: { multiplier: 1.5 } };
  }
  return { type: 'suggest_alternative', params: {} };
}

function patternMatchesContext(trigger: PatternTrigger, context: InteractionContext): boolean {
  const conditions = trigger.conditions as Partial<InteractionContext>;
  return contextMatches(conditions, context);
}

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------

export const selectLearnings = (state: RalphStore) => state.getUserLearnings();
export const selectPatterns = (state: RalphStore) => state.getConfirmedPatterns();
export const selectActiveHypotheses = (state: RalphStore) => state.getActiveHypotheses();
export const selectPendingNotifications = (state: RalphStore) =>
  state.pendingNotifications.filter((n) => !n.dismissed);
