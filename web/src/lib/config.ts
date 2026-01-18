// ============================================================================
// CHRONOS CONFIGURATION
// Central configuration for all system parameters
// ============================================================================

// ----------------------------------------------------------------------------
// Ralph Loop Configuration (Learning Engine)
// ----------------------------------------------------------------------------

export const RALPH_CONFIG = {
  // Hypothesis generation
  hypothesisThreshold: 3,           // Same override type triggers hypothesis
  observationWindowDays: 14,        // Look back period for similar overrides
  maxActiveHypotheses: 5,           // Prevent hypothesis explosion

  // Hypothesis testing
  confirmationRequired: 2,          // Confirmations to promote to pattern
  maxTestsBeforeStale: 10,          // Give up if no clear signal

  // Pattern management
  initialConfidence: 0.7,           // Starting confidence on promotion
  confidenceBoostPerUse: 0.05,      // Increase when pattern works
  confidenceDecayPerOverride: 0.1,  // Decrease when user overrides
  decayThreshold: 5,                // Overrides before questioning pattern

  // Autonomy settings (75-80% autonomous)
  autoApplyPatterns: true,          // Apply without asking
  silentLearning: true,             // Don't notify on hypothesis testing
  notifyOnNewPattern: true,         // Brief "Learned: X" notification
  notifyOnAutoAction: true,         // "I moved X" after autonomous action
  askBeforeRemovingPattern: true,   // Confirm before forgetting learned pattern

  // Context matching weights (sum to 1.0)
  contextMatchWeight: {
    timeOfDay: 0.3,
    dayType: 0.2,
    currentLoad: 0.2,
    energyIndicator: 0.3,
  },
} as const;

// ----------------------------------------------------------------------------
// OpenRouter / LLM Configuration
// ----------------------------------------------------------------------------

export const LLM_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',

  // Model chain (fallback order)
  models: {
    primary: 'anthropic/claude-sonnet-4-20250514',
    fallback1: 'openai/gpt-4o',
    fallback2: 'google/gemini-2.0-flash-001',
    fast: 'anthropic/claude-3-haiku-20240307',  // For quick classifications
  },

  // Request defaults
  defaults: {
    temperature: 0.7,
    maxTokens: 1024,
  },

  // Rate limiting
  rateLimiting: {
    requestsPerMinute: 20,
    tokensPerMinute: 100000,
  },
} as const;

// ----------------------------------------------------------------------------
// Persona System Prompts
// ----------------------------------------------------------------------------

export const PERSONA_PROMPTS = {
  shop_foreman: `You are Chronos in Shop Foreman mode - a direct, efficiency-focused time coach.
Your style:
- Brief and actionable. No fluff.
- Focus on momentum and optimization.
- Fill gaps productively. Time is a resource to deploy.
- Challenge low-value activities. "Does this serve your goals?"
- Celebrate wins quickly, then move on.

Never be harsh or dismissive. You're a trusted foreman who respects the worker.
Think: efficient factory floor manager who genuinely wants the best output.`,

  supportive_peer: `You are Chronos in Supportive Peer mode - a warm, protective time companion.
Your style:
- Prioritize wellbeing over productivity.
- Guard white space fiercely. Rest is productive.
- Gentle nudges, not demands.
- Validate feelings. "That sounds like a lot."
- Celebrate effort, not just results.

Never be patronizing or dismissive of ambition. You're a trusted friend who protects boundaries.
Think: wise colleague who reminds you to breathe.`,
} as const;

// ----------------------------------------------------------------------------
// Calendar Configuration
// ----------------------------------------------------------------------------

export const CALENDAR_CONFIG = {
  // Sync settings
  syncIntervalMs: 5 * 60 * 1000,    // 5 minutes
  initialFetchPastDays: 30,
  initialFetchFutureDays: 90,

  // Google OAuth
  google: {
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  },

  // Event processing
  defaultGrain: 'shallow' as const,
  deepWorkKeywords: ['focus', 'deep work', 'heads down', 'no meetings'],
  sacredKeywords: ['blocked', 'protected', 'sacred', 'personal'],
} as const;

// ----------------------------------------------------------------------------
// Voice Configuration
// ----------------------------------------------------------------------------

export const VOICE_CONFIG = {
  // Web Speech API settings
  webSpeech: {
    continuous: false,
    interimResults: true,
    lang: 'en-US',
  },

  // Intent classification
  intentClassification: {
    commandKeywords: ['block', 'schedule', 'create', 'move', 'cancel', 'delete', 'add'],
    queryKeywords: ['what', 'when', 'how', 'show', 'tell me', 'whats'],
    memoKeywords: ['note', 'remind', 'remember', 'memo', 'for my'],
  },

  // Text-to-speech
  tts: {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  },
} as const;

// ----------------------------------------------------------------------------
// Bouncer Configuration (Notification Filtering)
// ----------------------------------------------------------------------------

export const BOUNCER_CONFIG = {
  // Priority thresholds
  bypassThreshold: 60,              // Score above this bypasses filter
  lobbyThreshold: 30,               // Score below this goes to lobby

  // Scoring weights
  scoring: {
    vipContact: 50,
    emergencyContact: 100,
    urgentKeywords: 30,
    lowPriorityKeywords: -20,
    goalRelated: 20,
    sacredTimeActive: -40,
  },

  // Emergency detection
  emergencySignals: ['911', 'emergency', 'urgent', 'hospital', 'asap'],

  // Batch delivery
  batchDeliveryDelayMs: 30 * 60 * 1000,  // 30 minutes
} as const;

// ----------------------------------------------------------------------------
// Goal Tracking Configuration
// ----------------------------------------------------------------------------

export const GOAL_CONFIG = {
  // Drift detection
  driftThresholdDays: 7,            // Days without activity before "drifting"

  // Nudge timing
  nudgeIntervalDays: 3,             // Don't nudge more than every 3 days
  maxNudgesBeforeEscalate: 3,       // After 3 nudges, escalate approach

  // Deadline warnings
  deadlineWarningDays: [30, 7, 1],  // Days before deadline to warn
} as const;

// ----------------------------------------------------------------------------
// UI Configuration
// ----------------------------------------------------------------------------

export const UI_CONFIG = {
  // Animation durations (ms)
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Zoom levels
  zoomLevels: ['year', 'month', 'week', 'day', 'focus'] as const,

  // Color tokens (Tailwind classes)
  colors: {
    conflict: 'red-500',
    protected: 'green-500',
    deepWork: 'blue-500',
    shallow: 'gray-300',
    voiceMemo: 'amber-400',
    goalLinked: 'purple-500',
  },

  // Time visualization
  timeGrid: {
    hourHeight: 60,                 // Pixels per hour in day view
    dayWidth: 120,                  // Pixels per day in week view
  },
} as const;

// ----------------------------------------------------------------------------
// Environment Variables
// ----------------------------------------------------------------------------

export function getEnvVar(key: string, required: boolean = true): string {
  const value = import.meta.env[key];
  if (!value && required) {
    console.error(`Missing required environment variable: ${key}`);
  }
  return value ?? '';
}

export const ENV = {
  OPENROUTER_API_KEY: () => getEnvVar('VITE_OPENROUTER_API_KEY'),
  GOOGLE_CLIENT_ID: () => getEnvVar('VITE_GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: () => getEnvVar('VITE_GOOGLE_CLIENT_SECRET', false),
  VOICE_PROXY_URL: () => getEnvVar('VITE_VOICE_PROXY_URL', false),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;
