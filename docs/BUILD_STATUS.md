# Build Status Tracker

Last updated: 2026-01-18

## Baseline Estimate
- Overall: **~60%** (updated from 50%)
- Basis: README MVP + specs

## MVP Checklist

Status legend: Done | In Progress | Not Started

### App Shell & Navigation
- In Progress - App shell layout with tabs (`web/src/app.tsx`)
- Not Started - Routing for core areas (intake, timeline, goals, settings)
- Not Started - Global loading/empty states

### Intake Flow (60-second calibration)
- Done - Intake UI screens (velocity, geometry, constellation) (`web/src/components/features/IntakeFlow.tsx`)
- Done - Persona + bouncer mode derivation (automatic from velocity)
- Done - Store logic for intake state transitions (`web/src/stores/user.store.ts`)
- Done - Default user state + persistence (`web/src/db/schema.ts`)
- Done - Voice-first delivery (TTS for questions)

### Calendar Sync (Google OAuth first)
- Done - OAuth flow + token storage (`web/src/services/google-auth.service.ts`)
- Done - Calendar list fetch (`web/src/services/google-calendar.service.ts`)
- Done - Event sync + upsert pipeline (sync token support)
- Done - Sync status UI / calendar picker (`web/src/components/features/CalendarConnect.tsx`)
- Done - Setup documentation (`docs/CALENDAR_SETUP.md`)

### Time GPS (Zoomable year → 15-min view)
- Done - Zoom state model + configs (`web/src/types/life-os.types.ts`)
- Done - Pinch/drag/keyboard logic hook (`web/src/hooks/useTimeGPS.ts`)
- Done - DOM-based timeline rendering (`web/src/components/features/TimelineView.tsx`)
- Done - Event blocks + semantic zoom density (`web/src/components/features/EventBlock.tsx`)
- Done - Day/week/month/quarter/year view switching UI
- Done - Events store with local CRUD (`web/src/stores/events.store.ts`)

### Voice Input (Speak events, attach voice memos)
- Done - Web Speech integration (listen/transcribe) (`web/src/hooks/useVoice.ts`)
- Done - ElevenLabs proxy (TTS/STT) (`server/index.js`)
- Done - Intent classification + time parsing (`web/src/services/voice-intent.service.ts`)
- Done - Voice → event creation in local DB
- Done - Voice memo recording + storage (`web/src/hooks/useVoiceMemo.ts`, `web/src/services/voice-memo.service.ts`)
- Done - Voice memo attachment to events
- Done - Voice UI components (`web/src/components/features/VoicePanel.tsx`, `web/src/components/features/VoiceMemoList.tsx`)

### Bouncer (Notification filtering)
- Not Started - Scoring engine + lobby rules
- Not Started - Notification queue + delivery
- Not Started - Bouncer UI + preferences

### Learning (Ralph Loop)
- Done - Core store + hypothesis/pattern logic (`web/src/stores/ralph.store.ts`)
- Done - Hooks for integration (`web/src/hooks/useRalph.ts`)
- In Progress - UI integration points (suggestion components)
- Not Started - Transparency UI ("What I've learned") surface

### Temporal Summaries
- Done - Summary service + LLM narrative (`web/src/services/summary.service.ts`)
- In Progress - Scheduling integration in UI/app lifecycle
- Not Started - Summary display UI (day/week/month/year)

### Offline-First & Privacy
- Done - Local-first schema + persistence utilities (`web/src/db/schema.ts`)
- Not Started - Encryption at rest for sensitive fields
- Not Started - Data export/import UI
- Not Started - "Last synced" indicators

### Goals & Coaching
- Done - Base goal types (`web/src/types/index.ts`)
- Not Started - Goal CRUD UI + progress views
- Not Started - Coaching conversations + goal drift detection UI

### Themes & Gamification
- Done - Theme tokens + CSS variables (`web/src/styles/themes.css`)
- Done - Theme selector UI (`web/src/components/features/ThemeSelector.tsx`)
- Done - Activity tracking (voice wired, calendar placeholder)
- Done - Fun theme lock at 30 active days (`web/src/lib/themes.ts`)

## What's Next (Highest Impact)
1. ~~Add Google OAuth + calendar sync service.~~ ✓
2. ~~Implement intake flow UI to unlock persona + initial data.~~ ✓
3. Build proper routing (react-router).
4. Add transparency UI for Ralph Loop ("What I've learned").
5. Add summary display UI.
6. Add Bouncer notification filtering.

## Notes / Concerns
- Time GPS, Voice Input, and Calendar Sync are now functional end-to-end.
- Calendar sync requires Google Cloud setup (see `docs/CALENDAR_SETUP.md`).
- Offline-first promise needs encryption + export to be credible.
- LLM features require API key; fallback exists but UX needs guardrails.

## Change Orders
- 2026-01-17: Added voice intent classification flow, voice memo storage, and UI wiring hooks/components.
- 2026-01-17: Completed voice UI wiring with intent handling stub + memo list.
- 2026-01-17: Added `web/src/app.tsx` as a voice sandbox shell to mount `VoicePanel`.
- 2026-01-17: Added theme realms, selector UI, and 30-day unlock tracking.
- 2026-01-18: Completed Time GPS with DOM-based timeline, event blocks, semantic zoom, and view switching.
- 2026-01-18: Completed Voice → event creation with time parsing (e.g., "schedule meeting tomorrow morning").
- 2026-01-18: Added events store (`web/src/stores/events.store.ts`) for local-first event CRUD.
- 2026-01-18: Wired voice memo attachment to events store.
- 2026-01-18: Added Google Calendar OAuth + sync pipeline with incremental sync tokens.
- 2026-01-18: Added intake flow UI with 3 calibration questions + voice-first delivery.