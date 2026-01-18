# Chronos: Life Operating System Specification
## Beyond Calendar — A System That Understands Your Life

---

## Philosophy

**Chronos is not a calendar.** It's a life operating system that:
- Understands time as the substrate of life, not just a scheduling grid
- Knows your goals, energy, relationships, and constraints
- Coaches proactively, not reactively
- Protects your attention like a trusted advisor
- Gets smarter with every interaction without feeling invasive

**The LLM is not a feature — it's the brain.** Every interaction, suggestion, and summary is shaped by an AI that genuinely understands context.

---

# Part 1: GPS-Style Time Visualization

## The Metaphor

Google Maps changed navigation by making geography *zoomable* — from globe to street level in one fluid gesture. Chronos does this for time.

**Time is geography.** Events are places. Your goals are destinations. The AI is your navigator.

## Zoom Levels

```
Level 0: LIFE HORIZON (5-10 year view)
         ↓ pinch in
Level 1: YEAR (12 months as landscape)
         ↓ pinch in
Level 2: QUARTER (13 weeks, goal-aligned)
         ↓ pinch in
Level 3: MONTH (4-5 weeks, pattern visible)
         ↓ pinch in
Level 4: WEEK (7 days, full detail)
         ↓ pinch in
Level 5: DAY (24 hours, hourly blocks)
         ↓ pinch in
Level 6: FOCUS (15-minute granularity)
```

### Level 0: Life Horizon (New)
Most calendars stop at year view. We go further.

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR LIFE HORIZON                                          │
│                                                             │
│  2025        2026        2027        2028        2029       │
│  ┌────┐     ┌────┐     ┌────┐     ┌────┐     ┌────┐       │
│  │NOW │────▶│    │────▶│    │────▶│    │────▶│GOAL│       │
│  │    │     │    │     │    │     │    │     │ ★  │       │
│  └────┘     └────┘     └────┘     └────┘     └────┘       │
│                                                             │
│  "Financial independence by 2029"                           │
│  Current trajectory: On track (68% confidence)              │
└─────────────────────────────────────────────────────────────┘
```

**Purpose:** Connect daily actions to life goals. Show trajectory.

### Continuous Zoom (Not Discrete Steps)

```typescript
interface ZoomState {
  level: number;           // 0-6, can be fractional (2.7 = between quarter and month)
  focalPoint: Date;        // Center of view
  velocity: number;        // Pinch velocity for momentum
}

// Smooth interpolation between levels
function interpolateView(from: ZoomLevel, to: ZoomLevel, progress: number) {
  return {
    timeRange: lerp(from.timeRange, to.timeRange, easeOutCubic(progress)),
    detailLevel: lerp(from.detailLevel, to.detailLevel, progress),
    eventDensity: lerp(from.eventDensity, to.eventDensity, progress),
  };
}
```

### Gesture Implementation

```typescript
// Using react-use-gesture for unified touch/mouse/trackpad
import { usePinch, useDrag } from '@use-gesture/react';

