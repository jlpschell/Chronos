// ============================================================================
// GOOGLE CALENDAR SERVICE
// Fetch and sync calendar events from Google Calendar API
// ============================================================================

import { CALENDAR_CONFIG } from '../lib/config';
import { getAccessToken } from './google-auth.service';
import { useEventsStore } from '../stores/events.store';
import { NotificationTriggers } from './notification-triggers.service';
import type { ChronosEvent, EventGrain, Attendee } from '../types';
import { nanoid } from 'nanoid';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
    organizer?: boolean;
  }>;
  recurrence?: string[];
  colorId?: string;
  status?: string;
}

interface GoogleEventsResponse {
  items: GoogleEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

// Store sync tokens per calendar
const syncTokens = new Map<string, string>();

// ----------------------------------------------------------------------------
// API Helpers
// ----------------------------------------------------------------------------

async function calendarFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google');
  }

  const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Google authentication expired. Please sign in again.');
    }
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Calendar API error: ${response.status}`);
  }

  return response.json();
}

// ----------------------------------------------------------------------------
// Calendar List
// ----------------------------------------------------------------------------

export async function listCalendars(): Promise<GoogleCalendar[]> {
  const response = await calendarFetch<{ items: GoogleCalendar[] }>('/users/me/calendarList');
  return response.items || [];
}

export async function getPrimaryCalendar(): Promise<GoogleCalendar | null> {
  const calendars = await listCalendars();
  return calendars.find((cal) => cal.primary) || calendars[0] || null;
}

// ----------------------------------------------------------------------------
// Event Fetching
// ----------------------------------------------------------------------------

export async function fetchEvents(
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
  useSync = false
): Promise<ChronosEvent[]> {
  const events: ChronosEvent[] = [];
  let pageToken: string | undefined;

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  // Use sync token if available and requested
  const syncToken = useSync ? syncTokens.get(calendarId) : undefined;
  if (syncToken) {
    params.set('syncToken', syncToken);
    params.delete('timeMin');
    params.delete('timeMax');
  }

  do {
    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    try {
      const response = await calendarFetch<GoogleEventsResponse>(
        `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
      );

      for (const item of response.items) {
        if (item.status === 'cancelled') continue;
        
        const event = googleEventToChronos(item, calendarId);
        if (event) {
          events.push(event);
        }
      }

      pageToken = response.nextPageToken;

      // Store sync token for incremental sync
      if (response.nextSyncToken) {
        syncTokens.set(calendarId, response.nextSyncToken);
      }
    } catch (error) {
      // If sync token is invalid, clear it and retry without
      if (syncToken && String(error).includes('410')) {
        syncTokens.delete(calendarId);
        return fetchEvents(calendarId, timeMin, timeMax, false);
      }
      throw error;
    }
  } while (pageToken);

  return events;
}

// ----------------------------------------------------------------------------
// Event Conversion
// ----------------------------------------------------------------------------

function googleEventToChronos(
  googleEvent: GoogleEvent,
  calendarId: string
): ChronosEvent | null {
  const start = googleEvent.start.dateTime
    ? new Date(googleEvent.start.dateTime)
    : googleEvent.start.date
    ? new Date(googleEvent.start.date)
    : null;

  const end = googleEvent.end.dateTime
    ? new Date(googleEvent.end.dateTime)
    : googleEvent.end.date
    ? new Date(googleEvent.end.date)
    : null;

  if (!start || !end) return null;

  const title = googleEvent.summary || '(No title)';
  const grain = inferGrain(title, googleEvent.description);

  const attendees: Attendee[] = (googleEvent.attendees || []).map((a) => ({
    email: a.email,
    name: a.displayName || null,
    responseStatus: (a.responseStatus as Attendee['responseStatus']) || 'needsAction',
    isOrganizer: a.organizer || false,
  }));

  return {
    id: nanoid(),
    externalId: googleEvent.id,
    provider: 'google',
    calendarId,
    title,
    description: googleEvent.description || null,
    start,
    end,
    allDay: !googleEvent.start.dateTime,
    location: googleEvent.location || null,
    attendees,
    recurrenceRule: googleEvent.recurrence?.[0] || null,
    color: googleEvent.colorId || null,
    voiceMemos: [],
    goalLinks: [],
    bufferBefore: null,
    bufferAfter: null,
    grain,
    isBlocked: grain === 'sacred',
    lastSynced: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function inferGrain(title: string, description?: string): EventGrain {
  const text = `${title} ${description || ''}`.toLowerCase();

  for (const keyword of CALENDAR_CONFIG.sacredKeywords) {
    if (text.includes(keyword)) return 'sacred';
  }

  for (const keyword of CALENDAR_CONFIG.deepWorkKeywords) {
    if (text.includes(keyword)) return 'sacred';
  }

  return CALENDAR_CONFIG.defaultGrain;
}

// ----------------------------------------------------------------------------
// Sync Pipeline
// ----------------------------------------------------------------------------

export interface SyncResult {
  success: boolean;
  eventsAdded: number;
  eventsUpdated: number;
  error?: string;
}

export async function syncCalendar(calendarId: string): Promise<SyncResult> {
  const eventsStore = useEventsStore.getState();

  try {
    // Determine date range
    const now = new Date();
    const timeMin = new Date(now);
    timeMin.setDate(timeMin.getDate() - CALENDAR_CONFIG.initialFetchPastDays);
    const timeMax = new Date(now);
    timeMax.setDate(timeMax.getDate() + CALENDAR_CONFIG.initialFetchFutureDays);

    // Fetch events
    const googleEvents = await fetchEvents(calendarId, timeMin, timeMax, true);

    let added = 0;
    let updated = 0;

    for (const event of googleEvents) {
      // Check if event already exists by externalId
      const existing = eventsStore.events.find(
        (e) => e.externalId === event.externalId && e.provider === 'google'
      );

      if (existing) {
        // Update existing event
        eventsStore.updateEvent(existing.id, {
          title: event.title,
          description: event.description,
          start: event.start,
          end: event.end,
          location: event.location,
          attendees: event.attendees,
          lastSynced: new Date(),
        });
        updated++;
      } else {
        // Add new event
        eventsStore.createEvent({
          ...event,
          id: undefined as unknown as string, // Will be generated by store
        });
        added++;
      }
    }

    return {
      success: true,
      eventsAdded: added,
      eventsUpdated: updated,
    };
  } catch (error) {
    return {
      success: false,
      eventsAdded: 0,
      eventsUpdated: 0,
      error: String(error),
    };
  }
}

export async function syncAllCalendars(): Promise<SyncResult[]> {
  const calendars = await listCalendars();
  const results: SyncResult[] = [];

  for (const calendar of calendars) {
    const result = await syncCalendar(calendar.id);
    results.push(result);

    // Notify on successful sync with changes
    if (result.success && (result.eventsAdded > 0 || result.eventsUpdated > 0)) {
      const totalChanges = result.eventsAdded + result.eventsUpdated;
      NotificationTriggers.notifySyncComplete(calendar.summary, totalChanges);
    }
  }

  // After sync, trigger a check for conflicts and reminders
  NotificationTriggers.checkConflicts();
  NotificationTriggers.checkEvents();

  return results;
}
