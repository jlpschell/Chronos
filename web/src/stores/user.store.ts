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
  Chronotype,
  BufferPreference,
  StressResponse,
  MotivationStyle,
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
  // Intake actions (core)
  setVelocity: (velocity: Velocity) => void;
  setGeometry: (geometry: Geometry) => void;
  setConstellation: (constellation: Constellation) => void;
  
  // Intake actions (extended)
  setChronotype: (chronotype: Chronotype) => void;
  setBufferPreference: (bufferPreference: BufferPreference) => void;
  setStressResponse: (stressResponse: StressResponse) => void;
  setMotivationStyle: (motivationStyle: MotivationStyle) => void;
  
  completeIntake: () => void;
  resetIntake: () => void;

  // Preference actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setBouncerMode: (mode: BouncerMode) => void;
  setThemeId: (themeId: ThemeId) => void;
  setPersona: (persona: Persona) => void;

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

function derivePersona(
  velocity: Velocity | null,
  stressResponse: StressResponse | null
): Persona | null {
  if (!velocity) return null;
  
  // Primary: velocity determines base persona
  // Secondary: stress response can modify it
  if (velocity === 'high_efficiency') {
    // Efficiency-focused people who want space when stressed might prefer supportive
    return stressResponse === 'more_space' ? 'supportive_peer' : 'shop_foreman';
  } else {
    // Sustainable pace people who want structure when stressed might prefer foreman
    return stressResponse === 'more_structure' ? 'shop_foreman' : 'supportive_peer';
  }
}

function deriveBouncerMode(
  velocity: Velocity | null,
  bufferPreference: BufferPreference | null
): BouncerMode | null {
  if (!velocity) return null;
  
  // Buffer preference can override velocity-based default
  if (bufferPreference === 'packed') return 'fluid';
  if (bufferPreference === 'generous_gaps') return 'strict';
  
  // Fall back to velocity-based default
  return velocity === 'high_efficiency' ? 'fluid' : 'strict';
}

function derivePreferredBuffer(bufferPreference: BufferPreference | null): number {
  switch (bufferPreference) {
    case 'packed': return 5;
    case 'breathing_room': return 15;
    case 'generous_gaps': return 30;
    default: return 15;
  }
}

function derivePeakHours(chronotype: Chronotype | null): string[] {
  switch (chronotype) {
    case 'early_bird': return ['06:00-10:00', '14:00-16:00'];
    case 'night_owl': return ['10:00-12:00', '20:00-23:00'];
    case 'flexible': return ['09:00-12:00', '14:00-17:00'];
    default: return [];
  }
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

      setChronotype: (chronotype) => {
        set((state) => {
          state.chronotype = chronotype;
          state.preferences.peakHours = derivePeakHours(chronotype);
          state.onboardingStep = Math.max(state.onboardingStep, 4);
        });
        get().syncToDb();
      },

      setBufferPreference: (bufferPreference) => {
        set((state) => {
          state.bufferPreference = bufferPreference;
          state.preferences.preferredBuffer = derivePreferredBuffer(bufferPreference);
          state.bouncerMode = deriveBouncerMode(state.velocity, bufferPreference);
          state.onboardingStep = Math.max(state.onboardingStep, 5);
        });
        get().syncToDb();
      },

      setStressResponse: (stressResponse) => {
        set((state) => {
          state.stressResponse = stressResponse;
          state.persona = derivePersona(state.velocity, stressResponse);
          state.onboardingStep = Math.max(state.onboardingStep, 6);
        });
        get().syncToDb();
      },

      setMotivationStyle: (motivationStyle) => {
        set((state) => {
          state.motivationStyle = motivationStyle;
          state.onboardingStep = Math.max(state.onboardingStep, 7);
        });
        get().syncToDb();
      },

      completeIntake: () => {
        set((state) => {
          // Final derivations with all data
          state.persona = derivePersona(state.velocity, state.stressResponse);
          state.bouncerMode = deriveBouncerMode(state.velocity, state.bufferPreference);
          state.intakeCompleted = true;
          state.calibrationDate = new Date();
          state.onboardingStep = 8;
        });
        get().syncToDb();
      },

      resetIntake: () => {
        set((state) => {
          state.intakeCompleted = false;
          state.velocity = null;
          state.geometry = null;
          state.constellation = null;
          state.chronotype = null;
          state.bufferPreference = null;
          state.stressResponse = null;
          state.motivationStyle = null;
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

      setPersona: (persona) => {
        set((state) => {
          state.persona = persona;
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
          chronotype: state.chronotype,
          bufferPreference: state.bufferPreference,
          stressResponse: state.stressResponse,
          motivationStyle: state.motivationStyle,
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
        chronotype: state.chronotype,
        bufferPreference: state.bufferPreference,
        stressResponse: state.stressResponse,
        motivationStyle: state.motivationStyle,
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
