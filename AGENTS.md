# AGENTS.md - Coding Conventions & Patterns
## Chronos Life Operating System

This document captures patterns, conventions, and learnings for Chronos development. It serves as institutional knowledge for both humans and AI agents.

---

## Core Principles

### 1. Ralph First
Every user-facing suggestion must integrate with Ralph Loop:
```typescript
// Always log interactions
ralph.logInteraction(type, suggestion, response, context);

// Always check for pattern modifications before suggesting
const modifications = ralph.applyPatterns(context);
if (modifications.some(m => m.type === 'skip_suggestion')) return null;
```

### 2. Autonomy by Default (75-80%)
- **Auto-apply** patterns without asking
- **Silent learning** - no notifications during hypothesis testing
- **Notify** only on: new confirmed patterns, autonomous actions taken, decay warnings
- **Ask** only when genuinely uncertain (decay threshold hit)

### 3. Persona Awareness
All AI responses must respect the active persona:
```typescript
const persona = useUserStore(state => state.persona);
const prompt = PERSONA_PROMPTS[persona ?? 'supportive_peer'];
```

### 4. Offline First
- All core features must work without network
- Sync on reconnection, not as prerequisite
- Show "last synced" indicators, never block on sync

---

## File Organization

```
web/src/
├── types/           # Shared TypeScript types (single source of truth)
├── db/              # Dexie database schema and utilities
├── lib/             # Pure functions, config, constants
├── stores/          # Zustand stores (state management)
├── hooks/           # Custom React hooks
├── services/        # External API integrations
├── components/
│   ├── ui/          # Generic, reusable components (buttons, inputs)
│   └── features/    # Feature-specific components
└── routes/          # Page components
```

### Import Order
```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. External libraries
import { nanoid } from 'nanoid';

// 3. Internal: types
import type { ChronosEvent, Pattern } from '../types';

// 4. Internal: lib/stores/services
import { RALPH_CONFIG } from '../lib/config';
import { useRalphStore } from '../stores/ralph.store';

// 5. Internal: hooks
import { useRalph } from '../hooks/useRalph';

// 6. Internal: components
import { Button } from '../components/ui/Button';
```

---

## TypeScript Patterns

### Types vs Interfaces
- Use `interface` for objects that will be extended
- Use `type` for unions, primitives, and computed types
- Export all types from `types/index.ts`

### Strict Null Handling
```typescript
// Good: explicit null in type
persona: Persona | null;

// Good: nullish coalescing with sensible default
const name = user.name ?? 'Anonymous';

// Bad: non-null assertion
const name = user.name!;  // Never do this
```

### Discriminated Unions
```typescript
// Good: discriminated union for clear intent handling
type VoiceIntent =
  | { type: 'command'; action: CommandAction; params: Record<string, unknown> }
  | { type: 'query'; question: string }
  | { type: 'memo'; targetEventId: string | null; content: string };

// Usage with exhaustive check
switch (intent.type) {
  case 'command': return handleCommand(intent.action, intent.params);
  case 'query': return handleQuery(intent.question);
  case 'memo': return handleMemo(intent.targetEventId, intent.content);
  default: return intent satisfies never;
}
```

---

## Zustand Patterns

### Store Structure
```typescript
interface ExampleStore {
  // State
  items: Item[];
  loading: boolean;

  // Actions (mutate state)
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;

  // Queries (derive from state)
  getItemById: (id: string) => Item | undefined;

  // Persistence
  syncToDb: () => Promise<void>;
  loadFromDb: () => Promise<void>;
}
```

### Immer for Mutations
```typescript
// Good: immer middleware allows direct mutation syntax
set((state) => {
  state.items.push(newItem);
});

// Avoid: manual immutable updates (error-prone)
set((state) => ({
  items: [...state.items, newItem],
}));
```

### Selectors for Performance
```typescript
// Define selectors outside component
export const selectActiveGoals = (state: UserStore) =>
  state.goals.filter(g => g.status === 'active');

// Use in component
const activeGoals = useUserStore(selectActiveGoals);
```

---

## React Patterns

### Component Structure
```typescript
// components/features/GapSuggestion.tsx

interface GapSuggestionProps {
  gap: TimeGap;
  onAccept: () => void;
  onReject: () => void;
}

export function GapSuggestion({ gap, onAccept, onReject }: GapSuggestionProps) {
  // 1. Hooks (stores, custom hooks)
  const { trackSuggestion, getPatternModifications } = useRalph();
  const persona = useUserStore(state => state.persona);

  // 2. Derived state
  const context = useMemo(() => getCurrentContext(), []);
  const modifications = getPatternModifications(context);

  // 3. Early returns
  if (modifications.some(m => m.type === 'skip_suggestion')) {
    return null;
  }

  // 4. Event handlers
  const handleAccept = useCallback(() => {
    trackSuggestion('gap_fill', suggestion, 'accepted', context);
    onAccept();
  }, [trackSuggestion, suggestion, context, onAccept]);

  // 5. Render
  return (
    <div className="...">
      {/* ... */}
    </div>
  );
}
```

