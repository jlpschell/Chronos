# Chronos Implementation Plan
## Compound Engineering Approach

**Version:** 1.0
**Created:** 2025-01-17
**Status:** Planning Phase

## Change Orders
- 2026-01-17: Added voice intent classification flow, voice memo storage, and UI wiring hooks/components.
- 2026-01-17: Added voice intent handling stub and memo list UI for finishing voice area.
- 2026-01-17: Added theme realms, selector UI, and 30-day unlock tracking.
- 2026-01-18: Completed Time GPS with DOM-based timeline, event blocks, semantic zoom, and view switching.
- 2026-01-18: Completed Voice → event creation with time parsing.
- 2026-01-18: Added events store for local-first event CRUD + voice memo attachment.

---

## Executive Summary

Build a voice-first "time GPS" that absorbs calendars, visualizes time as a zoomable map, and learns user patterns through the Ralph Loop. Ship incrementally with each phase delivering standalone value.

---

## Architecture Decisions (Locked)

### Decision 1: Data Persistence
**Choice:** Local-first with IndexedDB + optional cloud sync later
**Rationale:**
- Works offline immediately
- No backend to build for MVP
- Privacy-friendly (data stays on device)
- Cloud sync can be added Phase 3+

### Decision 2: Voice Processing
**Choice:** Web Speech API (MVP) → Deepgram API (upgrade)
**Rationale:**
- Web Speech API is free and works in Chrome/Edge
- Capacitor native plugins for mobile
- Deepgram as fallback for unsupported browsers

### Decision 3: LLM Integration
**Choice:** OpenRouter with model fallback chain
**Rationale:**
- Single API, multiple models
- Cost optimization (use cheaper models for simple tasks)
- Fallback chain: Claude Sonnet → GPT-4o → Gemini Flash

### Decision 4: Calendar Provider Priority
**Choice:** Google Calendar first, Apple/Outlook Phase 2
**Rationale:**
- Best OAuth documentation
- Most common provider
- Real-time webhooks available

### Decision 5: Visualization
**Choice:** Linear timeline only for MVP (radial deferred)
**Rationale:**
- Simpler to build and debug
- Covers 80% of users (linear thinkers)
- Radial can be Phase 3 enhancement

### Decision 6: State Management
**Choice:** Zustand + Immer
**Rationale:**
- Minimal boilerplate
- Good TypeScript support
- Easy persistence middleware

### Decision 7: Notification Filtering (Bouncer)
**Choice:** Chronos-only notifications MVP, OS integration later
**Rationale:**
- Web apps can't intercept other app notifications
- Focus on what we control
- Native Capacitor integration Phase 3+

---

## Tech Stack (Final)

```
Frontend:        React 18 + TypeScript + Vite
Styling:         Tailwind CSS + Radix UI primitives
State:           Zustand + Immer
Persistence:     IndexedDB via Dexie.js
Voice:           Web Speech API → Deepgram
LLM:             OpenRouter API
Calendar:        Google Calendar API (OAuth 2.0)
Mobile:          Capacitor (iOS/Android)
Testing:         Vitest + Testing Library
```

---

## Phase 0: Foundation (Days 1-2)
### Goal: Runnable app skeleton with all tooling configured

#### Deliverables
- [ ] Vite + React + TypeScript project initialized
- [ ] Tailwind CSS configured
- [ ] Zustand store skeleton
- [ ] Dexie.js database schema
- [ ] Environment variable handling
- [ ] Basic routing (react-router)
- [ ] Component library setup (Radix primitives)

#### File Structure
```
web/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── index.tsx          # Landing/dashboard
│   │   ├── intake.tsx         # Onboarding flow
│   │   └── horizon.tsx        # Main calendar view
│   ├── components/
│   │   ├── ui/                # Radix-based primitives
│   │   └── features/          # Feature-specific components
│   ├── stores/
│   │   ├── user.store.ts      # User state + preferences
│   │   ├── calendar.store.ts  # Events + calendars
│   │   └── ralph.store.ts     # Learning loop state
│   ├── db/
│   │   └── schema.ts          # Dexie database schema
│   ├── services/
│   │   ├── openrouter.ts      # LLM client
│   │   ├── calendar.ts        # Google Calendar API
│   │   └── voice.ts           # Speech recognition/synthesis
│   ├── hooks/
│   │   ├── useVoice.ts
│   │   ├── useCalendar.ts
│   │   └── useRalph.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

#### Acceptance Criteria
- `npm run dev` starts the app
- `npm run build` produces production bundle
- `npm run test` runs test suite
- TypeScript strict mode enabled, no errors
- Tailwind classes apply correctly

---

## Phase 1: Intake Flow (Days 3-4)
### Goal: New users complete calibration in <60 seconds

#### Deliverables
- [ ] Three-question calibration UI
- [ ] Voice input for answers
- [ ] Text fallback (tap to select)
- [ ] User state persisted to IndexedDB
- [ ] Persona selection based on answers
- [ ] "Recalibrate" trigger mechanism

#### User Flow
```
Welcome Screen
    ↓
