# Ralph Loop Technical Specification
## Self-Learning Intelligence Engine

---

## Overview

Ralph Loop is the learning engine that makes Chronos genuinely personal. It observes, hypothesizes, tests, and adapts—turning every user interaction into improved future suggestions.

```
Recognition → Adaptation → Learning → Pattern → Habit
     ↑                                           │
     └───────────── Decay Detection ────────────┘
```

---

## Core Data Structures

### 1. Interaction Log

Every AI suggestion and user response is logged:

```typescript
// types/ralph.types.ts

export type SuggestionType =
  | 'gap_fill'           // "Use this 15min for X"
  | 'buffer_add'         // "Add buffer between meetings"
  | 'time_estimate'      // "This usually takes 30min"
  | 'priority_order'     // "Do X before Y"
  | 'notification_hold'  // "Holding notifications during focus"
  | 'morning_routine'    // "Start with X"
  | 'goal_nudge'         // "You haven't worked on X"
  | 'conflict_resolve'   // "Move X to resolve conflict"
  | 'recovery_suggest';  // "Take a break after deep work"

export type UserResponse =
  | 'accepted'    // User followed suggestion
  | 'rejected'    // User explicitly declined
  | 'modified'    // User did something similar but different
  | 'ignored';    // User didn't respond (timeout)

export interface InteractionContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;  // 0-6
  dayType: 'weekday' | 'weekend';
  currentLoad: 'light' | 'moderate' | 'heavy';
  previousTaskType?: string;
  minutesSincePreviousTask?: number;
  energyIndicator?: 'high' | 'medium' | 'low' | 'post_focus_dip';
  recentOverrideCount: number;  // Last 24h
  activeGoals: string[];
}

export interface Interaction {
  id: string;
  timestamp: Date;
  suggestionType: SuggestionType;
  suggestionText: string;        // What AI said
  targetEventId?: string;        // If suggestion was about an event
  userResponse: UserResponse;
  userActionText?: string;       // What user did instead
  context: InteractionContext;
  hypothesisId?: string;         // If this was a hypothesis test
}
```

### 2. Hypothesis

Generated when override threshold is reached:

```typescript
export type HypothesisStatus =
  | 'testing'     // Actively being tested
  | 'confirmed'   // Promoted to pattern
  | 'rejected'    // Disproven
  | 'stale';      // Too old without resolution

export interface Hypothesis {
  id: string;
  createdAt: Date;

  // What triggered this hypothesis
  triggerInteractions: string[];  // Interaction IDs that led here
  observation: string;            // Human-readable: "User rejected gap_fill 3x after deep work"

  // The hypothesis itself
  hypothesis: string;             // "User prefers recovery time after deep work blocks"
  testApproach: string;           // "Suggest break/recovery instead of tasks after deep work"

  // Conditions for testing
  triggerCondition: TriggerCondition;

  // Progress tracking
  testsRun: number;
  confirmations: number;
  rejections: number;
  confidenceRequired: number;     // Default: 2

  status: HypothesisStatus;
  resolvedAt?: Date;
  resultingPatternId?: string;
}

export interface TriggerCondition {
  suggestionType: SuggestionType;
  contextMatchers: Partial<InteractionContext>;
}
```

### 3. Pattern

Confirmed learnings applied proactively:

```typescript
export interface Pattern {
  id: string;
  description: string;            // "Needs recovery after deep work"

  // When to apply
  trigger: PatternTrigger;

  // What to do
  action: PatternAction;

  // Confidence and tracking
  confidence: number;             // 0-1, starts at 0.7 on confirmation
  confirmedAt: Date;
  sourceHypothesisId: string;

  // Decay tracking
  applicationCount: number;
  overridesSinceConfirm: number;
  lastApplied?: Date;
  decayWarningIssued: boolean;
}

export interface PatternTrigger {
  type: 'event_end' | 'time_of_day' | 'day_start' | 'gap_detected' | 'goal_inactive';
  conditions: Record<string, unknown>;
}

export interface PatternAction {
  type: 'suggest_alternative' | 'auto_block' | 'skip_suggestion' | 'adjust_estimate';
  params: Record<string, unknown>;
}
```

