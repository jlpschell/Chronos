// ============================================================================
// LIFE OPERATING SYSTEM TYPES
// Types for health, summaries, coaching, and advanced visualization
// ============================================================================

// ----------------------------------------------------------------------------
// Health Data Integration
// ----------------------------------------------------------------------------

export type HealthDataSource =
  | 'manual'          // User-reported
  | 'apple_health'    // iOS HealthKit
  | 'google_fit'      // Android Health Connect
  | 'fitbit'
  | 'oura'
  | 'whoop'
  | 'garmin';

export interface HealthContext {
  // Sleep
  sleep: {
    duration: number;                          // Hours
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    debt: number;                              // Accumulated deficit in hours
    lastUpdated: Date;
  };

  // Energy
  energy: {
    current: number;                           // 0-100
    predicted: EnergyPrediction[];             // Next 24 hours
    pattern: EnergyPattern;
  };

  // Stress & Recovery
  stress: {
    level: 'low' | 'moderate' | 'high';
    hrvScore: number | null;                   // Heart rate variability
    recoveryScore: number | null;              // 0-100 readiness
  };

  // Activity
  activity: {
    stepsToday: number;
    activeMinutes: number;
    lastWorkout: Date | null;
    workoutStreak: number;
  };

  // Data freshness
  sources: HealthDataSource[];
  lastSync: Date;
}

export interface EnergyPrediction {
  hour: number;                                // 0-23
  predicted: number;                           // 0-100
  confidence: number;                          // 0-1
}

export interface EnergyPattern {
  peakHours: TimeRange[];                      // When user is most energetic
  dipHours: TimeRange[];                       // Natural energy dips
  sustainableWorkHours: number;                // Max productive hours/day
  recoveryNeeded: {
    afterDeepWork: number;                     // Minutes
    afterMeetings: number;
    afterWorkout: number;
  };
}

export interface TimeRange {
  start: string;                               // "09:00"
  end: string;                                 // "11:00"
}

// ----------------------------------------------------------------------------
// Goal Coaching System
// ----------------------------------------------------------------------------

export type CoachingStyle = 'push' | 'support' | 'accountability';
export type GoalRelationship = 'new' | 'building' | 'established' | 'drifting' | 'completing';

export interface EnhancedGoal {
  // Basic (from existing Goal type)
  id: string;
  text: string;
  targetValue: number | null;
  currentValue: number;
  unit: string | null;
  deadline: Date | null;
  status: 'active' | 'drifting' | 'completed' | 'archived';

  // Motivation Layer
  motivation: {
    whyItMatters: string;                      // Personal significance
    emotionalWeight: number;                   // 1-10
    connectedValues: string[];                 // ["family", "growth", "security"]
    visualizedOutcome: string | null;          // What success looks like
  };

  // Strategy Layer
  strategy: {
    keyActions: KeyAction[];                   // Recurring actions that drive progress
    leadIndicators: LeadIndicator[];           // Early signals
    obstacles: Obstacle[];                     // Known blockers
    milestones: Milestone[];                   // Intermediate targets
  };

  // Relationship Layer
  coaching: {
    style: CoachingStyle;
    relationship: GoalRelationship;
    checkinCadence: 'daily' | 'weekly' | 'monthly';
    lastCheckin: Date | null;
    nudgesSent: number;
    conversationHistory: ConversationEntry[];
  };

