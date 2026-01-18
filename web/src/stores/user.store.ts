// ============================================================================
// USER STATE STORE
// Manages user calibration, preferences, and profile
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  UserState,
  Velocity,
  Geometry,
  Constellation,
  Persona,
  BouncerMode,
  ThemeId,
  Goal,
  Contact,
  CalendarConnection,
  UserPreferences,
} from '../types';
import { db, DEFAULT_USER_STATE, updateUserState } from '../db/schema';

// ----------------------------------------------------------------------------
// Store Interface
// ----------------------------------------------------------------------------

interface UserStore extends UserState {
  // Intake actions
  setVelocity: (velocity: Velocity) => void;
  setGeometry: (geometry: Geometry) => void;
  setConstellation: (constellation: Constellation) => void;
  completeIntake: () => void;
  resetIntake: () => void;

  // Preference actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setBouncerMode: (mode: BouncerMode) => void;
  setThemeId: (themeId: ThemeId) => void;

  // Contact management
  addEmergencyContact: (contact: Contact) => void;
  removeEmergencyContact: (id: string) => void;
  addVipContact: (contact: Contact) => void;
  removeVipContact: (id: string) => void;

  // Calendar management
  addCalendarConnection: (connection: CalendarConnection) => void;
  removeCalendarConnection: (id: string) => void;
  updateCalendarConnection: (id: string, updates: Partial<CalendarConnection>) => void;

  // Goal management
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;

  // Recalibration
  triggerRecalibration: () => void;
  incrementRecalibrationTrigger: () => void;

  // Activity tracking
  incrementActiveDay: (source?: 'voice' | 'calendar') => void;

  // Persistence
  syncToDb: () => Promise<void>;
  loadFromDb: () => Promise<void>;
}

// ----------------------------------------------------------------------------
// Persona Derivation
// ----------------------------------------------------------------------------

function derivePersona(velocity: Velocity | null): Persona | null {
  if (!velocity) return null;
  return velocity === 'high_efficiency' ? 'shop_foreman' : 'supportive_peer';
}

