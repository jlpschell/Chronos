# CHRONOS LIFE-OPERATING SYSTEM
## Master Intelligence File for Claude Code

**Version:** 1.0 MVP  
**Purpose:** Time GPS + Voice-First AI Life Coach  
**Stack:** React/TypeScript + OpenRouter + Capacitor (iOS/Android/Web)

---

## 🎯 WHAT WE'RE BUILDING

A "time GPS" that:
1. **Absorbs** calendars (Google, Apple, Outlook) into one unified view
2. **Visualizes** time as a zoomable map (year → month → week → day → 15-min blocks)
3. **Listens** via voice-first interaction (speak events, attach voice memos to appointments)
4. **Protects** focus time like a bouncer at a club
5. **Learns** user patterns and self-corrects when wrong
6. **Coaches** users toward their goals proactively

---

## 📁 PROJECT STRUCTURE

```
chronos/
├── CLAUDE.md              # This file - AI reads first
├── README.md              # Human documentation
├── .env.example           # Required API keys template
│
├── agents/                # AI Agent definitions
│   ├── intake_agent.md    # Onboarding conversation logic
│   ├── horizon_guide.md   # Main AI companion persona
│   └── bouncer_agent.md   # Notification filtering logic
│
├── directives/            # Plain-English SOPs (DOE Framework)
│   ├── 01_intake_protocol.md
│   ├── 02_calendar_sync.md
│   ├── 03_voice_processing.md
│   └── 04_goal_tracking.md
│
├── loops/                 # Self-learning systems
│   ├── ralph/             # Recognition-Adaptation-Learning-Pattern-Habit
│   │   ├── observer.md    # Pattern detection rules
│   │   ├── hypothesis.md  # Testing user preferences
│   │   └── memory.md      # What we've learned
│   └── compound/          # Scheduled intelligence routines
│       ├── morning_scan.md
│       ├── weekly_review.md
│       └── recalibration.md
│
├── memory/                # Persistent user state
│   ├── user_state.json    # Calibration results + preferences
│   ├── patterns.json      # Learned behaviors
│   └── overrides.json     # When user disagreed with AI
│
├── config/                # System configuration
│   ├── openrouter.ts      # LLM provider setup
│   └── calendar_apis.ts   # Calendar integration configs
│
├── web/                   # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── stores/        # Zustand state management
│   │   ├── utils/         # Helper functions
│   │   └── styles/        # CSS/Tailwind
│   └── public/
│
└── docs/                  # Extended documentation
```

---

## 🧠 AI PERSONA: HORIZON GUIDE

### Core Identity
You are **Chronos**, a time-aware AI companion. You protect human attention like it's the most valuable resource on Earth—because it is.

### Three Operating Modes (Set During Intake)

**1. Shop Foreman** (Hustle/High-Efficiency)
- Brief, commanding, optimization-focused
- Auto-fill small gaps with micro-tasks
- Voice: "You've got 15 before your call. Knock out those emails."

**2. Supportive Peer** (Harmony/Sustainable-Pace)  
- Warm, protective, buffer-focused
- Guard white space fiercely
- Voice: "I'm protecting this 30 minutes for you. Breathe."

**3. Adaptive** (Context-Aware)
- Morning = Foreman, Evening = Peer
- Detects stress and adjusts automatically

---

## 🔄 THE RALPH LOOP (Self-Learning Engine)

**R**ecognition → **A**daptation → **L**earning → **P**attern → **H**abit

### How It Works

```
RECOGNITION
├── User ignores or overrides AI suggestion
├── Log: { suggestion, user_action, context, outcome }
└── After 3 similar overrides → flag for review

ADAPTATION  
├── Generate hypothesis: "User prefers X over Y when Z"
├── Test with adjusted suggestions
└── If hypothesis fails → try alternative

LEARNING
├── Hypothesis confirmed 2x → save to user_profile
├── Notify user: "I learned you prefer [X]. Noted."
└── Update future suggestions automatically

PATTERN
├── Aggregate learnings into behavioral models
├── Morning routines, meeting styles, break timing
└── Energy patterns throughout day/week

HABIT
├── Predictive assistance before user asks
├── Pre-block time for known preferences
└── "You usually decompress after client calls. I blocked 30 min."
```

---

## 🛡️ BOUNCER PROTOCOL (Notification Guard)

### Strict Mode (Harmony Users)
```yaml
during_sacred_time:
  hold_all_notifications: true
  exceptions: [emergency_contacts_only]
  delivery: batch_during_shallow_time
  summary: "While focused: 3 emails, 1 Slack, 0 urgent"
```

### Fluid Mode (Hustle Users)
```yaml
allow_bypass:
  - opportunity_alerts  # "Client cancelled, 30m free"
  - revenue_signals     # "Payment received"
  - vip_contacts        # User-defined list
notification_style: "quick_actionable"
```

### Re-Calibration Trigger
If user overrides Bouncer 5+ times:
> "I see you're fighting the Bouncer. Want to switch modes?"

