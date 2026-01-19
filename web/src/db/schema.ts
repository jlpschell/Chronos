// ============================================================================
// CHRONOS DATABASE SCHEMA
// Dexie.js IndexedDB wrapper for local-first persistence
// ============================================================================

import Dexie, { type Table } from 'dexie';
import type {
  UserState,
  ChronosEvent,
  Goal,
  Interaction,
  Hypothesis,
  Pattern,
  ChronosNotification,
  CalendarConnection,
  VoiceMemo,
} from '../types';

// ----------------------------------------------------------------------------
// Database Class
// ----------------------------------------------------------------------------

export class ChronosDB extends Dexie {
  // Tables
  userState!: Table<UserState, string>;
  events!: Table<ChronosEvent, string>;
  goals!: Table<Goal, string>;
  interactions!: Table<Interaction, string>;
  hypotheses!: Table<Hypothesis, string>;
  patterns!: Table<Pattern, string>;
  notifications!: Table<ChronosNotification, string>;
  calendars!: Table<CalendarConnection, string>;
  voiceMemos!: Table<VoiceMemo, string>;
  errorLog!: Table<ErrorLogEntry, string>;

  constructor() {
    super('chronos');

    this.version(1).stores({
      // Primary key, then indexed fields
      userState: 'id',

      events: 'id, externalId, provider, calendarId, start, end, [provider+calendarId], grain',

      goals: 'id, status, deadline, lastActivity',

      interactions: 'id, timestamp, suggestionType, userResponse, hypothesisId, [suggestionType+timestamp]',

      hypotheses: 'id, status, createdAt, triggerCondition.suggestionType',

      patterns: 'id, confidence, confirmedAt, trigger.type',

      notifications: 'id, source, priority, createdAt, deliveredAt, dismissed',

      calendars: 'id, provider, email',

      voiceMemos: 'id, eventId, createdAt',

      errorLog: 'id, timestamp, phase',
    });
  }
}

// ----------------------------------------------------------------------------
// Error Log Entry (for self-annealing)
// ----------------------------------------------------------------------------

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  phase: string;
  description: string;
  stackTrace: string | null;
  rootCause: string;
  fix: string;
  prevention: string;
}

// ----------------------------------------------------------------------------
// Database Instance
// ----------------------------------------------------------------------------

export const db = new ChronosDB();

// ----------------------------------------------------------------------------
// Default User State
// ----------------------------------------------------------------------------

export const DEFAULT_USER_STATE: UserState = {
  id: 'default',
  intakeCompleted: false,
  
  // Core calibration
  velocity: null,
  geometry: null,
  constellation: null,
  
  // Extended calibration
  chronotype: null,
  bufferPreference: null,
  stressResponse: null,
  motivationStyle: null,
  
  // Derived
  bouncerMode: null,
  persona: null,
  
  // UI
  themeId: 'moonlit',
  goals: [],
  emergencyContacts: [],
  vipContacts: [],
  calendarsConnected: [],
  calibrationDate: null,
  recalibrationTriggers: 0,
  onboardingStep: 0,
  preferences: {
    preferredBuffer: 15,
    morningRoutineEnd: '08:00',
    eveningCutoff: '18:00',
    peakHours: [],
    voiceEnabled: true,
    notificationsEnabled: true,
    transparencyMode: 'quiet',
  },
  stats: {
    daysActive: 0,
    lastActiveDate: null,
  },
};

// ----------------------------------------------------------------------------
// Database Utilities
// ----------------------------------------------------------------------------

/**
 * Initialize database with default user state if empty
 */
export async function initializeDB(): Promise<void> {
  const existing = await db.userState.get('default');
  if (!existing) {
    await db.userState.add(DEFAULT_USER_STATE);
  }
}

/**
 * Get user state (creates default if not exists)
 */
export async function getUserState(): Promise<UserState> {
  let state = await db.userState.get('default');
  if (!state) {
    await db.userState.add(DEFAULT_USER_STATE);
    state = DEFAULT_USER_STATE;
  }
  return state;
}

/**
 * Update user state (partial update)
 */
export async function updateUserState(
  updates: Partial<Omit<UserState, 'id'>>
): Promise<void> {
  await db.userState.update('default', updates);
}

/**
 * Get events in date range
 */
export async function getEventsInRange(
  start: Date,
  end: Date
): Promise<ChronosEvent[]> {
  return db.events
    .where('start')
    .between(start, end, true, true)
    .toArray();
}

/**
 * Get events for a specific day
 */
export async function getEventsForDay(date: Date): Promise<ChronosEvent[]> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return getEventsInRange(dayStart, dayEnd);
}

/**
 * Upsert event (update if exists, insert if not)
 */
export async function upsertEvent(event: ChronosEvent): Promise<void> {
  await db.events.put(event);
}

/**
 * Bulk upsert events (for calendar sync)
 */
export async function bulkUpsertEvents(events: ChronosEvent[]): Promise<void> {
  await db.events.bulkPut(events);
}

/**
 * Get recent interactions for Ralph Loop
 */
export async function getRecentInteractions(
  days: number = 14
): Promise<Interaction[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return db.interactions
    .where('timestamp')
    .above(cutoff)
    .reverse()
    .toArray();
}

/**
 * Get interactions by suggestion type
 */
export async function getInteractionsBySuggestionType(
  type: string,
  days: number = 14
): Promise<Interaction[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return db.interactions
    .where('[suggestionType+timestamp]')
    .between([type, cutoff], [type, new Date()], true, true)
    .toArray();
}

/**
 * Get active hypotheses
 */
export async function getActiveHypotheses(): Promise<Hypothesis[]> {
  return db.hypotheses.where('status').equals('testing').toArray();
}

/**
 * Get confirmed patterns above confidence threshold
 */
export async function getConfirmedPatterns(
  minConfidence: number = 0.3
): Promise<Pattern[]> {
  return db.patterns
    .where('confidence')
    .above(minConfidence)
    .toArray();
}

/**
 * Log error for self-annealing
 */
export async function logError(entry: Omit<ErrorLogEntry, 'id'>): Promise<void> {
  await db.errorLog.add({
    ...entry,
    id: crypto.randomUUID(),
  });
}

/**
 * Get pending notifications (in lobby)
 */
export async function getPendingNotifications(): Promise<ChronosNotification[]> {
  return db.notifications
    .where('deliveredAt')
    .equals(null as unknown as Date)
    .filter((n) => !n.dismissed)
    .toArray();
}

/**
 * Clean up old data (call periodically)
 */
export async function cleanupOldData(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Keep only last 30 days of interactions
  await db.interactions.where('timestamp').below(thirtyDaysAgo).delete();

  // Delete dismissed notifications older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  await db.notifications
    .where('createdAt')
    .below(sevenDaysAgo)
    .filter((n) => n.dismissed)
    .delete();
}

// ----------------------------------------------------------------------------
// Sync Tracking
// ----------------------------------------------------------------------------

export interface SyncStatus {
  provider: string;
  lastSynced: Date | null;
  status: 'idle' | 'syncing' | 'error';
  error: string | null;
}

const syncStatuses = new Map<string, SyncStatus>();

export function getSyncStatus(provider: string): SyncStatus {
  return (
    syncStatuses.get(provider) ?? {
      provider,
      lastSynced: null,
      status: 'idle',
      error: null,
    }
  );
}

export function setSyncStatus(provider: string, status: Partial<SyncStatus>): void {
  const current = getSyncStatus(provider);
  syncStatuses.set(provider, { ...current, ...status });
}