function TimeGPS() {
  const [zoom, setZoom] = useState<ZoomState>({ level: 4, focalPoint: new Date(), velocity: 0 });

  const bindPinch = usePinch(({ offset: [scale], velocity, origin }) => {
    // Scale maps to zoom level
    const newLevel = clamp(0, 6, baseLevel - Math.log2(scale));

    // Origin determines focal point (what stays centered)
    const focalDate = screenPositionToDate(origin);

    // Velocity for momentum scrolling
    setZoom({ level: newLevel, focalPoint: focalDate, velocity: velocity[0] });
  }, {
    scaleBounds: { min: 0.1, max: 64 },
    rubberband: true,
  });

  const bindDrag = useDrag(({ movement: [dx, dy], velocity }) => {
    // Horizontal drag = move through time
    // Vertical drag at high zoom = scroll events
    const timeDelta = pixelsToTime(dx, zoom.level);
    setZoom(z => ({ ...z, focalPoint: addTime(z.focalPoint, -timeDelta) }));
  });

  return (
    <div {...bindPinch()} {...bindDrag()}>
      <TimelineCanvas zoom={zoom} />
    </div>
  );
}
```

### Visual Density Management

At different zoom levels, show different information:

| Zoom Level | What's Visible | What's Hidden |
|------------|---------------|---------------|
| Life Horizon | Major milestones, goal trajectories | Individual events |
| Year | Month density heatmap, quarterly goals | Event details |
| Quarter | Week patterns, goal progress | Individual events |
| Month | Event blocks, conflicts | Event descriptions |
| Week | Full event cards, voice memo indicators | - |
| Day | Hourly detail, attendees | - |
| Focus | 15-min slots, task breakdowns | - |

### Semantic Zoom (Content Changes, Not Just Size)

```typescript
function EventRepresentation({ event, zoomLevel }: Props) {
  if (zoomLevel < 2) {
    // Year view: just a colored dot
    return <EventDot color={event.color} />;
  }

  if (zoomLevel < 4) {
    // Month view: small block with title
    return <EventBlock title={event.title} duration={event.duration} />;
  }

  // Week/Day view: full card
  return (
    <EventCard
      title={event.title}
      time={event.time}
      attendees={event.attendees}
      voiceMemos={event.voiceMemos}
      goalLink={event.goalLink}
    />
  );
}
```

---

# Part 2: Health Data Integration

## Why Health Data Matters

Time management without energy management is incomplete. A "free" hour when you're exhausted is not the same as a free hour when you're at peak energy.

## Data Sources

### Phase 1: Self-Reported (MVP)
```
- Energy level check-ins (prompted or voice)
- Sleep quality (simple morning question)
- Stress indicators (voice tone analysis, typing patterns)
```

### Phase 2: Passive Wearables
```
- Apple Health / HealthKit (iOS)
- Google Fit / Health Connect (Android)
- Fitbit API
- Oura Ring API
- Whoop API
```

### Data Categories

```typescript
interface HealthContext {
  // Sleep
  sleepDuration: number;           // Hours
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  sleepDebt: number;               // Accumulated deficit

  // Energy
  currentEnergy: number;           // 0-100
  predictedEnergy: number[];       // Next 24 hours
  energyPattern: EnergyPattern;    // Personal curve

  // Stress
  hrvScore: number | null;         // Heart rate variability
  stressLevel: 'low' | 'moderate' | 'high';
  recoveryScore: number;           // Readiness

  // Activity
  stepsToday: number;
  activeMinutes: number;
  lastWorkout: Date | null;
}

interface EnergyPattern {
  peakHours: string[];             // ["09:00-11:00", "15:00-17:00"]
  dipHours: string[];              // ["13:00-14:00"]
  eveningFade: string;             // "18:00"
}
```

## Integration with Scheduling

### Energy-Aware Suggestions

```typescript
function suggestOptimalSlot(task: Task, healthContext: HealthContext): TimeSlot[] {
  const slots = getAvailableSlots();

  return slots
    .map(slot => ({
      ...slot,
      energyScore: predictEnergyAt(slot.start, healthContext),
      taskFit: matchTaskToEnergy(task, predictEnergyAt(slot.start, healthContext)),
    }))
    .sort((a, b) => b.taskFit - a.taskFit);
}

function matchTaskToEnergy(task: Task, energy: number): number {
  if (task.type === 'deep_work' && energy < 60) return 0.3;  // Poor fit
  if (task.type === 'deep_work' && energy > 80) return 1.0;  // Perfect fit
  if (task.type === 'admin' && energy < 40) return 0.8;      // Admin is fine when tired
  // ...
}
```

### Morning Briefing with Health

```
Shop Foreman (good health):
"Morning. You got 7.5 hours of solid sleep—you're at 85% energy.
Your peak window is 9-11am. I've blocked it for the Johnson proposal.
4 meetings, 2 deep work blocks. Let's crush it."

Supportive Peer (poor health):
"Good morning. I noticed you only got 5 hours last night.
Today might be a maintenance day, not a performance day.
I've moved your deep work to tomorrow and lightened your afternoon.
What would feel supportive right now?"
```

### Ralph Loop + Health Patterns

```typescript
// Health context becomes part of interaction logging
interface InteractionContext {
  // ... existing fields
  healthContext: {
    energyLevel: number;
    sleepQuality: string;
    stressLevel: string;
  };
}

