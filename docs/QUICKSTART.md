# Chronos Quick Start Guide
## From Zero to Running App

---

## What's Been Built

### Documentation
| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI agent instructions (read first) |
| `AGENTS.md` | Coding conventions & patterns |
| `docs/IMPLEMENTATION_PLAN.md` | Sequenced 9-phase build plan |
| `docs/RALPH_LOOP_SPEC.md` | Learning engine technical spec |

### Core Code Scaffolding
| File | Purpose |
|------|---------|
| `web/src/types/index.ts` | All TypeScript types |
| `web/src/db/schema.ts` | IndexedDB schema (Dexie) |
| `web/src/lib/config.ts` | Configuration constants |
| `web/src/stores/user.store.ts` | User state management |
| `web/src/stores/ralph.store.ts` | Learning engine state |
| `web/src/hooks/useRalph.ts` | Ralph integration hook |

---

## Initialize the Project

```bash
# 1. Navigate to chronos folder
cd chronos

# 2. Create Vite + React + TypeScript project
npm create vite@latest web -- --template react-ts
cd web

# 3. Install dependencies
npm install

# 4. Install core packages
npm install zustand immer dexie nanoid
npm install react-router-dom

# 5. Install UI packages
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-toast @radix-ui/react-tooltip

# 6. Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node

# 7. Initialize Tailwind
npx tailwindcss init -p

# 8. Copy the scaffolding files into web/src/
# (types/, db/, lib/, stores/, hooks/)
```

---

## Environment Setup

Create `web/.env`:
```env
VITE_OPENROUTER_API_KEY=your_key_here
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_CLIENT_SECRET=your_secret
```

---

## Build Sequence (Recommended)

### Phase 0: Foundation (Day 1-2)
```
npm run dev  # Should start with no errors
```
- [ ] Tailwind configured
- [ ] Routes set up (/, /intake, /horizon)
- [ ] Stores connected to components
- [ ] Database initialized on app start

### Phase 1: Intake Flow (Day 3-4)
Build these components:
- `IntakeWelcome.tsx`
- `IntakeQuestion.tsx` (reusable for all 3 questions)
- `IntakeProgress.tsx`
- `PersonaReveal.tsx`

Test: Complete intake in under 60 seconds.

### Phase 2: Calendar Integration (Day 5-7)
- Google OAuth flow
- Event fetching and caching
- Basic event display

### Phase 3: Time GPS (Day 8-11)
- Zoomable timeline (start with Week view)
- Event blocks with interactions
- Conflict indicators

### Phase 4: Voice (Day 12-14)
- Web Speech API integration
- Intent classification
- Voice memo recording

### Phase 5: Ralph Loop Live (Day 15-18)
- Wire up tracking to all suggestions
- Hypothesis testing in action
- "What have you learned?" UI

---

## Key Commands

```bash
# Development
npm run dev

# Type checking
npm run typecheck

# Build
npm run build

# Test
npm run test

# Lint
npm run lint
```

---

## Ralph Loop Integration Checklist

For every component that makes a suggestion:

1. **Import the hook**
   ```typescript
   import { useRalph } from '../hooks/useRalph';
   ```

2. **Check if should skip**
   ```typescript
   const { shouldSkipSuggestion } = useRalph();
   if (shouldSkipSuggestion('gap_fill')) return null;
   ```

3. **Track responses**
   ```typescript
   const { trackSuggestion } = useRalph();

   // On accept
   trackSuggestion('gap_fill', suggestionText, 'accepted');

   // On reject
   trackSuggestion('gap_fill', suggestionText, 'rejected');
   ```

---

## Next Action

Run this command to start building:

```bash
cd chronos
npm create vite@latest web -- --template react-ts
```

Then copy the scaffolding files and start with Phase 0.