---

## 📊 DATA STRUCTURES

### user_state.json
```json
{
  "user_id": "uuid",
  "velocity": "High_Efficiency | Sustainable_Pace",
  "geometry": "Linear_Horizon | Radial_Watchface", 
  "constellation": "Solo_Pilot | Co_Pilot | Crew_Captain",
  "bouncer_mode": "Strict | Fluid",
  "goals": [
    { "id": "g1", "text": "Land 3 clients Q1", "deadline": "2025-03-31" }
  ],
  "emergency_contacts": ["wife", "boss"],
  "calibration_date": "2025-01-16T10:00:00Z",
  "recalibration_triggers": 0
}
```

### patterns.json
```json
{
  "morning_routine": {
    "wake_time": "05:30",
    "first_focus_block": "06:00-08:00",
    "prefer_no_meetings_before": "09:00"
  },
  "energy_patterns": {
    "peak_hours": ["06:00-10:00", "14:00-16:00"],
    "recovery_needed_after": ["client_calls", "deep_work_90min+"]
  },
  "override_patterns": [
    { "suggestion": "morning_tasks", "user_prefers": "exercise_first", "confidence": 0.85 }
  ]
}
```

---

## 🎤 VOICE INTERACTION SYSTEM

### Primary Input: Voice
```
User speaks → Whisper/Deepgram transcription → LLM interpretation → Action
```

### Voice Memo Attachment
```
1. User says: "Remind me about the Johnson proposal in my Thursday 2pm meeting"
2. System: Finds Thursday 2pm event
3. System: Attaches voice memo + transcript to event
4. System: Sets reminder for 10min before
```

### Quick Voice Commands
- "What's my day look like?"
- "Move my 3pm to Friday"
- "Block tomorrow morning for deep work"
- "Cancel everything after 4pm today"

---

## 🗺️ TIME GPS VISUALIZATION

### Zoom Levels
```
YEAR VIEW     → 12 months as tiles, color-coded by busyness
  ↓ pinch
MONTH VIEW    → 4-5 weeks, see patterns emerge
  ↓ pinch  
WEEK VIEW     → 7 days side by side, hourly resolution
  ↓ pinch
DAY VIEW      → Hour blocks, meetings visible
  ↓ pinch
15-MIN VIEW   → Granular scheduling, voice memos visible
```

### Visual Language
- **Red zones**: Over-committed, no buffers
- **Green zones**: Protected time, healthy spacing
- **Blue zones**: Deep work blocks
- **Gray zones**: Low-energy admin time
- **Gold pins**: Voice memos attached

---

## 🔌 INTEGRATIONS (MVP)

### Calendar Absorption
```typescript
// config/calendar_apis.ts
providers: {
  google: { oauth: true, sync: 'realtime' },
  apple: { oauth: true, sync: 'polling_5min' },
  outlook: { oauth: true, sync: 'realtime' }
}
```

### LLM Provider (OpenRouter)
```typescript
// config/openrouter.ts
export const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: 'anthropic/claude-sonnet-4-20250514',
  fallbackModels: [
    'openai/gpt-4o',
    'google/gemini-2.0-flash'
  ]
}
```

---

## 📱 DEPLOYMENT TARGETS

### Phase 1: Web (MVP)
- React + Vite + TypeScript
- Tailwind CSS
- PWA-ready

### Phase 2: Mobile
- Capacitor wrapping web app
- iOS + Android from same codebase
- Native voice APIs

### Phase 3: Desktop
- Electron wrapper
- Menu bar quick access
- System notifications

---

## 🚀 BUILD COMMANDS

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for web
npm run build

# Build for iOS
npx cap add ios && npx cap sync && npx cap open ios

# Build for Android  
npx cap add android && npx cap sync && npx cap open android
```

---

## ⚠️ CRITICAL RULES FOR CLAUDE CODE

1. **Read directives/ BEFORE writing execution code**
2. **Log all errors to memory/errors.json for self-annealing**
3. **Never hardcode API keys - always use .env**
4. **Voice is primary, text is fallback**
5. **Every feature connects back to user goals**
6. **When user overrides AI 3x, flag for pattern learning**
7. **Test locally before suggesting deployment**

---

## 🎯 MVP MILESTONE CHECKLIST

- [ ] Intake flow (Velocity, Geometry, Constellation tests)
- [ ] Google Calendar OAuth + sync
- [ ] Basic zoomable time visualization
- [ ] Voice input → event creation
- [ ] Voice memo attachment to events
- [ ] Bouncer notification filtering (basic)
- [ ] Ralph Loop observation logging
- [ ] OpenRouter LLM integration
- [ ] PWA deployment

---

## 📞 WHEN STUCK

1. Check `directives/` for the plain-English SOP
2. Check `loops/ralph/observer.md` for pattern rules
3. Check `memory/errors.json` for recent failures
4. Ask user to clarify before guessing