---

## Design Philosophy: 75-80% Autonomy

Ralph should handle 75-80% of decisions autonomously. The user shouldn't have to think about preferences — Ralph figures it out.

### Autonomy Principles

| Action | User Involvement |
|--------|------------------|
| Log interactions | Silent (0%) |
| Generate hypotheses | Silent (0%) |
| Test hypotheses | Silent (0%) — just adjust suggestions |
| Promote to pattern | Brief notification ("Learned: X") |
| Apply patterns | Silent auto-apply (0%) |
| Pattern decay | Ask only if confidence < 0.3 |
| Proactive fixes | Do it, then notify ("Moved X to resolve conflict") |

### Notification Thresholds

```typescript
// Only surface to user when:
// - Major learning confirmed (new pattern)
// - Pattern about to be removed (decay threshold hit)
// - AI made autonomous change user should know about
```

---

## Configuration

```typescript
// lib/ralph.config.ts

export const RALPH_CONFIG = {
  // Hypothesis generation
  hypothesisThreshold: 3,         // Same override type triggers hypothesis
  observationWindowDays: 14,      // Look back period for similar overrides
  maxActiveHypotheses: 5,         // Prevent hypothesis explosion

  // Hypothesis testing
  confirmationRequired: 2,        // Confirmations to promote to pattern
  maxTestsBeforeStale: 10,        // Give up if no clear signal

  // Pattern management
  initialConfidence: 0.7,         // Starting confidence on promotion
  confidenceBoostPerUse: 0.05,    // Increase when pattern works
  confidenceDecayPerOverride: 0.1,// Decrease when user overrides
  decayThreshold: 5,              // Overrides before questioning pattern

  // Autonomy settings (75-80% autonomous)
  autoApplyPatterns: true,        // Apply without asking
  silentLearning: true,           // Don't notify on hypothesis testing
  notifyOnNewPattern: true,       // Brief "Learned: X" notification
  notifyOnAutoAction: true,       // "I moved X" after autonomous action
  askBeforeRemovingPattern: true, // Confirm before forgetting learned pattern

  // Context matching
  contextMatchWeight: {
    timeOfDay: 0.3,
    dayType: 0.2,
    currentLoad: 0.2,
    energyIndicator: 0.3,
  },
} as const;
```

---

## Store Implementation