function deriveBouncerMode(velocity: Velocity | null): BouncerMode | null {
  if (!velocity) return null;
  return velocity === 'high_efficiency' ? 'fluid' : 'strict';
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ----------------------------------------------------------------------------
// Store Implementation
// ----------------------------------------------------------------------------

export const useUserStore = create<UserStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      ...DEFAULT_USER_STATE,

      // --------------------------------------------------------------------
      // Intake Actions
      // --------------------------------------------------------------------

      setVelocity: (velocity) => {
        set((state) => {
          state.velocity = velocity;
          state.persona = derivePersona(velocity);
          state.bouncerMode = deriveBouncerMode(velocity);
          state.onboardingStep = Math.max(state.onboardingStep, 1);
        });
        get().syncToDb();
      },

      setGeometry: (geometry) => {
        set((state) => {
          state.geometry = geometry;
          state.onboardingStep = Math.max(state.onboardingStep, 2);
        });
        get().syncToDb();
      },

      setConstellation: (constellation) => {
        set((state) => {
          state.constellation = constellation;
          state.onboardingStep = Math.max(state.onboardingStep, 3);
        });
        get().syncToDb();
      },

      completeIntake: () => {
        set((state) => {
          state.intakeCompleted = true;
          state.calibrationDate = new Date();
          state.onboardingStep = 4;
        });
        get().syncToDb();
      },

      resetIntake: () => {
        set((state) => {
          state.intakeCompleted = false;
          state.velocity = null;
          state.geometry = null;
          state.constellation = null;
          state.persona = null;
          state.bouncerMode = null;
          state.calibrationDate = null;
          state.onboardingStep = 0;
        });
        get().syncToDb();
      },

      // --------------------------------------------------------------------
      // Preference Actions
      // --------------------------------------------------------------------

      updatePreferences: (prefs) => {
        set((state) => {
          state.preferences = { ...state.preferences, ...prefs };
        });
        get().syncToDb();
      },

      setBouncerMode: (mode) => {
        set((state) => {
          state.bouncerMode = mode;
        });
        get().syncToDb();
      },

      setThemeId: (themeId) => {
        set((state) => {
          state.themeId = themeId;
        });
        get().syncToDb();
      },

      // --------------------------------------------------------------------
      // Contact Management
      // --------------------------------------------------------------------

      addEmergencyContact: (contact) => {
        set((state) => {
          state.emergencyContacts.push(contact);
        });
        get().syncToDb();
      },

      removeEmergencyContact: (id) => {
        set((state) => {
          state.emergencyContacts = state.emergencyContacts.filter((c) => c.id !== id);
        });
        get().syncToDb();
      },

      addVipContact: (contact) => {
        set((state) => {
          state.vipContacts.push(contact);
        });
        get().syncToDb();
      },

      removeVipContact: (id) => {
        set((state) => {
          state.vipContacts = state.vipContacts.filter((c) => c.id !== id);
        });
        get().syncToDb();
      },

      // --------------------------------------------------------------------
      // Calendar Management
      // --------------------------------------------------------------------

      addCalendarConnection: (connection) => {
        set((state) => {
          state.calendarsConnected.push(connection);
        });
        get().syncToDb();
      },

      removeCalendarConnection: (id) => {
        set((state) => {
          state.calendarsConnected = state.calendarsConnected.filter((c) => c.id !== id);
        });
        get().syncToDb();
      },

      updateCalendarConnection: (id, updates) => {
        set((state) => {
          const idx = state.calendarsConnected.findIndex((c) => c.id === id);
          if (idx !== -1) {
            state.calendarsConnected[idx] = { ...state.calendarsConnected[idx], ...updates };
          }
        });
        get().syncToDb();
      },

      // --------------------------------------------------------------------
      // Goal Management
      // --------------------------------------------------------------------

      addGoal: (goal) => {
        set((state) => {
          state.goals.push(goal);
        });
        get().syncToDb();
      },

      updateGoal: (id, updates) => {
        set((state) => {
          const idx = state.goals.findIndex((g) => g.id === id);
          if (idx !== -1) {
            state.goals[idx] = { ...state.goals[idx], ...updates };
          }
        });
        get().syncToDb();
      },

      removeGoal: (id) => {
        set((state) => {
          state.goals = state.goals.filter((g) => g.id !== id);
        });
        get().syncToDb();
      },

      // --------------------------------------------------------------------
      // Recalibration
      // --------------------------------------------------------------------

      triggerRecalibration: () => {
        set((state) => {
          state.intakeCompleted = false;
          state.onboardingStep = 0;
          state.recalibrationTriggers = 0;
        });
        get().syncToDb();
      },

      incrementRecalibrationTrigger: () => {
        set((state) => {
          state.recalibrationTriggers += 1;
        });
        get().syncToDb();
      },

      incrementActiveDay: () => {
        set((state) => {
          const today = new Date();
          if (state.stats.lastActiveDate && isSameDay(state.stats.lastActiveDate, today)) {
            return;
          }
          state.stats.daysActive += 1;
          state.stats.lastActiveDate = today;
        });
        get().syncToDb();
      },

      // --------------------------------------------------------------------
      // Persistence
      // --------------------------------------------------------------------

      syncToDb: async () => {
        const state = get();
        await updateUserState({
          intakeCompleted: state.intakeCompleted,
          velocity: state.velocity,
          geometry: state.geometry,
          constellation: state.constellation,
          bouncerMode: state.bouncerMode,
          persona: state.persona,
          themeId: state.themeId,
          goals: state.goals,
          emergencyContacts: state.emergencyContacts,
          vipContacts: state.vipContacts,
          calendarsConnected: state.calendarsConnected,
          calibrationDate: state.calibrationDate,
          recalibrationTriggers: state.recalibrationTriggers,
          onboardingStep: state.onboardingStep,
          preferences: state.preferences,
          stats: state.stats,
        });
      },

      loadFromDb: async () => {
        const dbState = await db.userState.get('default');
        if (dbState) {
          set({
            ...DEFAULT_USER_STATE,
            ...dbState,
            preferences: {
              ...DEFAULT_USER_STATE.preferences,
              ...dbState.preferences,
            },
            stats: {
              ...DEFAULT_USER_STATE.stats,
              ...dbState.stats,
            },
          });
        }
      },
    })),
    {
      name: 'chronos-user',
      // Only persist essential fields (db handles full persistence)
      partialize: (state) => ({
        id: state.id,
        intakeCompleted: state.intakeCompleted,
        velocity: state.velocity,
        geometry: state.geometry,
        constellation: state.constellation,
        persona: state.persona,
        bouncerMode: state.bouncerMode,
        onboardingStep: state.onboardingStep,
        themeId: state.themeId,
        stats: state.stats,
      }),
    }
  )
);

// ----------------------------------------------------------------------------
// Selectors (for performance optimization)
// ----------------------------------------------------------------------------

export const selectPersona = (state: UserStore) => state.persona;
export const selectVelocity = (state: UserStore) => state.velocity;
export const selectIsIntakeComplete = (state: UserStore) => state.intakeCompleted;
export const selectGoals = (state: UserStore) => state.goals;
export const selectActiveGoals = (state: UserStore) =>
  state.goals.filter((g) => g.status === 'active' || g.status === 'drifting');
export const selectCalendars = (state: UserStore) => state.calendarsConnected;
export const selectEmergencyContacts = (state: UserStore) => state.emergencyContacts;
export const selectVipContacts = (state: UserStore) => state.vipContacts;