Question 1: Velocity (A/B)
    ↓
Question 2: Geometry (A/B)
    ↓
Question 3: Constellation (A/B/C)
    ↓
Confirmation + Persona Assignment
    ↓
Calendar Connection Prompt
```

#### Key Components
```typescript
// IntakeQuestion.tsx - Reusable question component
// IntakeProgress.tsx - Progress indicator
// VoiceInput.tsx - Speech recognition with visual feedback
// PersonaReveal.tsx - Calibration result display
```

#### Acceptance Criteria
- Complete flow in <60 seconds (timed)
- Voice recognition works for "A", "B", "first one", "fill it", etc.
- Partial progress survives page refresh
- User state correctly populated in store + IndexedDB

---

## Phase 2: Calendar Integration (Days 5-7)
### Goal: Google Calendar events visible in Chronos

#### Deliverables
- [ ] Google OAuth 2.0 flow
- [ ] Token storage (encrypted in IndexedDB)
- [ ] Event fetch (past 30 days + future 90 days)
- [ ] Recurring event expansion
- [ ] Real-time sync via polling (webhooks Phase 2.5)
- [ ] Unified event schema

#### Event Schema
```typescript
interface ChronosEvent {
  id: string;
  externalId: string;           // Google Calendar event ID
  provider: 'google' | 'apple' | 'outlook' | 'local';
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  attendees: Attendee[];
  recurrence?: RecurrenceRule;
  color?: string;
  voiceMemos: VoiceMemo[];      // Chronos-specific
  goalLinks: string[];          // Linked goal IDs
  bufferBefore?: number;        // Minutes
  bufferAfter?: number;
  grain: 'sacred' | 'shallow' | 'transition';
  lastSynced: Date;
}
```

#### Acceptance Criteria
- OAuth completes without manual token handling
- Events appear within 5 seconds of connection
- Recurring events expand correctly for 90-day window
- Token refresh happens silently
- Offline: show cached events with "last synced" indicator

---

## Phase 3: Time GPS Visualization (Days 8-11)
### Goal: Zoomable timeline from year → 15-minute blocks

#### Deliverables
- [ ] Year view (12 month tiles, density indicators)
- [ ] Month view (calendar grid with event previews)
- [ ] Week view (7 columns, hourly rows)
- [ ] Day view (hour blocks with full event details)
- [ ] 15-minute view (granular scheduling)
- [ ] Pinch/scroll zoom transitions
- [ ] Visual indicators (conflicts, buffers, voice memos)

#### Zoom Levels
```
Level 0: Year   → 12 months as cards
Level 1: Month  → Traditional calendar grid
Level 2: Week   → 7-day horizontal, 24-hour vertical
Level 3: Day    → Single day, hourly blocks
Level 4: Focus  → 15-minute granularity
```

#### Visual Language
```css
/* Color tokens */
--conflict: red-500       /* Overlapping events */
--protected: green-500    /* Sacred time blocks */
--deep-work: blue-500     /* Focus blocks */
--shallow: gray-300       /* Admin/email time */
--voice-memo: amber-400   /* Has voice attachment */
--goal-linked: purple-500 /* Connected to goal */
```

#### Key Components
```typescript
// TimelineContainer.tsx - Manages zoom state + gestures
// YearView.tsx, MonthView.tsx, WeekView.tsx, DayView.tsx
// EventBlock.tsx - Rendered event with interactions
// ConflictIndicator.tsx - Overlap warning
// ZoomControls.tsx - Manual zoom buttons (accessibility)
```

#### Acceptance Criteria
- Smooth zoom transitions (<300ms)
- Touch gestures work on mobile (pinch/spread)
- Keyboard navigation (arrow keys, +/- for zoom)
- Conflicts visually obvious at all zoom levels
- Performance: 500+ events render without lag

---

## Phase 4: Voice Core (Days 12-14)
### Goal: Speak to create events and attach memos

#### Deliverables
- [ ] Always-listening mode (optional)
- [ ] Push-to-talk mode (default)
- [ ] Transcription display with confidence
- [ ] Intent classification (command/query/memo/conversation)
- [ ] Event creation from voice
- [ ] Voice memo recording + attachment
- [ ] Text-to-speech responses (persona-aware)

#### Intent Classification
```typescript
type VoiceIntent =
  | { type: 'command'; action: CommandAction; params: Record<string, unknown> }
  | { type: 'query'; question: string }
  | { type: 'memo'; targetEvent?: string; content: string }
  | { type: 'conversation'; content: string };