```typescript
// stores/ralph.store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { RALPH_CONFIG } from '../lib/ralph.config';
import type {
  Interaction,
  Hypothesis,
  Pattern,
  SuggestionType,
  UserResponse,
  InteractionContext
} from '../types/ralph.types';

interface RalphState {
  interactions: Interaction[];
  hypotheses: Hypothesis[];
  patterns: Pattern[];

  // Actions
  logInteraction: (
    type: SuggestionType,
    text: string,
    response: UserResponse,
    context: InteractionContext,
    options?: { targetEventId?: string; userActionText?: string; hypothesisId?: string }
  ) => void;

  checkForHypothesis: (interaction: Interaction) => Hypothesis | null;
  testHypothesis: (hypothesisId: string, wasAccepted: boolean) => void;
  promoteToPattern: (hypothesisId: string) => Pattern;
  applyPatterns: (context: InteractionContext) => PatternAction[];
  checkPatternDecay: (patternId: string, wasOverridden: boolean) => void;

  // Queries
  getActiveHypotheses: () => Hypothesis[];
  getConfirmedPatterns: () => Pattern[];
  getSimilarOverrides: (type: SuggestionType, context: InteractionContext) => Interaction[];
  getUserLearnings: () => string[];  // Human-readable summary
}

export const useRalphStore = create<RalphState>()(
  persist(
    immer((set, get) => ({
      interactions: [],
      hypotheses: [],
      patterns: [],

      logInteraction: (type, text, response, context, options = {}) => {
        const interaction: Interaction = {
          id: nanoid(),
          timestamp: new Date(),
          suggestionType: type,
          suggestionText: text,
          userResponse: response,
          context,
          ...options,
        };

        set((state) => {
          state.interactions.push(interaction);

          // Keep only last 1000 interactions to prevent bloat
          if (state.interactions.length > 1000) {
            state.interactions = state.interactions.slice(-1000);
          }
        });

        // Check if this triggers a hypothesis
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
        const appliedPatterns = get().patterns.filter(
          p => p.trigger.conditions.suggestionType === type
        );
        appliedPatterns.forEach(p => {
          get().checkPatternDecay(p.id, response !== 'accepted');
        });
      },

      checkForHypothesis: (interaction) => {
        const { hypotheses } = get();

        // Don't create if we have too many active
        const activeCount = hypotheses.filter(h => h.status === 'testing').length;
        if (activeCount >= RALPH_CONFIG.maxActiveHypotheses) return null;

        // Find similar overrides
        const similar = get().getSimilarOverrides(
          interaction.suggestionType,
          interaction.context
        );

        // Need threshold overrides to generate hypothesis
        if (similar.length < RALPH_CONFIG.hypothesisThreshold) return null;

        // Check if we already have a hypothesis for this pattern
        const existingHypothesis = hypotheses.find(
          h => h.status === 'testing' &&
               h.triggerCondition.suggestionType === interaction.suggestionType &&
               contextMatches(h.triggerCondition.contextMatchers, interaction.context)
        );
        if (existingHypothesis) return null;

        // Generate hypothesis
        const hypothesis = generateHypothesis(similar, interaction);
        return hypothesis;
      },

      testHypothesis: (hypothesisId, wasAccepted) => {
        set((state) => {
          const hypothesis = state.hypotheses.find(h => h.id === hypothesisId);
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
            }
          } else {
            hypothesis.rejections++;
            if (hypothesis.rejections >= hypothesis.confidenceRequired) {
              hypothesis.status = 'rejected';
              hypothesis.resolvedAt = new Date();
            }
          }

          // Mark stale if too many tests without resolution
          if (hypothesis.testsRun >= RALPH_CONFIG.maxTestsBeforeStale) {
            hypothesis.status = 'stale';
            hypothesis.resolvedAt = new Date();
          }
        });
      },

      promoteToPattern: (hypothesisId) => {
        const hypothesis = get().hypotheses.find(h => h.id === hypothesisId);
        if (!hypothesis) throw new Error('Hypothesis not found');

        const pattern: Pattern = {
          id: nanoid(),
          description: hypothesis.hypothesis,
          trigger: {
            type: inferTriggerType(hypothesis.triggerCondition),
            conditions: hypothesis.triggerCondition,
          },
          action: inferAction(hypothesis.testApproach),
          confidence: RALPH_CONFIG.initialConfidence,
          confirmedAt: new Date(),
          sourceHypothesisId: hypothesisId,
          applicationCount: 0,
          overridesSinceConfirm: 0,
          decayWarningIssued: false,
        };

        set((state) => {
          state.patterns.push(pattern);
        });

        return pattern;
      },

      applyPatterns: (context) => {
        const patterns = get().getConfirmedPatterns();
        const actions: PatternAction[] = [];

        for (const pattern of patterns) {
          if (patternMatchesContext(pattern.trigger, context)) {
            actions.push(pattern.action);

            // Update application tracking
            set((state) => {
              const p = state.patterns.find(x => x.id === pattern.id);
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
          const pattern = state.patterns.find(p => p.id === patternId);
          if (!pattern) return;

          pattern.overridesSinceConfirm++;
          pattern.confidence = Math.max(0, pattern.confidence - RALPH_CONFIG.confidenceDecayPerOverride);

          if (pattern.overridesSinceConfirm >= RALPH_CONFIG.decayThreshold && !pattern.decayWarningIssued) {
            pattern.decayWarningIssued = true;
            // Trigger recalibration prompt (handled by UI layer)
          }
        });
      },

      getActiveHypotheses: () => {
        return get().hypotheses.filter(h => h.status === 'testing');
      },

      getConfirmedPatterns: () => {
        return get().patterns.filter(p => p.confidence > 0.3);
      },

      getSimilarOverrides: (type, context) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - RALPH_CONFIG.observationWindowDays);

        return get().interactions.filter(i =>
          i.timestamp > cutoff &&
          i.suggestionType === type &&
          (i.userResponse === 'rejected' || i.userResponse === 'modified') &&
          contextSimilarity(i.context, context) > 0.6
        );
      },

      getUserLearnings: () => {
        const patterns = get().getConfirmedPatterns();
        return patterns.map(p => p.description);
      },
    })),
    {
      name: 'chronos-ralph',
      partialize: (state) => ({
        interactions: state.interactions.slice(-500), // Persist last 500
        hypotheses: state.hypotheses,
        patterns: state.patterns,
      }),
    }
  )
);

// Helper functions

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
  const weights = RALPH_CONFIG.contextMatchWeight;

  if (a.timeOfDay === b.timeOfDay) score += weights.timeOfDay;
  if (a.dayType === b.dayType) score += weights.dayType;
  if (a.currentLoad === b.currentLoad) score += weights.currentLoad;
  if (a.energyIndicator === b.energyIndicator) score += weights.energyIndicator;

  return score;
}

function generateHypothesis(
  similar: Interaction[],
  trigger: Interaction
): Hypothesis {
  // Analyze common patterns in overrides
  const commonContext = findCommonContext(similar);
  const observation = describeObservation(trigger.suggestionType, similar.length, commonContext);
  const hypothesis = inferHypothesis(trigger.suggestionType, commonContext, similar);
  const testApproach = inferTestApproach(trigger.suggestionType, hypothesis);

  return {
    id: nanoid(),
    createdAt: new Date(),
    triggerInteractions: similar.map(i => i.id),
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
  };
}

function findCommonContext(interactions: Interaction[]): Partial<InteractionContext> {
  // Find context properties that appear in >70% of interactions
  const common: Partial<InteractionContext> = {};
  const threshold = interactions.length * 0.7;

  const timeOfDayCounts = new Map<string, number>();
  const energyCounts = new Map<string, number>();

  for (const i of interactions) {
    timeOfDayCounts.set(i.context.timeOfDay, (timeOfDayCounts.get(i.context.timeOfDay) || 0) + 1);
    if (i.context.energyIndicator) {
      energyCounts.set(i.context.energyIndicator, (energyCounts.get(i.context.energyIndicator) || 0) + 1);
    }
  }

  for (const [time, count] of timeOfDayCounts) {
    if (count >= threshold) common.timeOfDay = time as InteractionContext['timeOfDay'];
  }

  for (const [energy, count] of energyCounts) {
    if (count >= threshold) common.energyIndicator = energy as InteractionContext['energyIndicator'];
  }

  return common;
}

function describeObservation(
  type: SuggestionType,
  count: number,
  context: Partial<InteractionContext>
): string {
  const contextDesc = Object.entries(context)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  return `User rejected ${type} suggestions ${count}x when ${contextDesc || 'no specific context'}`;
}

function inferHypothesis(
  type: SuggestionType,
  context: Partial<InteractionContext>,
  interactions: Interaction[]
): string {
  // Template-based hypothesis generation
  const templates: Record<SuggestionType, (ctx: Partial<InteractionContext>) => string> = {
    gap_fill: (ctx) => ctx.energyIndicator === 'post_focus_dip'
      ? 'User prefers recovery time after deep work blocks'
      : 'User prefers to protect small gaps rather than fill them',
    buffer_add: () => 'User has sufficient buffer preferences already',
    time_estimate: () => 'User prefers more generous time estimates',
    priority_order: () => 'User has different priority logic than suggested',
    notification_hold: () => 'User wants more notifications to come through',
    morning_routine: (ctx) => `User prefers different morning routine than suggested`,
    goal_nudge: () => 'User finds goal nudges at this frequency annoying',
    conflict_resolve: () => 'User prefers to resolve conflicts differently',
    recovery_suggest: () => 'User does not need recovery time in this context',
  };

  return templates[type]?.(context) || `User prefers different behavior for ${type}`;
}

function inferTestApproach(type: SuggestionType, hypothesis: string): string {
  if (hypothesis.includes('recovery')) {
    return 'Suggest break/recovery instead of tasks after deep work';
  }
  if (hypothesis.includes('protect')) {
    return 'Do not suggest filling small gaps; protect them instead';
  }
  if (hypothesis.includes('generous')) {
    return 'Increase time estimates by 50%';
  }
  return `Adjust ${type} suggestions based on learned preference`;
}

function inferTriggerType(condition: TriggerCondition): Pattern['trigger']['type'] {
  if (condition.contextMatchers.energyIndicator === 'post_focus_dip') {
    return 'event_end';
  }
  if (condition.contextMatchers.timeOfDay) {
    return 'time_of_day';
  }
  if (condition.suggestionType === 'gap_fill') {
    return 'gap_detected';
  }
  return 'time_of_day';
}

function inferAction(testApproach: string): PatternAction {
  if (testApproach.includes('recovery') || testApproach.includes('break')) {
    return { type: 'suggest_alternative', params: { suggest: 'recovery' } };
  }
  if (testApproach.includes('protect')) {
    return { type: 'skip_suggestion', params: {} };
  }
  if (testApproach.includes('50%')) {
    return { type: 'adjust_estimate', params: { multiplier: 1.5 } };
  }
  return { type: 'suggest_alternative', params: {} };
}

function patternMatchesContext(
  trigger: Pattern['trigger'],
  context: InteractionContext
): boolean {
  const conditions = trigger.conditions as Partial<InteractionContext>;
  return contextMatches(conditions, context);
}
```

