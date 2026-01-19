// ============================================================================
// CalendarConnect Component
// UI for connecting and syncing Google Calendar
// ============================================================================

import { useEffect, useState } from 'react';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { LastSyncedIndicator } from './LastSyncedIndicator';
import { useUserStore } from '../../stores/user.store';
import { isGoogleConfigured, getTokenExpiryMinutes } from '../../services/google-auth.service';

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
  
  // Check if Google is configured
  const googleConfigured = isGoogleConfigured();
  
  // Track token expiry
  const [expiryMinutes, setExpiryMinutes] = useState<number | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated) {
      setExpiryMinutes(null);
      return;
    }
    
    // Update expiry every minute
    const updateExpiry = () => setExpiryMinutes(getTokenExpiryMinutes());
    updateExpiry();
    const interval = setInterval(updateExpiry, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);
  
  const isExpiringSoon = expiryMinutes !== null && expiryMinutes <= 10;
  const isExpired = expiryMinutes !== null && expiryMinutes <= 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Calendar Sync</h2>
          <p className="text-sm text-ink/60">
            {googleConfigured 
              ? 'Connect Google Calendar to see and create events'
              : 'Calendar sync available after setup'}
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
        ) : googleConfigured ? (
          <button
            type="button"
            className="px-4 py-2 text-sm rounded bg-accent text-white hover:bg-accent/90"
            onClick={connect}
          >
            Connect Google Calendar
          </button>
        ) : (
          <span className="px-3 py-1.5 text-sm rounded bg-amber-500/20 text-amber-600">
            Setup Required
          </span>
        )}
      </div>

      {/* Connection status */}
      {isAuthenticated && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-amber-500' : 'bg-green-500'}`} />
            <span className="text-ink/70">Connected as {userEmail || 'unknown'}</span>
          </div>
          {expiryMinutes !== null && (
            <span className={`text-xs ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-ink/50'}`}>
              {isExpired ? '⚠️ Session expired' : `${expiryMinutes}m remaining`}
            </span>
          )}
        </div>
      )}
      
      {/* Token expired warning */}
      {isAuthenticated && isExpired && (
        <div className="flex items-center justify-between p-3 rounded bg-red-500/10 border border-red-500/20">
          <div className="text-sm text-red-600">
            <strong>Session expired!</strong> Google tokens last 1 hour.
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600"
            onClick={connect}
          >
            Reconnect
          </button>
        </div>
      )}
      
      {/* Token expiring soon warning */}
      {isAuthenticated && isExpiringSoon && !isExpired && (
        <div className="flex items-center justify-between p-2 rounded bg-amber-500/10 text-xs">
          <span className="text-amber-600">Session expiring soon - reconnect to continue syncing</span>
          <button
            type="button"
            className="px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600"
            onClick={connect}
          >
            Refresh
          </button>
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
      {!isAuthenticated && !googleConfigured && (
        <div className="text-xs border-t border-border pt-3 mt-3 bg-amber-500/5 -mx-4 -mb-4 p-4 rounded-b-lg">
          <p className="font-medium mb-2 text-amber-600">📅 Optional: Connect Google Calendar</p>
          <ol className="list-decimal list-inside space-y-1 text-ink/70">
            <li>Create a project at <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="text-accent underline">Google Cloud Console</a></li>
            <li>Enable "Google Calendar API"</li>
            <li>Create OAuth credentials (Web application)</li>
            <li>Add <code className="bg-ink/10 px-1 rounded">http://localhost:5173</code> to authorized origins</li>
            <li>Create <code className="bg-ink/10 px-1 rounded">web/.env</code> with your Client ID:</li>
          </ol>
          <pre className="mt-2 p-2 bg-ink/10 rounded text-xs overflow-x-auto">
VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com</pre>
          <p className="mt-2 text-ink/50">
            Full guide: <code className="bg-ink/10 px-1 rounded">docs/CALENDAR_SETUP.md</code>
          </p>
        </div>
      )}
      
      {/* Helpful tip for authenticated but not synced yet */}
      {isAuthenticated && calendars.length === 0 && !isSyncing && (
        <div className="text-xs text-ink/50 border-t border-border pt-3">
          Click "Sync Now" to fetch your calendars
        </div>
      )}
    </div>
  );
}
