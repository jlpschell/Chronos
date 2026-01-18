// ============================================================================
// useGoogleCalendar Hook
// React integration for Google Calendar auth and sync
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  getAuthState,
  subscribeToAuth,
  initiateGoogleAuth,
  handleOAuthCallback,
  loadStoredAuth,
  signOut,
  type GoogleAuthState,
} from '../services/google-auth.service';
import {
  listCalendars,
  syncCalendar,
  syncAllCalendars,
  type GoogleCalendar,
  type SyncResult,
} from '../services/google-calendar.service';

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

export function useGoogleCalendar() {
  const [authState, setAuthState] = useState<GoogleAuthState>(getAuthState);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to auth changes
  useEffect(() => {
    return subscribeToAuth(setAuthState);
  }, []);

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Handle OAuth callback if we're on the callback page
  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      handleOAuthCallback().then((success) => {
        if (success) {
          // Redirect to main page after successful auth
          window.location.href = '/';
        }
      });
    }
  }, []);

  // Fetch calendars when authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      listCalendars()
        .then(setCalendars)
        .catch((err) => setError(String(err)));
    } else {
      setCalendars([]);
    }
  }, [authState.isAuthenticated]);

  // Connect to Google
  const connect = useCallback(() => {
    setError(null);
    try {
      initiateGoogleAuth();
    } catch (err) {
      setError(String(err));
    }
  }, []);

  // Disconnect from Google
  const disconnect = useCallback(() => {
    signOut();
    setCalendars([]);
    setLastSyncResult(null);
  }, []);

  // Sync a specific calendar
  const sync = useCallback(async (calendarId: string) => {
    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncCalendar(calendarId);
      setLastSyncResult(result);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMsg = String(err);
      setError(errorMsg);
      return {
        success: false,
        eventsAdded: 0,
        eventsUpdated: 0,
        error: errorMsg,
      };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sync all calendars
  const syncAll = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const results = await syncAllCalendars();
      const combined: SyncResult = {
        success: results.every((r) => r.success),
        eventsAdded: results.reduce((sum, r) => sum + r.eventsAdded, 0),
        eventsUpdated: results.reduce((sum, r) => sum + r.eventsUpdated, 0),
      };
      setLastSyncResult(combined);

      const errors = results.filter((r) => r.error).map((r) => r.error);
      if (errors.length > 0) {
        setError(errors.join('; '));
      }

      return combined;
    } catch (err) {
      const errorMsg = String(err);
      setError(errorMsg);
      return {
        success: false,
        eventsAdded: 0,
        eventsUpdated: 0,
        error: errorMsg,
      };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    // Auth state
    isAuthenticated: authState.isAuthenticated,
    userEmail: authState.userEmail,
    authError: authState.error,

    // Calendar data
    calendars,

    // Sync state
    isSyncing,
    lastSyncResult,
    error,

    // Actions
    connect,
    disconnect,
    sync,
    syncAll,
  };
}