---

## React Hook for Easy Integration

```typescript
// hooks/useRalph.ts

import { useCallback } from 'react';
import { useRalphStore } from '../stores/ralph.store';
import type { SuggestionType, UserResponse, InteractionContext } from '../types/ralph.types';

export function useRalph() {
  const {
    logInteraction,
    applyPatterns,
    getActiveHypotheses,
    getConfirmedPatterns,
    getUserLearnings,
  } = useRalphStore();

  // Log a suggestion and response
  const trackSuggestion = useCallback((
    type: SuggestionType,
    suggestionText: string,
    response: UserResponse,
    context: InteractionContext,
    options?: { targetEventId?: string; userActionText?: string }
  ) => {
    logInteraction(type, suggestionText, response, context, options);
  }, [logInteraction]);

  // Get modifications to apply based on learned patterns
  const getPatternModifications = useCallback((context: InteractionContext) => {
    return applyPatterns(context);
  }, [applyPatterns]);

  // Check if we're testing any hypothesis for this suggestion type
  const isTestingHypothesis = useCallback((type: SuggestionType) => {
    const active = getActiveHypotheses();
    return active.find(h => h.triggerCondition.suggestionType === type);
  }, [getActiveHypotheses]);

  // Get human-readable learnings for transparency
  const getLearnings = useCallback(() => {
    return getUserLearnings();
  }, [getUserLearnings]);

  // Get patterns that might affect a specific context
  const getRelevantPatterns = useCallback((context: InteractionContext) => {
    const patterns = getConfirmedPatterns();
    return patterns.filter(p => {
      const conditions = p.trigger.conditions as Partial<InteractionContext>;
      for (const [key, value] of Object.entries(conditions)) {
        if (context[key as keyof InteractionContext] !== value) return false;
      }
      return true;
    });
  }, [getConfirmedPatterns]);

  return {
    trackSuggestion,
    getPatternModifications,
    isTestingHypothesis,
    getLearnings,
    getRelevantPatterns,
    patterns: getConfirmedPatterns(),
    activeHypotheses: getActiveHypotheses(),
  };
}
```