// Hypotheses can include health factors
// "User rejects deep work suggestions when energy < 50"
// "User prefers exercise in morning when sleep > 7 hours"
```

## Privacy Architecture for Health Data

```typescript
interface HealthDataPolicy {
  storage: 'local_only';           // Never leaves device
  sharing: 'never';                // Not sent to any server
  llmAccess: 'summarized_only';    // LLM sees "energy: low" not raw HRV data
  retention: '90_days';            // Auto-delete old data
  userControl: 'full_delete';      // User can wipe anytime
}
```

---

# Part 3: Goal-Relationship Coaching

## The Coaching Relationship

Chronos isn't a task manager that nags. It's a coach that:
- **Understands** why goals matter to you
- **Tracks** progress without judgment
- **Intervenes** when you're drifting
- **Celebrates** genuine progress
- **Adapts** when circumstances change

## Goal Depth Model

```typescript
interface Goal {
  // Basic
  id: string;
  text: string;                    // "Land 3 new clients by Q1"

  // Measurable
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;

  // Motivation (Why This Matters)
  whyItMatters: string;            // "Financial security for my family"
  emotionalWeight: number;         // 0-10, how important
  connectedValues: string[];       // ["family", "security", "growth"]

  // Strategy
  keyActions: KeyAction[];         // Recurring actions that drive progress
  leadIndicators: LeadIndicator[]; // Early signals of success/failure
  obstacles: string[];             // Known blockers

  // Relationship
  lastCheckin: Date;
  checkinCadence: 'daily' | 'weekly' | 'monthly';
  coachingStyle: 'push' | 'support' | 'accountability';

  // History
  progressLog: ProgressEntry[];
  pivots: Pivot[];                 // When strategy changed
}

interface KeyAction {
  action: string;                  // "Make 5 outreach calls"
  frequency: string;               // "weekly"
  lastCompleted: Date | null;
  completionRate: number;          // 0-1
}

interface LeadIndicator {
  indicator: string;               // "Meetings booked this week"
  target: number;
  current: number;
  trend: 'up' | 'flat' | 'down';
}
```

## Coaching Conversation Patterns

### Goal Setting Conversation

```
User: "I want to get healthier"

Chronos: "I want to help you get there. Let's make this concrete so I can
actually support you.

When you picture 'healthier,' what does that look like?
(Examples: running a 5K, losing weight, having more energy, sleeping better)"

User: "I want to have more energy during the day"

Chronos: "Energy—that's a quality of life goal. I like it.

To track this, I could:
A) Ask you to rate your energy 1-10 each day
B) Look at your sleep and activity data (if you connect a wearable)
C) Both

And what would 'success' look like in 3 months? What would be different?"

User: "I'd be able to work until 6pm without feeling wiped"

Chronos: "Got it. Goal captured:

'Sustained energy until 6pm by [date]'
Measure: Daily energy rating + work duration
Why it matters: Quality of life, work effectiveness

What's one thing you could do THIS WEEK that would move the needle?
Sleep, exercise, diet, stress?"
```

### Drift Intervention (Day 7, No Activity)

```
Shop Foreman:
"Straight talk: It's been a week since you worked on 'Land 3 clients.'
You're at 1 of 3 with 45 days left.

What's blocking you?
A) Too busy with other things
B) Not sure what action to take
C) Lost motivation
D) Something changed—this goal isn't right anymore"

Supportive Peer:
"Hey, I noticed your client acquisition goal has been quiet for a week.
No judgment—life happens.

I'm curious: Is this still a priority, or has something shifted?
Sometimes goals need adjusting, and that's okay."
```

### Progress Celebration

```
"You signed your second client! 🎉

That's 2 of 3, with 30 days to spare.
At this pace, you'll likely hit your goal by [date].

What made this one happen? I'd love to learn so I can
recognize the pattern when it's working."
```

### Goal Pivot Support

```
User: "I don't think I want 3 clients anymore. Two is enough."

Chronos: "Understood. Goals should serve you, not the other way around.

I'll update this to: 'Land 2 new clients by Q1' — which you've already hit!

Should I archive this as completed, or do you want to set a new
goal that builds on this success?"
```

---

# Part 4: Goals → Weekly Planning

## The Planning Cascade

```
Life Goals (5-10 years)
    ↓ inform
Yearly Objectives
    ↓ break into
Quarterly Milestones
    ↓ schedule as
Monthly Themes
    ↓ allocate to
Weekly Priorities (MAX 3)
    ↓ block time for
