// ============================================================================
// LastSyncedIndicator Component
// Displays last sync time for offline-first credibility
// ============================================================================

import { useEffect, useState } from 'react';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface LastSyncedIndicatorProps {
  lastSynced: Date | null | undefined;
  provider?: string;
  showLabel?: boolean;
  compact?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  }
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }
  if (diffDay === 1) {
    return 'yesterday';
  }
  if (diffDay < 7) {
    return `${diffDay}d ago`;
  }
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getSyncStatusColor(lastSynced: Date | null | undefined): string {
  if (!lastSynced) return 'text-gray-400';

  const now = new Date();
  const diffMs = now.getTime() - new Date(lastSynced).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));

  if (diffMin < 5) return 'text-green-500';
  if (diffMin < 30) return 'text-green-600';
  if (diffMin < 60) return 'text-amber-500';
  return 'text-red-500';
}

function getSyncDotColor(lastSynced: Date | null | undefined): string {
  if (!lastSynced) return 'bg-gray-400';

  const now = new Date();
  const diffMs = now.getTime() - new Date(lastSynced).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));

  if (diffMin < 5) return 'bg-green-500';
  if (diffMin < 30) return 'bg-green-600';
  if (diffMin < 60) return 'bg-amber-500';
  return 'bg-red-500';
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function LastSyncedIndicator({
  lastSynced,
  provider,
  showLabel = true,
  compact = false,
  onRefresh,
  isRefreshing = false,
}: LastSyncedIndicatorProps) {
  const [, setTick] = useState(0);

  // Update relative time every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const syncDate = lastSynced ? new Date(lastSynced) : null;
  const relativeTime = syncDate ? formatRelativeTime(syncDate) : 'Never';
  const statusColor = getSyncStatusColor(lastSynced);
  const dotColor = getSyncDotColor(lastSynced);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={syncDate?.toLocaleString() ?? 'Never synced'}>
        <span className={`w-2 h-2 rounded-full ${dotColor} ${isRefreshing ? 'animate-pulse' : ''}`} />
        <span className={`text-[10px] ${statusColor}`}>{relativeTime}</span>
        {onRefresh && (
          <button
            type="button"
            className="text-[10px] text-ink/40 hover:text-accent ml-1"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            ↻
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dotColor} ${isRefreshing ? 'animate-pulse' : ''}`} />
      <div className="text-xs">
        {showLabel && (
          <span className="text-ink/50">
            {provider ? `${provider} synced ` : 'Last synced '}
          </span>
        )}
        <span className={statusColor} title={syncDate?.toLocaleString()}>
          {relativeTime}
        </span>
      </div>
      {onRefresh && (
        <button
          type="button"
          className={`text-xs px-2 py-0.5 rounded hover:bg-ink/5 transition-colors ${
            isRefreshing ? 'opacity-50' : ''
          }`}
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <span className="animate-spin inline-block">↻</span>
          ) : (
            'Sync'
          )}
        </button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Composite Sync Status Component (for multiple providers)
// ----------------------------------------------------------------------------

interface SyncStatusBarProps {
  syncs: Array<{
    provider: string;
    lastSynced: Date | null;
    onRefresh?: () => void;
    isRefreshing?: boolean;
  }>;
}

export function SyncStatusBar({ syncs }: SyncStatusBarProps) {
  if (syncs.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink/50">
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        <span>No syncs configured</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {syncs.map((sync) => (
        <LastSyncedIndicator
          key={sync.provider}
          provider={sync.provider}
          lastSynced={sync.lastSynced}
          onRefresh={sync.onRefresh}
          isRefreshing={sync.isRefreshing}
          showLabel
        />
      ))}
    </div>
  );
}