type CommandAction =
  | 'create_event'
  | 'move_event'
  | 'cancel_event'
  | 'block_time'
  | 'set_reminder'
  | 'update_goal';
```

#### Voice Memo Schema
```typescript
interface VoiceMemo {
  id: string;
  eventId: string;
  audioBlob: Blob;
  transcript: string;
  duration: number;
  createdAt: Date;
  playbackPosition?: number;
}
```

#### Acceptance Criteria
- Transcription accuracy >90% for clear speech
- Intent correctly classified >85% of time
- Voice memo attaches to correct event
- TTS responses match selected persona tone
- Works without microphone (text fallback)

---

## Phase 5: Ralph Loop (Days 15-18)
### Goal: System learns from every user override

This is the intelligence core. Every interaction feeds the learning engine.

#### Data Flow
```
User Action
    ↓
Log Interaction (ralph.store)
    ↓
Check Override Threshold (3x same type)
    ↓
Generate Hypothesis
    ↓
Test Hypothesis (adjusted suggestions)
    ↓
Confirm/Reject (2x confirmation needed)
    ↓
Promote to Pattern
    ↓
Apply Proactively
```

#### Deliverables
- [ ] Interaction logging (every AI suggestion + response)
- [ ] Override detection and categorization
- [ ] Hypothesis generation engine
- [ ] Hypothesis testing framework
- [ ] Pattern storage and retrieval
- [ ] Proactive application of patterns
- [ ] User transparency ("What have you learned about me?")
- [ ] Pattern decay detection

#### Core Schemas
```typescript
interface Interaction {
  id: string;
  timestamp: Date;
  suggestionType: SuggestionType;
  aiSuggested: string;
  userResponse: 'accepted' | 'rejected' | 'modified' | 'ignored';
  userAction?: string;
  context: InteractionContext;
}

interface InteractionContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayType: 'weekday' | 'weekend';
  currentLoad: 'light' | 'moderate' | 'heavy';
  previousTaskType?: string;
  energyIndicator?: string;
  recentOverrideCount: number;
}

interface Hypothesis {
  id: string;
  createdAt: Date;
  observation: string;           // "User rejected gap_fill 3x after deep_work"
  hypothesis: string;            // "User prefers recovery after deep work"
  testApproach: string;          // "Suggest break instead of tasks"
  confidenceRequired: number;    // Default: 2
  confirmations: number;
  rejections: number;
  status: 'testing' | 'confirmed' | 'rejected' | 'decayed';
}

interface Pattern {
  id: string;
  description: string;
  trigger: PatternTrigger;
  action: PatternAction;
  confidence: number;            // 0-1
  confirmedAt: Date;
  overridesSince: number;        // Decay tracking
  lastApplied?: Date;
}

type SuggestionType =
  | 'gap_fill'
  | 'buffer_suggestion'
  | 'time_estimate'
  | 'priority_order'
  | 'notification_filter'
  | 'morning_routine'
  | 'goal_nudge';
```

#### Learning Rules
```typescript
const RALPH_CONFIG = {
  hypothesisThreshold: 3,        // Overrides before hypothesis
  confirmationRequired: 2,       // Confirmations to promote
  decayThreshold: 5,             // Overrides before questioning
  observationWindow: 14,         // Days to look back
  maxActiveHypotheses: 5,        // Prevent hypothesis explosion
};
```

#### Acceptance Criteria
- Every suggestion logged with full context
- Hypothesis generated after 3 similar overrides
- Pattern promoted after 2 confirmations
- User can ask "What have you learned?" and get clear answer
- Patterns decay if user behavior changes

---

## Phase 6: Goal Tracking (Days 19-20)
### Goal: Track progress toward user goals, prevent drift

#### Deliverables
- [ ] Goal capture via voice or text
- [ ] Goal storage with measurable targets
- [ ] Activity linking (events → goals)
- [ ] Progress tracking and updates
- [ ] Drift detection (7 days no activity)
- [ ] Deadline awareness and nudges
- [ ] Goal dashboard

#### Goal Schema
```typescript
interface Goal {
  id: string;
  text: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;                 // "clients", "miles", "chapters"
  deadline?: Date;
  createdAt: Date;
  lastActivity?: Date;
  linkedEvents: string[];
  status: 'active' | 'drifting' | 'completed' | 'archived';
  nudgesSent: number;
}
```

#### Acceptance Criteria
- Goals parsed from natural language
- "I signed a client!" increments progress
- Drift detected within 24 hours of 7-day threshold
- Nudges match persona (Foreman vs Peer)
- No guilt-tripping—facts only

---

## Phase 7: Horizon Guide AI (Days 21-23)
### Goal: Proactive AI companion with persona awareness

#### Deliverables
- [ ] Morning briefing generation
- [ ] Conflict detection and resolution suggestions
- [ ] Over-commitment warnings
- [ ] Goal drift interventions
- [ ] Persona-aware response generation
- [ ] Proactive suggestions based on patterns

#### OpenRouter Integration
```typescript
interface LLMRequest {
  model: string;
  messages: Message[];
  systemPrompt: string;         // Persona-specific
  temperature: number;
  maxTokens: number;
}

