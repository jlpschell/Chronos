# Build Status Tracker

Last updated: 2026-01-19

## Baseline Estimate
- Overall: **~92%** (updated from 85%)
- Basis: README MVP + specs

## MVP Checklist

Status legend: Done | In Progress | Not Started

### App Shell & Navigation
- Done - App shell layout with navigation (`web/src/components/layout/AppLayout.tsx`)
- Done - Routing for core areas (`web/src/app.tsx` using react-router-dom)
- Done - Full Vite project setup with dependencies (`web/package.json`)
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
- Done - Scoring engine + lobby rules (`web/src/services/bouncer.service.ts`)
- Done - Notification queue + delivery (`web/src/stores/bouncer.store.ts`)
- Done - Bouncer UI + preferences (mode toggle, VIP/emergency lists, queue UI in `web/src/pages/Settings.tsx`)
- Done - Real notification sources wired (`web/src/services/notification-triggers.service.ts`)
  - Calendar event reminders (15min, 5min before)
  - Calendar conflict detection
  - Goal drift detection + deadline warnings
  - Ralph pattern learning bridge
  - System sync notifications

### Learning (Ralph Loop)
- Done - Core store + hypothesis/pattern logic (`web/src/stores/ralph.store.ts`)
- Done - Hooks for integration (`web/src/hooks/useRalph.ts`)
- Done - Transparency UI ("What I've learned") (`web/src/components/features/RalphTransparency.tsx`)
- Done - Ralph page with AI explanation (`web/src/pages/Ralph.tsx`)
- In Progress - UI integration points (suggestion components)

### Temporal Summaries
- Done - Summary service + LLM narrative (`web/src/services/summary.service.ts`)
- In Progress - Scheduling integration in UI/app lifecycle
- Done - Summary display UI (`web/src/pages/Summary.tsx`, `web/src/components/features/SummaryPanel.tsx`)

### Offline-First & Privacy
- Done - Local-first schema + persistence utilities (`web/src/db/schema.ts`)
- Not Started - Encryption at rest for sensitive fields
- Done - Data export/import UI (`web/src/components/features/DataManagement.tsx`)
  - JSON export with all user data
  - Import with merge support
  - Clear all data with confirmation
- Done - "Last synced" indicators (`web/src/components/features/LastSyncedIndicator.tsx`)
  - Relative time display (just now, 5m ago, etc.)
  - Color-coded status (green/amber/red)
  - Integrated into CalendarConnect

### Goals & Coaching
- Done - Base goal types (`web/src/types/index.ts`)
- Done - Goal CRUD UI + progress views (`web/src/components/features/GoalsPanel.tsx`)
  - Create/edit/delete goals with modal form
  - Progress ring visualization
  - Quick +1 progress button
  - Status badges (active, drifting, completed, archived)
  - Deadline countdown with urgency colors
  - Filter by status (active/completed/all)
- Not Started - Coaching conversations + goal drift detection UI

### Themes & Gamification
- Done - Theme tokens + CSS variables (`web/src/styles/themes.css`)
- Done - Theme selector UI (`web/src/components/features/ThemeSelector.tsx`)
- Done - Activity tracking (voice wired, calendar placeholder)
- Done - Fun theme lock at 30 active days (`web/src/lib/themes.ts`)

## What's Next (Highest Impact)
1. ~~Add Google OAuth + calendar sync service.~~ ✓
2. ~~Implement intake flow UI to unlock persona + initial data.~~ ✓
3. ~~Build proper routing (react-router).~~ ✓
4. ~~Add transparency UI for Ralph Loop ("What I've learned").~~ ✓
5. ~~Add summary display UI.~~ ✓
6. ~~Wire real notification sources into Bouncer.~~ ✓
7. ~~Test full flow end-to-end.~~ ✓ (Showcase page at /showcase)
8. ~~Add Goal CRUD UI + progress views.~~ ✓
9. ~~Add "Last synced" indicators across the app.~~ ✓
10. ~~Add data export/import UI for offline-first credibility.~~ ✓
11. Add encryption at rest for sensitive fields.
12. Add coaching conversations UI.
13. Add global loading/empty states.

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
- 2026-01-18: Set up full Vite project with react-router, pages, and layout components.
- 2026-01-18: Added Ralph transparency UI showing learned patterns and active hypotheses.
- 2026-01-18: Added Summary page with day/week/month summaries and metrics.
- 2026-01-18: Added Bouncer queue logic with lobby delivery and basic UI.
- 2026-01-18: Added Bouncer preferences UI (mode, VIP/emergency lists).
- 2026-01-19: Wired real notification sources into Bouncer system (`web/src/services/notification-triggers.service.ts`).
- 2026-01-19: Added calendar event reminders (15min/5min before), conflict detection.
- 2026-01-19: Added goal drift detection + deadline warnings (30/7/1 days).
- 2026-01-19: Added Ralph → Bouncer notification bridge for learned patterns + decay warnings.
- 2026-01-19: Added sync complete notifications to calendar service.
- 2026-01-19: Updated BouncerPanel with source icons, priority badges, and "Check now" trigger.
- 2026-01-19: Added GoalsPanel with full CRUD, progress rings, status badges, and deadline tracking.
- 2026-01-19: Added DataManagement component for JSON export/import and data clearing.
- 2026-01-19: Added LastSyncedIndicator with relative time and color-coded status.
- 2026-01-19: Updated ShowcasePage with Goals and Data Management sections + mock data.
- 2026-01-19: Integrated LastSyncedIndicator into CalendarConnect component.