Daily Actions
```

## Weekly Planning Ritual

**Triggered:** Sunday evening or Monday morning (user preference)

### The Conversation

```
Chronos: "Let's set up your week. First, a quick review:

Last week you aimed for:
1. ✅ Complete Johnson proposal (done Thursday)
2. ⚠️ 5 outreach calls (made 3)
3. ❌ Gym 3x (went once)

Overall: Mixed week. Proposal was a win.
What got in the way of outreach and gym?"

User: "Had that emergency client thing Tuesday"

Chronos: "Right, I remember. That ate 6 hours.

This week, looking at your calendar and goals:
- Client goal: You're at 2/3. Need 1 more in 25 days.
- Energy goal: Sleep has been inconsistent.
- Upcoming: Board meeting Thursday needs prep.

Here's what I'd suggest for your Big 3 this week:

1. Board meeting prep (deadline-driven, non-negotiable)
2. 5 outreach calls (goal-driven, you're behind)
3. 3 gym sessions (energy goal, pattern-building)

Does this feel right? What would you adjust?"
```

### Auto-Scheduling Logic

```typescript
async function generateWeeklyPlan(
  goals: Goal[],
  calendar: ChronosEvent[],
  healthContext: HealthContext,
  patterns: Pattern[]
): Promise<WeeklyPlan> {

  // 1. Identify deadline-driven commitments
  const deadlines = findUpcomingDeadlines(goals, 14);

  // 2. Calculate goal velocity requirements
  const goalActions = goals.map(g => ({
    goal: g,
    requiredActionsThisWeek: calculateRequiredPace(g),
    suggestedSlots: findOptimalSlots(g.keyActions, calendar, healthContext),
  }));

  // 3. Apply user patterns
  const adjustedPlan = applyPatterns(goalActions, patterns);
  // e.g., "User prefers gym in morning" → schedule gym 7am

  // 4. Check for overcommitment
  const totalHours = calculateTotalCommitment(adjustedPlan);
  if (totalHours > healthContext.sustainableHours) {
    return flagOvercommitment(adjustedPlan, totalHours);
  }

  // 5. Auto-block time for goal actions
  const blocks = generateTimeBlocks(adjustedPlan);

  return {
    bigThree: selectTopPriorities(goalActions, 3),
    timeBlocks: blocks,
    bufferHours: calculateBuffer(calendar, adjustedPlan),
    warnings: generateWarnings(adjustedPlan),
  };
}
```

### Calendar Blocking

```typescript
interface AutoBlock {
  title: string;                   // "Deep Work: Proposal"
  duration: number;                // 90 minutes
  preferredTime: TimePreference;   // { dayPart: 'morning', days: ['tue', 'thu'] }
  goalId: string;
  flexibility: 'rigid' | 'flexible' | 'optional';
  autoReschedule: boolean;         // If conflict, find new slot
}

// Example generated blocks for the week:
const weekBlocks: AutoBlock[] = [
  {
    title: "Deep Work: Board Prep",
    duration: 120,
    preferredTime: { dayPart: 'morning', days: ['mon', 'tue'] },
    goalId: 'board-meeting',
    flexibility: 'rigid',
    autoReschedule: false,
  },
  {
    title: "Outreach Calls",
    duration: 60,
    preferredTime: { dayPart: 'afternoon', days: ['mon', 'wed', 'fri'] },
    goalId: 'client-acquisition',
    flexibility: 'flexible',
    autoReschedule: true,
  },
  {
    title: "Gym",
    duration: 60,
    preferredTime: { dayPart: 'morning', days: ['tue', 'thu', 'sat'] },
    goalId: 'energy',
    flexibility: 'flexible',
    autoReschedule: true,
  },
];
```

---

# Part 5: Temporal Summaries

## Summary Philosophy

Summaries are not data dumps. They are:
- **Narrative** — Tell a story, not list facts
- **Goal-Connected** — Everything ties back to what matters
- **Actionable** — End with insight or next step
- **Emotionally Aware** — Celebrate, console, or challenge appropriately

## Summary Types

### Daily Summary (End of Day)

**Trigger:** 30 minutes before user's typical end-of-work time

```
Shop Foreman:
"Day closed. Here's the tape:

✅ Completed: Board prep (2 hrs), 3 outreach calls, team standup
⏸️ Pushed: Expense reports (moved to Friday)
🚫 Missed: Gym (calendar conflict)

Goal impact:
- Client acquisition: +3 touchpoints. Good momentum.
- Energy: No exercise, sleep debt growing. Flag for tomorrow.

Tomorrow's critical: Johnson call at 10am. Prep tonight or early AM?"

Supportive Peer:
"Wrapping up your day.

You accomplished more than you might feel—the board prep alone was
significant, and you made real progress on outreach.

The gym didn't happen, and that's okay. Tomorrow has a morning slot
at 7am if you want it.

How are you feeling about today? (Just checking in, no action needed)"
```

### Weekly Summary (Sunday Evening)

```
"Week 3 in Review

THE STORY:
This was a mixed week. You crushed deadline work (board prep delivered
Thursday, client praised the proposal) but your energy systems suffered.
Only 1 gym session and averaging 6 hours sleep.

GOAL PROGRESS:
┌─────────────────────────────────────────────────────────┐
│ Land 3 Clients by March 31                              │
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 67% (2/3)   │
│ Status: On track. Need 1 more in 24 days.               │
│ This week: 5 outreach calls, 2 meetings booked          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Sustained Energy Until 6pm                              │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 25%         │
│ Status: Drifting. Energy crashed by 4pm 3 days.         │
│ Pattern: Gym days = better energy. Correlation clear.   │
└─────────────────────────────────────────────────────────┘

THE INSIGHT:
You're sacrificing energy for output. This works short-term but
compounds negatively. The board meeting is done—this week could be
a recovery week.

SUGGESTION FOR NEXT WEEK:
Make 'gym 3x' non-negotiable. Block it first, schedule around it.
Your client goal is on track; energy is the limiting factor now."
```

### Monthly Summary (Last Day of Month)

```
"January 2025: Month in Review

HEADLINE:
A foundational month. You set up systems, landed 2 clients, and
established the gym habit (finally). Energy is stabilizing.

GOAL TRAJECTORY:

Client Acquisition (Target: 3 by March 31)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jan |████████████████████                    | 2 clients
Feb |░░░░░░░░░░░░░░░░░░░░                    | Projected: 1
Mar |░░░░░░░░░░░░░░░░░░░░                    | Projected: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Confidence: 78% to hit goal

Energy Goal (Target: 6pm sustained by April)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week 1: 3.2/5 avg
Week 2: 3.8/5 avg
Week 3: 4.1/5 avg  ← Gym habit kicked in
Week 4: 4.3/5 avg
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trend: Improving. On track.

WHAT RALPH LEARNED THIS MONTH:
- You prefer calls in the afternoon, not morning
- Deep work before 10am is 2x more productive for you
- Gym on Mon/Wed/Fri sticks better than Tue/Thu/Sat
- You ignore goal nudges on Fridays (I'll stop sending them)

PATTERNS TO WATCH:
- Sleep dips on Wednesday nights (investigate?)
- Overcommitment tendency after wins (pacing matters)

FOCUS FOR FEBRUARY:
One client away from your Q1 goal. February is about
closing, not prospecting. Shift outreach to follow-up."
```

### Yearly Summary (End of Year)

```
"2025: Your Year in Review

THE NUMBERS:
- 2,847 hours worked
- 312 deep work sessions
- 147 meetings (down 23% from 2024—you're protecting time better)
- 4 major goals completed
- 2 goals pivoted (and that's fine)

THE STORY:
2025 was the year you went from 'busy' to 'intentional.'

Q1 was about client acquisition—you hit the goal and added
financial runway. Q2 you struggled; the energy goal stalled when
work ramped up. Q3 was a reset: you simplified, said no more often,
and your energy scores jumped 40%. Q4 was harvest time.

WHAT YOU LEARNED (via Ralph):
- Your ideal week has max 15 hours of meetings
- You're most creative on Tuesday and Wednesday mornings
- Big decisions made after 3pm are 60% more likely to be regretted
- Walking meetings > sitting meetings for your thinking style

GOAL REVIEW:
✅ Land 5 clients → Completed May (started with 3-goal, upgraded)
✅ Sustained energy → Achieved September
⚠️ Write book proposal → Started, paused, needs 2026 focus
✅ Family dinner 5x/week → Averaged 4.2x, calling it a win

2026 SEEDS:
Based on your trajectory and stated values, here are goals to consider:
1. Financial: You're close to your 'freedom number'—18 more months at pace
2. Health: Energy is solved; strength could be the next frontier
3. Creative: That book is still in you. Q2 writing sabbatical?

Shall I help you plan 2026?"
```

---

# Part 6: Privacy-First Architecture

## Core Principles

1. **Local by default** — Data lives on device unless explicitly synced
2. **Encryption at rest** — Even local data is encrypted
3. **Minimal cloud** — Sync only what's necessary
4. **User owns data** — Export anytime, delete permanently
5. **LLM privacy** — No personal data in API calls

## Data Classification

```typescript
type DataSensitivity =
  | 'public'      // Can be synced, used in LLM calls
  | 'private'     // Synced encrypted, never in LLM calls
  | 'local_only'  // Never leaves device
  | 'ephemeral';  // Deleted after use

interface DataClassification {
  // Public (minimal risk)
  calendarEvents: 'private';       // Sync for multi-device, but encrypted
  goals: 'private';                // Encrypted sync
  preferences: 'public';           // Non-sensitive settings

  // Private (encrypted sync)
  interactions: 'private';         // Ralph learning data
  voiceMemos: 'local_only';        // Audio stays on device
  voiceTranscripts: 'private';     // Text can sync encrypted

  // Local only (never leaves)
  healthData: 'local_only';        // Wearable data
  contactDetails: 'local_only';    // Emergency/VIP contacts
  oauthTokens: 'local_only';       // Calendar credentials

  // Ephemeral (deleted after use)
  voiceAudio: 'ephemeral';         // Raw audio during transcription
  llmContext: 'ephemeral';         // Context window content
}
```

## LLM Privacy Layer

```typescript
// Before sending to OpenRouter, strip/anonymize personal data

interface LLMSanitizer {
  // Replace names with placeholders
  anonymizeNames(text: string): { sanitized: string; mapping: Map<string, string> };

  // Remove specific details
  stripContactInfo(text: string): string;

  // Generalize health data
  generalizeHealth(data: HealthContext): string;
  // Returns: "energy: low, sleep: poor" not "HRV: 45, sleep: 5.2 hours"

  // Restore after response
  deanonymize(response: string, mapping: Map<string, string>): string;
}

// Example flow:
async function getAIResponse(prompt: string, context: Context): Promise<string> {
  // 1. Sanitize
  const { sanitized, mapping } = sanitizer.anonymizeNames(prompt);
  const generalizedHealth = sanitizer.generalizeHealth(context.health);

  // 2. Call LLM with sanitized data
  const response = await openrouter.chat({
    messages: [
      { role: 'system', content: PERSONA_PROMPTS[persona] },
      { role: 'user', content: sanitized },
    ],
  });

  // 3. Restore names
  return sanitizer.deanonymize(response.content, mapping);
}
```

## Encryption Architecture

```typescript
// Web Crypto API for encryption
class DataEncryption {
  private key: CryptoKey;

  async initialize(userPassword: string): Promise<void> {
    // Derive key from password
    const salt = await this.getOrCreateSalt();
    this.key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      await crypto.subtle.importKey('raw', encode(userPassword), 'PBKDF2', false, ['deriveKey']),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(data: string): Promise<EncryptedData> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encode(data)
    );
    return { iv, data: encrypted };
  }

  async decrypt(encrypted: EncryptedData): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: encrypted.iv },
      this.key,
      encrypted.data
    );
    return decode(decrypted);
  }
}
```

## Data Export

```typescript
// User can export everything
async function exportUserData(): Promise<Blob> {
  const data = {
    exportDate: new Date().toISOString(),
    version: APP_VERSION,

    // All user data
    userState: await db.userState.toArray(),
    events: await db.events.toArray(),
    goals: await db.goals.toArray(),
    interactions: await db.interactions.toArray(),
    patterns: await db.patterns.toArray(),

    // Metadata
    exportFormat: 'chronos-export-v1',
    instructions: 'Import this file to restore your data',
  };

  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

// User can delete everything
async function deleteAllData(): Promise<void> {
  await db.delete();
  localStorage.clear();
  // Confirm deletion
}
```

---

# Part 7: Notification Philosophy

## The Problem with Notifications

Most apps optimize for engagement. Chronos optimizes for *life quality*.

**Bad notifications:**
- Interrupt flow state
- Create anxiety
- Demand immediate response
- Accumulate into overwhelm

**Good notifications:**
- Arrive at the right moment
- Provide genuine value
- Respect current context
- Are easy to dismiss

## Notification Categories

```typescript
type NotificationCategory =
  | 'critical'      // Must see now (emergency, imminent conflict)
  | 'important'     // Should see soon (goal drift, deadline approaching)
  | 'informational' // Nice to know (learned pattern, weekly summary ready)
  | 'celebratory';  // Positive reinforcement (goal hit, streak maintained)
```

## Delivery Intelligence

```typescript
interface NotificationDelivery {
  // When to send
  timing: 'immediate' | 'next_transition' | 'batch_daily' | 'batch_weekly';

  // How to send
  channel: 'push' | 'in_app' | 'voice' | 'silent';

  // Context requirements
  requirements: {
    notDuring: EventGrain[];       // Don't interrupt sacred time
    energyMin?: number;            // Don't send if energy too low
    timeWindow?: string[];         // Only during these hours
  };
}

const DELIVERY_RULES: Record<NotificationCategory, NotificationDelivery> = {
  critical: {
    timing: 'immediate',
    channel: 'push',
    requirements: { notDuring: [] },  // Always deliver
  },
  important: {
    timing: 'next_transition',
    channel: 'push',
    requirements: { notDuring: ['sacred'], timeWindow: ['08:00-21:00'] },
  },
  informational: {
    timing: 'batch_daily',
    channel: 'in_app',
    requirements: { notDuring: ['sacred', 'shallow'] },
  },
  celebratory: {
    timing: 'immediate',  // Celebrations are welcome
    channel: 'in_app',
    requirements: { notDuring: ['sacred'] },
  },
};
```

## Notification Content Design

### Structure
```typescript
interface ChronosNotification {
  // Identity
  id: string;
  category: NotificationCategory;

  // Content
  headline: string;           // 5-8 words max
  body?: string;              // 1-2 sentences if needed

  // Context
  relatedGoal?: string;
  relatedEvent?: string;

  // Actions (max 2)
  primaryAction?: NotificationAction;
  secondaryAction?: NotificationAction;

  // Meta
  expiresAt?: Date;           // Auto-dismiss after
  groupId?: string;           // Group similar notifications
}

interface NotificationAction {
  label: string;              // "View" | "Snooze" | "Dismiss"
  action: string;             // Deep link or action ID
  destructive?: boolean;      // Is this irreversible?
}
```

### Examples

**Good notification:**
```
📍 Conflict Alert
Your 2pm sales call overlaps with team standup.
[Resolve Now] [Remind in 1h]
```

**Bad notification:**
```
⚠️ Calendar Conflict Detected
We noticed that you have two events scheduled at the same time.
The first event is "Sales Call with Johnson Inc" scheduled from
2:00 PM to 3:00 PM. The second event is "Team Standup" scheduled
from 2:00 PM to 2:30 PM. Would you like to resolve this conflict
by moving one of the events or declining one of the invitations?
[Move Sales Call] [Move Standup] [Decline Sales Call] [Decline Standup] [Ignore]
```

### Notification Limits

```typescript
const NOTIFICATION_LIMITS = {
  // Per day
  maxPushPerDay: 5,
  maxImportantPerDay: 3,
  maxInformationalPerDay: 10,

  // Batching
  batchMinItems: 2,           // Don't batch single items
  batchMaxItems: 5,           // Summarize if more

  // Timing
  minIntervalMinutes: 30,     // Don't rapid-fire
  quietHours: ['22:00-07:00'],

  // Respect
  maxSnoozesBeforeDrop: 3,    // Stop if user keeps snoozing
};
```

## Anti-Patterns (What We Won't Do)

1. **No engagement tricks** — No "You haven't opened the app in 2 days!"
2. **No false urgency** — Everything is not urgent
3. **No dark patterns** — Dismiss is always available
4. **No notification creep** — Default to fewer, not more
5. **No guilt notifications** — "You missed your goal" → "Let's adjust your goal"

---

# Part 8: UI/UX Principles

## Design Philosophy

**Clarity over cleverness.** The interface should be so clear that users never wonder what to do next.

**Calm technology.** Chronos should reduce anxiety, not create it.

**Progressive disclosure.** Simple by default, powerful when needed.

## Visual Language

### Color Psychology

```css
/* Primary palette - calm, professional, trustworthy */
--surface: #fafafa;           /* Clean background */
--text: #1a1a1a;              /* High contrast text */
--accent: #3b82f6;            /* Trust blue - primary actions */
--success: #22c55e;           /* Completion, on-track */
--warning: #f59e0b;           /* Attention needed, drifting */
--danger: #ef4444;            /* Conflict, urgent */

/* Semantic colors for time */
--sacred: #8b5cf6;            /* Purple - protected time */
--deep-work: #3b82f6;         /* Blue - focus time */
--shallow: #9ca3af;           /* Gray - admin time */
--recovery: #22c55e;          /* Green - rest time */

/* Health indicators */
--energy-high: #22c55e;
--energy-medium: #f59e0b;
--energy-low: #ef4444;
```

### Typography

```css
/* Hierarchy */
--font-display: 'Cal Sans', system-ui;   /* Headlines, numbers */
--font-body: 'Inter', system-ui;         /* Body text */
--font-mono: 'JetBrains Mono', monospace; /* Times, durations */

/* Scale */
--text-xs: 0.75rem;    /* 12px - metadata */
--text-sm: 0.875rem;   /* 14px - secondary */
--text-base: 1rem;     /* 16px - body */
--text-lg: 1.125rem;   /* 18px - emphasis */
--text-xl: 1.25rem;    /* 20px - section headers */
--text-2xl: 1.5rem;    /* 24px - page headers */
--text-3xl: 2rem;      /* 32px - hero numbers */
```

### Motion

```css
/* Durations */
--duration-fast: 150ms;    /* Micro-interactions */
--duration-normal: 300ms;  /* Standard transitions */
--duration-slow: 500ms;    /* Significant changes */

/* Easing */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);  /* Elements entering */
--ease-in: cubic-bezier(0.7, 0, 0.84, 0);   /* Elements leaving */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful bounce */
```

## Interaction Patterns

### Voice as Primary

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    [Horizon View]                        │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                 🎤 "What can I help with?"               │
│                                                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│   │ Schedule │  │  Block   │  │  Goals   │             │
│   │ Meeting  │  │   Time   │  │ Progress │             │
│   └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

The microphone button is always accessible. Tap to speak.

### Touch Gestures

| Gesture | Action |
|---------|--------|
| Pinch | Zoom time view |
| Two-finger pan | Navigate time |
| Tap event | View/edit event |
| Long press event | Quick actions menu |
| Swipe event left | Delete/decline |
| Swipe event right | Complete/confirm |
| Pull down | Sync calendars |

### Keyboard Shortcuts (Desktop)

| Key | Action |
|-----|--------|
| `Space` | Start voice input |
| `T` | Jump to today |
| `N` | New event |
| `G` | Go to date |
| `+` / `-` | Zoom in/out |
| `←` / `→` | Navigate time |
| `1-5` | Jump to zoom level |
| `?` | Show shortcuts |

## Mobile-First, Desktop-Enhanced

```
Mobile (Primary):
- Full-screen timeline
- Bottom sheet for details
- Floating action button for voice
- Swipe gestures for navigation

Tablet:
- Split view: timeline + detail panel
- More visible information density
- Keyboard shortcuts active

Desktop:
- Full timeline with sidebar
- Multi-week visible at once
- Command palette (Cmd+K)
- Keyboard-driven workflow
```

---

# Summary: What Makes This a Life Operating System

| Feature | Calendar App | Chronos |
|---------|--------------|---------|
| Time view | Fixed (day/week/month) | Continuous zoom (5yr → 15min) |
| Context | None | Energy, health, goals, patterns |
| Intelligence | Reminders | Coaching relationship |
| Planning | Manual | AI-assisted, goal-aligned |
| Learning | None | Ralph Loop (75-80% autonomous) |
| Summaries | None | Day/week/month/year narratives |
| Privacy | Cloud-dependent | Local-first, encrypted |
| Notifications | Interrupt-driven | Context-aware, respectful |

**Chronos is not about managing time. It's about living well within time.**

The LLM is the brain. Ralph is the learning engine. The GPS visualization is the interface. Together, they create a system that truly understands your life.