### Custom Hooks Pattern
```typescript
// hooks/useVoice.ts

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = useCallback(() => {
    // Implementation
  }, []);

  const stopListening = useCallback(() => {
    // Implementation
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}
```

---

## Ralph Loop Integration

### Every Suggestion Must Log
```typescript
// Before presenting suggestion to user
const suggestion = generateSuggestion(context);

// On user response
function handleAccept() {
  ralph.logInteraction('gap_fill', suggestion, 'accepted', context);
  // Execute suggestion
}

function handleReject() {
  ralph.logInteraction('gap_fill', suggestion, 'rejected', context);
  // Don't execute
}
```

### Check Patterns Before Suggesting
```typescript
function shouldShowSuggestion(type: SuggestionType, context: InteractionContext): boolean {
  const modifications = ralph.applyPatterns(context);
  return !modifications.some(m => m.type === 'skip_suggestion');
}
```

### Hypothesis Testing
```typescript
// If testing a hypothesis, include the ID
const activeHypothesis = ralph.getActiveHypotheses()
  .find(h => h.triggerCondition.suggestionType === 'gap_fill');

ralph.logInteraction('gap_fill', suggestion, response, context, {
  hypothesisId: activeHypothesis?.id,
});
```

---

## Error Handling

### Always Log Errors
```typescript
import { logError } from '../db/schema';

try {
  await syncCalendar();
} catch (error) {
  await logError({
    timestamp: new Date(),
    phase: 'calendar_sync',
    description: 'Failed to sync calendar',
    stackTrace: error instanceof Error ? error.stack ?? null : null,
    rootCause: 'Token expired',
    fix: 'Trigger token refresh',
    prevention: 'Add proactive token refresh before expiry',
  });

  // User-facing error handling
  showToast('Sync failed. Will retry.');
}
```

### Self-Annealing Pattern
After fixing a bug, add to this file:
```markdown
## Lessons Learned

### [Date]: Calendar Sync Token Refresh
- **Symptom**: Sync fails silently after token expires
- **Root cause**: No proactive token refresh
- **Fix**: Added refresh 5 minutes before expiry
- **Prevention**: Always check token expiry before API calls
```

---

## Testing Patterns

### Test File Location
Tests go next to the file they test:
```
stores/
├── ralph.store.ts
├── ralph.store.test.ts
```

### Test Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useRalphStore } from './ralph.store';

describe('RalphStore', () => {
  beforeEach(() => {
    useRalphStore.setState({ interactions: [], hypotheses: [], patterns: [] });
  });

  describe('logInteraction', () => {
    it('should add interaction to store', () => {
      const { logInteraction, interactions } = useRalphStore.getState();
      logInteraction('gap_fill', 'test', 'accepted', mockContext);
      expect(useRalphStore.getState().interactions).toHaveLength(1);
    });

    it('should trigger hypothesis after 3 rejections', () => {
      // Test implementation
    });
  });
});
```

---

## Performance Guidelines

### Avoid Expensive Re-renders
```typescript
// Bad: creates new array on every render
const activeGoals = goals.filter(g => g.status === 'active');

// Good: use selector
const activeGoals = useUserStore(selectActiveGoals);
```

### Memoize Expensive Computations
```typescript
const eventsByDay = useMemo(() => {
  return groupEventsByDay(events);
}, [events]);
```

### Virtualize Long Lists
For 50+ items, use virtualization:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## Lessons Learned

*(Add entries as bugs are encountered and fixed)*

### Template
```markdown
### [Date]: [Title]
- **Symptom**: What went wrong
- **Root cause**: Why it went wrong
- **Fix**: What fixed it
- **Prevention**: How to avoid in future
```

---

## Decision Log

### 2025-01-17: Local-First Persistence
- **Context**: Needed to decide on data persistence strategy
- **Options**: Cloud-only, Local-only, Hybrid
- **Decision**: Local-first with IndexedDB (Dexie.js)
- **Rationale**: Works offline, privacy-friendly, no backend for MVP
- **Consequences**: Need to add cloud sync later if multi-device needed

### 2025-01-17: 75-80% Autonomy for Ralph
- **Context**: How much should AI ask vs act?
- **Decision**: Default to autonomous action, notify after
- **Rationale**: Reduces friction, builds trust through competence
- **Consequences**: Must have good "undo" / "that was wrong" mechanisms