const PERSONA_PROMPTS = {
  shop_foreman: `You are a direct, efficiency-focused time coach.
    Keep responses brief and actionable. Don't coddle.
    Focus on momentum and optimization.`,

  supportive_peer: `You are a warm, protective time companion.
    Prioritize user wellbeing over productivity.
    Guard white space. Be encouraging, not demanding.`,
};
```

#### Acceptance Criteria
- Morning briefing ready by configured wake time
- Conflicts surfaced within 1 minute of calendar sync
- Persona tone consistent across all interactions
- Suggestions connect to user's stated goals

---

## Phase 8: Bouncer (Days 24-25)
### Goal: Notification filtering for Chronos alerts

#### Deliverables
- [ ] Notification priority scoring
- [ ] Sacred time protection (hold notifications)
- [ ] Lobby queue for held notifications
- [ ] Batched delivery summaries
- [ ] Emergency override detection
- [ ] User controls (VIP list, bypass rules)

#### Scope Limitation (MVP)
- Only filters Chronos-generated notifications
- Does not intercept other app notifications
- OS Focus mode integration deferred

#### Acceptance Criteria
- Notifications held during sacred time
- Emergency contacts always bypass
- Lobby summary delivered at next shallow time
- Override tracking feeds Ralph Loop

---

## Phase 9: Polish & PWA (Days 26-28)
### Goal: Production-ready web app

#### Deliverables
- [ ] PWA manifest and service worker
- [ ] Offline support (cached events + queued actions)
- [ ] Loading states and skeletons
- [ ] Error boundaries and recovery
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization (<3s initial load)
- [ ] Analytics integration (privacy-respecting)

#### Acceptance Criteria
- Installable as PWA on desktop and mobile
- Works offline with clear sync indicators
- Lighthouse score >90 (performance, accessibility)
- No console errors in production

---

## Compound Engineering Integration

### Learning Capture Points

After each phase, document:

1. **Patterns discovered** → Add to `AGENTS.md`
2. **Decisions made** → Add to this plan
3. **Bugs encountered** → Add to `memory/errors.json`
4. **Code conventions** → Add to `.cursorrules` or equivalent

### Error Self-Annealing

```typescript
// memory/errors.json structure
interface ErrorLog {
  id: string;
  timestamp: Date;
  phase: string;
  description: string;
  stackTrace?: string;
  rootCause: string;
  fix: string;
  prevention: string;          // How to avoid in future
}
```

### Continuous Validation

After each feature:
```bash
npm run typecheck && npm run test && npm run lint
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google OAuth complexity | High | Use established library (google-auth-library) |
| Voice recognition accuracy | Medium | Always offer text fallback |
| LLM response latency | Medium | Streaming responses + optimistic UI |
| IndexedDB storage limits | Low | Implement cleanup for old data |
| Mobile PWA limitations | Medium | Plan Capacitor native for Phase 10 |

---

## Success Metrics

### MVP Success (Phase 9 complete)
- [ ] User completes intake in <60 seconds
- [ ] Calendar syncs within 10 seconds
- [ ] Voice creates event correctly >80% of time
- [ ] Ralph Loop generates first hypothesis within 1 week of use
- [ ] User can see "What you've learned" transparency view

### Compound Success
- [ ] Each phase builds on previous without breaking changes
- [ ] Test coverage >80%
- [ ] No regressions in shipped features
- [ ] Documentation stays current with code

---

## Next Action

**Phase 0: Initialize Project**

Run this to begin:
```bash
npm create vite@latest web -- --template react-ts
cd web
npm install
npm install -D tailwindcss postcss autoprefixer
npm install zustand immer dexie
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install react-router-dom
```

Ready to start building?
