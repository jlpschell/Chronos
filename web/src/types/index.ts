// ============================================================================
// CHRONOS TYPE DEFINITIONS
// Core types shared across the application
// ============================================================================

// ----------------------------------------------------------------------------
// User & Calibration
// ----------------------------------------------------------------------------

// Core calibration types
export type Velocity = 'high_efficiency' | 'sustainable_pace';
export type Geometry = 'linear_horizon' | 'radial_watchface';
export type Constellation = 'solo_pilot' | 'co_pilot' | 'crew_captain';

// Extended calibration types (new)
export type Chronotype = 'early_bird' | 'night_owl' | 'flexible';
export type BufferPreference = 'packed' | 'breathing_room' | 'generous_gaps';
export type StressResponse = 'more_structure' | 'more_space';
export type MotivationStyle = 'streaks' | 'milestones' | 'both';

// Derived types
export type Persona = 'shop_foreman' | 'supportive_peer';
export type BouncerMode = 'strict' | 'fluid';
export type ThemeId = 'moonlit' | 'sepia' | 'warm' | 'cool' | 'fun';

export interface UserState {
  id: string;
  intakeCompleted: boolean;
  
  // Core calibration (original 3 questions)
  velocity: Velocity | null;
  geometry: Geometry | null;
  constellation: Constellation | null;
  
  // Extended calibration (new questions)
  chronotype: Chronotype | null;
  bufferPreference: BufferPreference | null;
  stressResponse: StressResponse | null;
  motivationStyle: MotivationStyle | null;
  
  // Derived from calibration
  bouncerMode: BouncerMode | null;
  persona: Persona | null;
  
  // UI preferences
  themeId: ThemeId | null;
  goals: Goal[];
  emergencyContacts: Contact[];
  vipContacts: Contact[];
  calendarsConnected: CalendarConnection[];
  calibrationDate: Date | null;
  recalibrationTriggers: number;
  onboardingStep: number;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  preferredBuffer: number;           // Minutes between meetings
  morningRoutineEnd: string;         // "08:00"
  eveningCutoff: string;             // "18:00"
  peakHours: string[];               // ["09:00-12:00", "14:00-16:00"]
  voiceEnabled: boolean;
  notificationsEnabled: boolean;
  transparencyMode: 'verbose' | 'quiet';
}

