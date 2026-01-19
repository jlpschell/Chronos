// ============================================================================
// CalendarConnect Component
// UI for connecting and syncing Google Calendar
// ============================================================================

import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { LastSyncedIndicator } from './LastSyncedIndicator';
import { useUserStore } from '../../stores/user.store';

export function CalendarConnect() {
  const {
    isAuthenticated,
    userEmail,
    authError,
    calendars,
    isSyncing,
    lastSyncResult,
    error,
    connect,
    disconnect,
    syncAll,
  } = useGoogleCalendar();

  // Get calendar connections for last sync times
  const calendarConnections = useUserStore((s) => s.calendarsConnected);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Calendar Sync</h2>
          <p className="text-sm text-ink/60">
            Connect Google Calendar to see and create events
          </p>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
              onClick={syncAll}
              disabled={isSyncing}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded border border-border hover:bg-ink/5"
              onClick={disconnect}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="px-4 py-2 text-sm rounded bg-accent text-white hover:bg-accent/90"
            onClick={connect}
          >
            Connect Google Calendar
          </button>
        )}
      </div>

      {/* Connection status */}
      {isAuthenticated && (
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-ink/70">Connected as {userEmail || 'unknown'}</span>
        </div>
      )}

      {/* Calendars list */}
      {isAuthenticated && calendars.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Your Calendars</div>
          <div className="space-y-1">
            {calendars.map((cal) => (
              <div
                key={cal.id}
                className="flex items-center gap-2 text-sm p-2 rounded bg-canvas"
              >
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: cal.backgroundColor || '#4285f4' }}
                />
                <span className="text-ink/80">{cal.summary}</span>
                {cal.primary && (
                  <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last sync status */}
      {isAuthenticated && calendarConnections.length > 0 && (
        <div className="flex items-center justify-between text-sm border-t border-border pt-3">
          <LastSyncedIndicator
            provider="Google Calendar"
            lastSynced={calendarConnections[0]?.lastSynced}
            onRefresh={syncAll}
            isRefreshing={isSyncing}
          />
          {lastSyncResult && (
            <span className="text-xs text-ink/50">
              {lastSyncResult.success ? '✓' : '✗'} {lastSyncResult.eventsAdded} added,{' '}
              {lastSyncResult.eventsUpdated} updated
            </span>
          )}
        </div>
      )}

      {/* Errors */}
      {(error || authError) && (
        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
          {error || authError}
        </div>
      )}

      {/* Setup instructions if not configured */}
      {!isAuthenticated && (
        <div className="text-xs text-ink/50 border-t border-border pt-3 mt-3">
          <p className="font-medium mb-1">First time setup?</p>
          <p>
            You need a Google Cloud project with Calendar API enabled.
            Set <code className="bg-ink/10 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> in your .env file.
          </p>
        </div>
      )}
    </div>
  );
}
