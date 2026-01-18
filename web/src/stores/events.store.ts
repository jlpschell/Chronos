// ============================================================================
// EVENTS STORE
// Local-first event management with future calendar sync support
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { db } from '../db/schema';
import type { ChronosEvent, EventGrain, VoiceMemo } from '../types';

// ----------------------------------------------------------------------------
// Store Interface
// ----------------------------------------------------------------------------

interface EventsStore {
  // State
  events: ChronosEvent[];
  loading: boolean;

  // CRUD
  createEvent: (event: Omit<ChronosEvent, 'id' | 'createdAt' | 'updatedAt' | 'lastSynced'>) => ChronosEvent;
  updateEvent: (id: string, updates: Partial<ChronosEvent>) => void;
  deleteEvent: (id: string) => void;

  // Voice memo attachment
  attachVoiceMemo: (eventId: string, memo: VoiceMemo) => void;
  removeVoiceMemo: (eventId: string, memoId: string) => void;

  // Queries
  getEventById: (id: string) => ChronosEvent | undefined;
  getEventsInRange: (start: Date, end: Date) => ChronosEvent[];
  getEventsForDay: (date: Date) => ChronosEvent[];

  // Persistence
  syncToDb: () => Promise<void>;
  loadFromDb: () => Promise<void>;
}

// ----------------------------------------------------------------------------
// Store Implementation
// ----------------------------------------------------------------------------

export const useEventsStore = create<EventsStore>()(
  persist(
    immer((set, get) => ({
      events: [],
      loading: false,

      // ----------------------------------------------------------------
      // CRUD
      // ----------------------------------------------------------------

      createEvent: (eventData) => {
        const now = new Date();
        const event: ChronosEvent = {
          ...eventData,
          id: nanoid(),
          createdAt: now,
          updatedAt: now,
          lastSynced: now,
        };

        set((state) => {
          state.events.push(event);
        });

        // Persist to IndexedDB
        db.events.add(event);

        return event;
      },

      updateEvent: (id, updates) => {
        set((state) => {
          const idx = state.events.findIndex((e) => e.id === id);
          if (idx !== -1) {
            state.events[idx] = {
              ...state.events[idx],
              ...updates,
              updatedAt: new Date(),
            };
          }
        });

        const event = get().events.find((e) => e.id === id);
        if (event) {
          db.events.put(event);
        }
      },

      deleteEvent: (id) => {
        set((state) => {
          state.events = state.events.filter((e) => e.id !== id);
        });
        db.events.delete(id);
      },

      // ----------------------------------------------------------------
      // Voice Memo Attachment
      // ----------------------------------------------------------------

      attachVoiceMemo: (eventId, memo) => {
        set((state) => {
          const event = state.events.find((e) => e.id === eventId);
          if (event) {
            event.voiceMemos.push(memo);
            event.updatedAt = new Date();
          }
        });

        const event = get().events.find((e) => e.id === eventId);
        if (event) {
          db.events.put(event);
        }
      },

      removeVoiceMemo: (eventId, memoId) => {
        set((state) => {
          const event = state.events.find((e) => e.id === eventId);
          if (event) {
            event.voiceMemos = event.voiceMemos.filter((m) => m.id !== memoId);
            event.updatedAt = new Date();
          }
        });

        const event = get().events.find((e) => e.id === eventId);
        if (event) {
          db.events.put(event);
        }
      },

      // ----------------------------------------------------------------
      // Queries
      // ----------------------------------------------------------------

      getEventById: (id) => {
        return get().events.find((e) => e.id === id);
      },

      getEventsInRange: (start, end) => {
        return get().events.filter(
          (e) => e.start >= start && e.start <= end
        );
      },

      getEventsForDay: (date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        return get().getEventsInRange(dayStart, dayEnd);
      },

      // ----------------------------------------------------------------
      // Persistence
      // ----------------------------------------------------------------

      syncToDb: async () => {
        const { events } = get();
        await db.events.bulkPut(events);
      },

      loadFromDb: async () => {
        set((state) => {
          state.loading = true;
        });

        const events = await db.events.toArray();

        set((state) => {
          state.events = events;
          state.loading = false;
        });
      },
    })),
    {
      name: 'chronos-events',
      partialize: (state) => ({
        events: state.events,
      }),
    }
  )
);

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------

export const selectEvents = (state: EventsStore) => state.events;
export const selectLoading = (state: EventsStore) => state.loading;

// ----------------------------------------------------------------------------
// Helper: Create event from voice command
// ----------------------------------------------------------------------------

export function createEventFromVoice(
  title: string,
  startTime: Date,
  durationMinutes: number = 60,
  grain: EventGrain = 'shallow'
): ChronosEvent {
  const store = useEventsStore.getState();

  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  return store.createEvent({
    externalId: null,
    provider: 'local',
    calendarId: 'local',
    title,
    description: null,
    start: startTime,
    end: endTime,
    allDay: false,
    location: null,
    attendees: [],
    recurrenceRule: null,
    color: null,
    voiceMemos: [],
    goalLinks: [],
    bufferBefore: null,
    bufferAfter: null,
    grain,
    isBlocked: grain === 'sacred',
  });
}