export interface UserStats {
  daysActive: number;
  lastActiveDate: Date | null;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

// ----------------------------------------------------------------------------
// Calendar & Events
// ----------------------------------------------------------------------------

export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'local';
export type EventGrain = 'sacred' | 'shallow' | 'transition';

export interface CalendarConnection {
  id: string;
  provider: CalendarProvider;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  lastSynced: Date | null;
  enabled: boolean;
}

export interface ChronosEvent {
  id: string;
  externalId: string | null;         // Provider's event ID
  provider: CalendarProvider;
  calendarId: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  location: string | null;
  attendees: Attendee[];
  recurrenceRule: string | null;     // RRULE string
  color: string | null;
  voiceMemos: VoiceMemo[];
  goalLinks: string[];               // Goal IDs
  bufferBefore: number | null;       // Minutes
  bufferAfter: number | null;
  grain: EventGrain;
  isBlocked: boolean;                // Protected time
  lastSynced: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendee {
  email: string;
  name: string | null;
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  isOrganizer: boolean;
}

export interface VoiceMemo {
  id: string;
  eventId: string;
  audioUrl: string;                  // Blob URL or stored path
  audioBlob?: Blob | null;           // Stored audio for offline persistence
  transcript: string;
  duration: number;                  // Seconds
  createdAt: Date;
}

// ----------------------------------------------------------------------------
// Goals (Blended Model: Habits, Projects, Events)
// ----------------------------------------------------------------------------

export type GoalType = 'habit' | 'project' | 'event';
export type GoalStatus = 'active' | 'drifting' | 'completed' | 'archived';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Goal {
  id: string;
  text: string;
  goalType: GoalType;                // NEW: habit, project, or event
  status: GoalStatus;
  createdAt: Date;
  lastActivity: Date | null;
  linkedEventIds: string[];
  nudgesSent: number;
  
  // --- PROJECT fields (linear progress) ---
  targetValue: number | null;        // Target to reach (e.g., 100%)
  currentValue: number;              // Current progress
  unit: string | null;               // "clients", "chapters", "%", etc.
  deadline: Date | null;             // When it's due
  milestones: Milestone[];           // Sub-goals/checkpoints
  
  // --- HABIT fields (cyclical/recurring) ---
  frequency: HabitFrequency | null;  // How often to do it
  completedDates: string[];          // ISO date strings of completions
  currentStreak: number;             // Current consecutive completions
  longestStreak: number;             // Best streak ever
  
  // --- EVENT fields (point-in-time) ---
  eventDate: Date | null;            // When the event happens
  eventLocation: string | null;      // Where it is
  reminderDays: number[];            // Days before to remind (e.g., [30, 7, 1])
}

export interface Milestone {
  id: string;
  text: string;
  completed: boolean;
  completedAt: Date | null;
  order: number;
}

// ----------------------------------------------------------------------------
// Ralph Loop (Learning Engine)
// ----------------------------------------------------------------------------

export type SuggestionType =
  | 'gap_fill'
  | 'buffer_add'
  | 'time_estimate'
  | 'priority_order'
  | 'notification_hold'
  | 'morning_routine'
  | 'goal_nudge'
  | 'conflict_resolve'
  | 'recovery_suggest';

export type UserResponse = 'accepted' | 'rejected' | 'modified' | 'ignored';
export type HypothesisStatus = 'testing' | 'confirmed' | 'rejected' | 'stale';

export interface InteractionContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  dayType: 'weekday' | 'weekend';
  currentLoad: 'light' | 'moderate' | 'heavy';
  previousTaskType: string | null;
  minutesSincePreviousTask: number | null;
  energyIndicator: 'high' | 'medium' | 'low' | 'post_focus_dip' | null;
  recentOverrideCount: number;
  activeGoalIds: string[];
}

export interface Interaction {
  id: string;
  timestamp: Date;
  suggestionType: SuggestionType;
  suggestionText: string;
  targetEventId: string | null;
  userResponse: UserResponse;
  userActionText: string | null;
  context: InteractionContext;
  hypothesisId: string | null;
}

export interface Hypothesis {
  id: string;
  createdAt: Date;
  triggerInteractionIds: string[];
  observation: string;
  hypothesis: string;
  testApproach: string;
  triggerCondition: TriggerCondition;
  testsRun: number;
  confirmations: number;
  rejections: number;
  confidenceRequired: number;
  status: HypothesisStatus;
  resolvedAt: Date | null;
  resultingPatternId: string | null;
}

export interface TriggerCondition {
  suggestionType: SuggestionType;
  contextMatchers: Partial<InteractionContext>;
}

export interface Pattern {
  id: string;
  description: string;
  trigger: PatternTrigger;
  action: PatternAction;
  confidence: number;
  confirmedAt: Date;
  sourceHypothesisId: string;
  applicationCount: number;
  overridesSinceConfirm: number;
  lastApplied: Date | null;
  decayWarningIssued: boolean;
}

export interface PatternTrigger {
  type: 'event_end' | 'time_of_day' | 'day_start' | 'gap_detected' | 'goal_inactive';
  conditions: Record<string, unknown>;
}

export interface PatternAction {
  type: 'suggest_alternative' | 'auto_block' | 'skip_suggestion' | 'adjust_estimate' | 'auto_fix';
  params: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// Voice
// ----------------------------------------------------------------------------

export type VoiceIntent =
  | { type: 'command'; action: CommandAction; params: Record<string, unknown> }
  | { type: 'query'; question: string }
  | { type: 'memo'; targetEventId: string | null; content: string }
  | { type: 'conversation'; content: string };

export type CommandAction =
  | 'create_event'
  | 'move_event'
  | 'cancel_event'
  | 'block_time'
  | 'set_reminder'
  | 'update_goal'
  | 'complete_goal';

// ----------------------------------------------------------------------------
// Notifications (Bouncer)
// ----------------------------------------------------------------------------

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';
export type NotificationSource = 'calendar' | 'goal' | 'ralph' | 'bouncer' | 'system';

export interface ChronosNotification {
  id: string;
  source: NotificationSource;
  title: string;
  body: string;
  priority: NotificationPriority;
  createdAt: Date;
  deliveredAt: Date | null;
  heldUntil: Date | null;            // If in lobby
  dismissed: boolean;
  actionUrl: string | null;
}

export interface LobbyQueue {
  notifications: ChronosNotification[];
  nextDeliveryTime: Date | null;
}

// ----------------------------------------------------------------------------
// AI/LLM
// ----------------------------------------------------------------------------

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

// ----------------------------------------------------------------------------
// UI State
// ----------------------------------------------------------------------------

export type ZoomLevel = 'year' | 'month' | 'week' | 'day' | 'focus';

export interface ViewState {
  zoomLevel: ZoomLevel;
  focusDate: Date;
  selectedEventId: string | null;
}

// ----------------------------------------------------------------------------
// Utility Types
// ----------------------------------------------------------------------------

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
