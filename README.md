# CHRONOS: Life Operating System

> Your time is a GPS. This is the map.

## What This Is

A voice-first AI companion that:
- **Absorbs** your calendars (Google, Apple, Outlook) into one zoomable time map
- **Protects** your focus like a bouncer at a VIP club
- **Coaches** you toward your goals proactively
- **Learns** your patterns and self-corrects when wrong

## Quick Start

### For Claude Code

```bash
# 1. Clone/download this folder
# 2. Navigate to it
cd chronos

# 3. Open Claude Code
claude

# 4. Claude reads CLAUDE.md automatically and understands the project
```

### Environment Setup

```bash
# Copy the example env file
cp .env.example .env

# Add your API keys:
# - OPENROUTER_API_KEY (required)
# - GOOGLE_CLIENT_ID (for calendar)
# - GOOGLE_CLIENT_SECRET (for calendar)
```

## Project Structure

```
chronos/
├── CLAUDE.md          ← AI reads this first (the brain)
├── README.md          ← You're reading this
│
├── agents/            ← AI personality definitions
│   ├── intake_agent.md     # Onboarding conversation
│   ├── horizon_guide.md    # Main companion persona
│   └── bouncer_agent.md    # Notification filtering
│
├── directives/        ← Plain-English instructions (SOPs)
│   └── [task files]
│
├── loops/             ← Self-learning systems
│   ├── ralph/         # Pattern detection
│   └── compound/      # Scheduled routines
│
├── memory/            ← User data (generated)
│   ├── user_state.json
│   └── patterns.json
│
├── config/            ← System configuration
└── web/               ← React application
```

## The Philosophy

### DOE Framework
- **D**irective: You write plain English instructions
- **O**rchestration: AI makes decisions and adapts
- **E**xecution: Code does the deterministic work

### Ralph Loop (Self-Learning)
- **R**ecognition: Notice when you override AI suggestions
- **A**daptation: Guess why you did it differently
- **L**earning: Test the guess, confirm or reject
- **P**attern: Store confirmed learnings
- **H**abit: Apply patterns proactively

## MVP Features

1. **Intake Flow** - 60-second calibration
2. **Calendar Sync** - Google OAuth first
3. **Time GPS** - Zoomable year → 15-min view
4. **Voice Input** - Speak events, attach voice memos
5. **Bouncer** - Notification filtering
6. **Learning** - Pattern observation logging

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **LLM:** OpenRouter (Claude, GPT-4, Gemini)
- **Voice:** Web Speech API → Deepgram (upgrade)
- **Mobile:** Capacitor (same codebase)
- **State:** Zustand

## Commands for Claude Code

Once Claude Code is running, you can say things like:

- "Build the intake flow UI"
- "Set up Google Calendar OAuth"
- "Create the zoomable time visualization"
- "Implement voice memo recording"
- "Wire up OpenRouter for the AI"

Claude will read the directive files and build accordingly.

## License

MIT