---

## Usage Example

```typescript
// components/GapFillSuggestion.tsx

import { useRalph } from '../hooks/useRalph';
import { getCurrentContext } from '../lib/context';

export function GapFillSuggestion({ gap, onClose }: Props) {
  const { trackSuggestion, getPatternModifications, isTestingHypothesis } = useRalph();
  const context = getCurrentContext();

  // Check if patterns modify our behavior
  const modifications = getPatternModifications(context);
  const shouldSkip = modifications.some(m => m.type === 'skip_suggestion');

  if (shouldSkip) {
    // Pattern says don't suggest filling this gap
    return null;
  }

  // Check if this is a hypothesis test
  const hypothesis = isTestingHypothesis('gap_fill');

  const handleAccept = () => {
    trackSuggestion('gap_fill', suggestion, 'accepted', context, {
      hypothesisId: hypothesis?.id,
    });
    // Execute the suggestion...
    onClose();
  };

  const handleReject = () => {
    trackSuggestion('gap_fill', suggestion, 'rejected', context, {
      hypothesisId: hypothesis?.id,
    });
    onClose();
  };

  const suggestion = hypothesis
    ? 'Take a break—you just finished deep work'  // Adjusted suggestion
    : `Use this ${gap.minutes}min for quick tasks`;  // Default

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <p className="text-sm text-gray-600">{suggestion}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={handleAccept} className="btn-primary">
          Sounds good
        </button>
        <button onClick={handleReject} className="btn-secondary">
          No thanks
        </button>
      </div>
    </div>
  );
}
```