  // Learning Layer
  patterns: {
    bestTimeForWork: TimeRange[];
    averageSessionLength: number;
    completionRate: number;                    // 0-1 for key actions
    commonBlockers: string[];
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyAction {
  id: string;
  action: string;                              // "Make 5 outreach calls"
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  currentCount: number;
  lastCompleted: Date | null;
  autoSchedule: boolean;
  preferredTime: TimeRange | null;
}

export interface LeadIndicator {
  id: string;
  indicator: string;                           // "Meetings booked this week"
  targetValue: number;
  currentValue: number;
  trend: 'up' | 'flat' | 'down';
  lastUpdated: Date;
}

export interface Obstacle {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'blocking';
  status: 'active' | 'mitigated' | 'resolved';
  mitigation: string | null;
}

export interface Milestone {
  id: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  completedAt: Date | null;
}

export interface ConversationEntry {
  timestamp: Date;
  type: 'checkin' | 'nudge' | 'celebration' | 'pivot' | 'user_update';
  aiMessage: string;
  userResponse: string | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
}

// ----------------------------------------------------------------------------
// Weekly Planning
// ----------------------------------------------------------------------------

export interface WeeklyPlan {
  weekOf: Date;                                // Monday of the week
  createdAt: Date;

  // The Big 3 priorities
  bigThree: WeeklyPriority[];

  // Scheduled blocks
  timeBlocks: AutoBlock[];

  // Capacity analysis
  capacity: {
    totalAvailableHours: number;
    plannedHours: number;
    bufferHours: number;
    utilizationPercent: number;
  };

  // Warnings
  warnings: PlanWarning[];

  // Review (filled in at end of week)
  review: WeeklyReview | null;
}

export interface WeeklyPriority {
  rank: 1 | 2 | 3;
  description: string;
  goalId: string | null;                       // Linked goal
  estimatedHours: number;
  reason: string;                              // Why this priority
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
}

export interface AutoBlock {
  id: string;
  title: string;
  duration: number;                            // Minutes
  preferredDays: number[];                     // 0-6, Sunday = 0
  preferredTime: 'morning' | 'afternoon' | 'evening';
  goalId: string | null;
  keyActionId: string | null;
  flexibility: 'rigid' | 'flexible' | 'optional';
  autoReschedule: boolean;
  scheduledAt: Date | null;                    // Actual scheduled time
  completed: boolean;
}

export interface PlanWarning {
  type: 'overcommitment' | 'goal_neglected' | 'energy_mismatch' | 'conflict';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestion: string | null;
}

export interface WeeklyReview {
  completedAt: Date;
  bigThreeResults: {
    rank: number;
    status: 'completed' | 'partial' | 'missed';
    notes: string | null;
  }[];
  actualHoursWorked: number;
  energyAverage: number;
  lessonsLearned: string[];
  nextWeekCarryover: string[];
}

// ----------------------------------------------------------------------------
// Temporal Summaries
// ----------------------------------------------------------------------------

export type SummaryPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface TemporalSummary {
  id: string;
  period: SummaryPeriod;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;

  // The narrative (AI-generated)
  headline: string;                            // One-line summary
  story: string;                               // 2-3 paragraph narrative
  insight: string;                             // Key learning or observation

  // Metrics
  metrics: SummaryMetrics;

  // Goal progress
  goalProgress: GoalProgressSummary[];

  // Patterns (what Ralph learned)
  patternsLearned: string[];
  patternsApplied: string[];

  // Health integration
  healthSummary: HealthSummary | null;

  // Forward-looking
  focusForNext: string[];                      // Suggested focus areas
  risksIdentified: string[];
}

export interface SummaryMetrics {
  // Time
  hoursWorked: number;
  hoursInMeetings: number;
  hoursDeepWork: number;
  hoursProtected: number;

  // Events
  eventsTotal: number;
  eventsCompleted: number;
  eventsCancelled: number;
  conflictsResolved: number;

  // Goals
  goalsProgressed: number;
  goalActionsCompleted: number;
  goalActionsTotal: number;

  // Interactions
  suggestionsAccepted: number;
  suggestionsRejected: number;
  autonomousActionsCount: number;
}

export interface GoalProgressSummary {
  goalId: string;
  goalText: string;
  startValue: number;
  endValue: number;
  targetValue: number;
  progressPercent: number;
  trend: 'accelerating' | 'on_track' | 'slowing' | 'stalled' | 'declining';
  daysRemaining: number | null;
  projectedCompletion: Date | null;
  status: string;                              // AI-generated status line
}

export interface HealthSummary {
  averageEnergy: number;
  averageSleep: number;
  sleepQualityDistribution: Record<string, number>;
  activityTrend: 'improving' | 'stable' | 'declining';
  correlations: HealthCorrelation[];
}

export interface HealthCorrelation {
  factor: string;                              // "gym days"
  metric: string;                              // "afternoon energy"
  relationship: 'positive' | 'negative';
  strength: number;                            // 0-1
  insight: string;                             // "Gym days correlate with 30% higher afternoon energy"
}

// ----------------------------------------------------------------------------
// Time GPS Visualization
// ----------------------------------------------------------------------------

export type ZoomLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const ZOOM_LEVEL_NAMES: Record<ZoomLevel, string> = {
  0: 'life',      // 5-10 years
  1: 'year',      // 12 months
  2: 'quarter',   // 13 weeks
  3: 'month',     // 4-5 weeks
  4: 'week',      // 7 days
  5: 'day',       // 24 hours
  6: 'focus',     // 15-minute blocks
};

export interface ViewState {
  zoomLevel: number;                           // Can be fractional for smooth transitions
  focalPoint: Date;                            // Center of view
  velocity: { x: number; y: number };          // Momentum for kinetic scrolling
  isAnimating: boolean;
}

export interface ZoomLevelConfig {
  level: ZoomLevel;
  name: string;
  timeSpan: number;                            // Milliseconds visible
  eventDetail: 'dot' | 'block' | 'card' | 'full';
  showGoals: boolean;
  showHealth: boolean;
  showPatterns: boolean;
}

export const ZOOM_CONFIGS: ZoomLevelConfig[] = [
  { level: 0, name: 'life', timeSpan: 5 * 365 * 24 * 60 * 60 * 1000, eventDetail: 'dot', showGoals: true, showHealth: false, showPatterns: false },
  { level: 1, name: 'year', timeSpan: 365 * 24 * 60 * 60 * 1000, eventDetail: 'dot', showGoals: true, showHealth: false, showPatterns: true },
  { level: 2, name: 'quarter', timeSpan: 91 * 24 * 60 * 60 * 1000, eventDetail: 'block', showGoals: true, showHealth: true, showPatterns: true },
  { level: 3, name: 'month', timeSpan: 30 * 24 * 60 * 60 * 1000, eventDetail: 'block', showGoals: true, showHealth: true, showPatterns: true },
  { level: 4, name: 'week', timeSpan: 7 * 24 * 60 * 60 * 1000, eventDetail: 'card', showGoals: true, showHealth: true, showPatterns: true },
  { level: 5, name: 'day', timeSpan: 24 * 60 * 60 * 1000, eventDetail: 'full', showGoals: true, showHealth: true, showPatterns: true },
  { level: 6, name: 'focus', timeSpan: 4 * 60 * 60 * 1000, eventDetail: 'full', showGoals: true, showHealth: true, showPatterns: true },
];

// ----------------------------------------------------------------------------
// Notification System
// ----------------------------------------------------------------------------

export type NotificationCategory = 'critical' | 'important' | 'informational' | 'celebratory';
export type NotificationTiming = 'immediate' | 'next_transition' | 'batch_daily' | 'batch_weekly';
export type NotificationChannel = 'push' | 'in_app' | 'voice' | 'silent';

export interface SmartNotification {
  id: string;
  category: NotificationCategory;

  // Content
  headline: string;                            // 5-8 words max
  body: string | null;                         // 1-2 sentences if needed

  // Context
  relatedGoalId: string | null;
  relatedEventId: string | null;
  contextRequired: InteractionContextRequirement;

  // Actions
  primaryAction: NotificationAction | null;
  secondaryAction: NotificationAction | null;

  // Delivery
  timing: NotificationTiming;
  channel: NotificationChannel;

  // Lifecycle
  createdAt: Date;
  scheduledFor: Date | null;
  deliveredAt: Date | null;
  dismissedAt: Date | null;
  expiresAt: Date | null;
  snoozeCount: number;
}

export interface NotificationAction {
  label: string;
  actionType: 'navigate' | 'quick_action' | 'dismiss';
  payload: Record<string, unknown>;
  destructive: boolean;
}

export interface InteractionContextRequirement {
  notDuringGrain: ('sacred' | 'shallow' | 'transition')[];
  minEnergy: number | null;
  timeWindow: TimeRange | null;
  maxDailyOfType: number | null;
}

// ----------------------------------------------------------------------------
// Privacy Configuration
// ----------------------------------------------------------------------------

export type DataSensitivity = 'public' | 'private' | 'local_only' | 'ephemeral';

export interface PrivacyConfig {
  // Data classification
  calendarEvents: DataSensitivity;
  goals: DataSensitivity;
  interactions: DataSensitivity;
  voiceMemos: DataSensitivity;
  voiceTranscripts: DataSensitivity;
  healthData: DataSensitivity;
  contactDetails: DataSensitivity;

  // LLM settings
  llmProvider: 'openrouter' | 'local' | 'none';
  anonymizeNames: boolean;
  generalizeHealth: boolean;
  shareContextWithLLM: boolean;

  // Sync settings
  enableCloudSync: boolean;
  syncEncrypted: boolean;
  retentionDays: number;

  // Export/Delete
  lastExport: Date | null;
  exportFormat: 'json' | 'ical' | 'csv';
}