---

## Transparency UI

```typescript
// components/WhatIveLearned.tsx

import { useRalph } from '../hooks/useRalph';

export function WhatIveLearned() {
  const { patterns, activeHypotheses, getLearnings } = useRalph();
  const learnings = getLearnings();

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold">What I've Learned About You</h2>
        {learnings.length === 0 ? (
          <p className="text-gray-500">
            Still learning! Use Chronos for a few days and I'll start picking up your patterns.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {learnings.map((learning, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>{learning}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {activeHypotheses.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Currently Testing</h2>
          <ul className="mt-2 space-y-2">
            {activeHypotheses.map((h) => (
              <li key={h.id} className="text-gray-600">
                <span className="text-amber-500">?</span> {h.hypothesis}
                <span className="text-xs ml-2">
                  ({h.confirmations}/{h.confidenceRequired} confirmations)
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
```

---

## Self-Correction Dialogue

When a pattern decays (user behavior changes):

```typescript
// components/RecalibrationPrompt.tsx

import { useRalphStore } from '../stores/ralph.store';

export function RecalibrationPrompt({ pattern }: { pattern: Pattern }) {
  const removePattern = useRalphStore((s) => s.removePattern);

  return (
    <div className="p-4 bg-amber-50 rounded-lg">
      <p className="font-medium">I might be wrong about something</p>
      <p className="text-sm text-gray-600 mt-1">
        I thought you {pattern.description.toLowerCase()}, but you've been doing
        the opposite lately. Has something changed?
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {/* Keep pattern but reset decay */}}
          className="btn-secondary"
        >
          No, I still prefer that
        </button>
        <button
          onClick={() => removePattern(pattern.id)}
          className="btn-primary"
        >
          Yes, forget that
        </button>
      </div>
    </div>
  );
}
```

---

## Summary

The Ralph Loop provides:

1. **Automatic learning** — No manual preference setting
2. **Hypothesis testing** — Not just pattern matching, but scientific method
3. **Graceful decay** — Patterns that stop working get questioned
4. **Full transparency** — User can always see what's been learned
5. **Self-correction** — AI admits when it's wrong

This is the intelligence core that makes Chronos feel genuinely personal.
