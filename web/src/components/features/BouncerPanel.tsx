// ============================================================================
// BouncerPanel Component
// Notification queue UI with real source integration
// ============================================================================

import { useCallback, useEffect, useState } from 'react';

import type { NotificationPriority, NotificationSource } from '../../types';
import { useBouncerStore } from '../../stores/bouncer.store';
import { NotificationTriggers } from '../../services/notification-triggers.service';

const PRIORITY_OPTIONS: NotificationPriority[] = ['critical', 'high', 'medium', 'low'];
const SOURCE_OPTIONS: NotificationSource[] = ['calendar', 'goal', 'ralph', 'bouncer', 'system'];

// Source icons and labels
const SOURCE_CONFIG: Record<NotificationSource, { icon: string; label: string; color: string }> = {
  calendar: { icon: '📅', label: 'Calendar', color: 'text-blue-500' },
  goal: { icon: '🎯', label: 'Goals', color: 'text-purple-500' },
  ralph: { icon: '🧠', label: 'Ralph AI', color: 'text-amber-500' },
  bouncer: { icon: '🚪', label: 'Bouncer', color: 'text-green-500' },
  system: { icon: '⚙️', label: 'System', color: 'text-gray-500' },
};

// Priority badges
const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; bg: string }> = {
  critical: { color: 'text-red-700', bg: 'bg-red-100' },
  high: { color: 'text-orange-700', bg: 'bg-orange-100' },
  medium: { color: 'text-yellow-700', bg: 'bg-yellow-100' },
  low: { color: 'text-gray-600', bg: 'bg-gray-100' },
};

export function BouncerPanel() {
  const {
    lobby,
    delivered,
    loading,
    addNotification,
    deliverLobbyNow,
    dismissNotification,
    clearDelivered,
    loadFromDb,
  } = useBouncerStore();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [source, setSource] = useState<NotificationSource>('system');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !body.trim()) return;
    await addNotification({
      title: title.trim(),
      body: body.trim(),
      priority,
      source,
    });
    setTitle('');
    setBody('');
  }, [addNotification, body, priority, source, title]);

  const handleRefreshSources = useCallback(() => {
    setIsRefreshing(true);
    NotificationTriggers.triggerAll();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  return (
    <div className="space-y-6">
      {/* Real notification sources status */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Notification Sources</h3>
            <p className="text-xs text-ink/60">
              Real-time notifications from your calendar, goals, and AI
            </p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded border border-border hover:bg-ink/5 disabled:opacity-50 flex items-center gap-2"
            onClick={handleRefreshSources}
            disabled={isRefreshing}
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>↻</span>
            Check now
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.entries(SOURCE_CONFIG) as [NotificationSource, typeof SOURCE_CONFIG[NotificationSource]][]).map(
            ([key, config]) => {
              const lobbyCount = lobby.notifications.filter((n) => n.source === key).length;
              const deliveredCount = delivered.filter((n) => n.source === key).length;
              return (
                <div
                  key={key}
                  className="p-3 rounded-lg bg-canvas border border-border flex items-center gap-2"
                >
                  <span className="text-lg">{config.icon}</span>
                  <div>
                    <div className="text-xs font-medium">{config.label}</div>
                    <div className="text-[10px] text-ink/50">
                      {lobbyCount > 0 && <span className="text-amber-600">{lobbyCount} held</span>}
                      {lobbyCount > 0 && deliveredCount > 0 && ' · '}
                      {deliveredCount > 0 && <span>{deliveredCount} delivered</span>}
                      {lobbyCount === 0 && deliveredCount === 0 && 'No notifications'}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Test notification */}
      <details className="rounded-lg border border-border bg-surface">
        <summary className="p-4 cursor-pointer text-sm font-semibold hover:bg-ink/5">
          🧪 Test Notification (Manual)
        </summary>
        <div className="p-4 pt-0 space-y-4 border-t border-border">
          <p className="text-xs text-ink/60">
            Simulate a notification to test how Bouncer routes it.
          </p>

          <div className="grid gap-3">
            <input
              className="w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-ink"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-ink"
              placeholder="Body"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              <label className="text-xs text-ink/60">
                Priority
                <select
                  className="ml-2 text-sm bg-canvas border border-border rounded px-2 py-1"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-ink/60">
                Source
                <select
                  className="ml-2 text-sm bg-canvas border border-border rounded px-2 py-1"
                  value={source}
                  onChange={(e) => setSource(e.target.value as NotificationSource)}
                >
                  {SOURCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {SOURCE_CONFIG[option].icon} {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className="px-4 py-2 text-sm rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={!title.trim() || !body.trim()}
            >
              Send to Bouncer
            </button>
          </div>
        </div>
      </details>

      {/* Lobby queue */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Lobby Queue</h3>
            <p className="text-xs text-ink/60">
              Held notifications waiting for delivery
            </p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded border border-border hover:bg-ink/5 disabled:opacity-50"
            onClick={deliverLobbyNow}
            disabled={lobby.notifications.length === 0}
          >
            Deliver now
          </button>
        </div>

        {loading && <div className="text-sm text-ink/50">Loading...</div>}
        {!loading && lobby.notifications.length === 0 && (
          <div className="text-sm text-ink/50">No items in the lobby.</div>
        )}

        <div className="space-y-2">
          {lobby.notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onDismiss={() => dismissNotification(notification.id)}
              tag="Held"
            />
          ))}
        </div>
      </div>

      {/* Delivered */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Delivered</h3>
            <p className="text-xs text-ink/60">
              Notifications that were delivered immediately
            </p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded border border-border hover:bg-ink/5 disabled:opacity-50"
            onClick={clearDelivered}
            disabled={delivered.length === 0}
          >
            Clear delivered
          </button>
        </div>

        {!loading && delivered.length === 0 && (
          <div className="text-sm text-ink/50">No delivered notifications.</div>
        )}

        <div className="space-y-2">
          {delivered.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onDismiss={() => dismissNotification(notification.id)}
              tag="Delivered"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface NotificationCardProps {
  notification: {
    id: string;
    title: string;
    body: string;
    source: NotificationSource;
    priority: NotificationPriority;
    createdAt: Date;
    deliveredAt: Date | null;
    heldUntil: Date | null;
    actionUrl?: string | null;
  };
  tag: string;
  onDismiss: () => void;
}

function NotificationCard({ notification, tag, onDismiss }: NotificationCardProps) {
  const sourceConfig = SOURCE_CONFIG[notification.source] ?? SOURCE_CONFIG.system;
  const priorityConfig = PRIORITY_CONFIG[notification.priority] ?? PRIORITY_CONFIG.medium;

  return (
    <div className="p-3 rounded-lg bg-canvas border border-border hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2">
          <span className="text-base flex-shrink-0">{sourceConfig.icon}</span>
          <div>
            <div className="text-sm font-medium">{notification.title}</div>
            <div className="text-xs text-ink/60 mt-1">{notification.body}</div>
          </div>
        </div>
        <button
          type="button"
          className="text-xs text-ink/40 hover:text-red-500 flex-shrink-0"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
      <div className="mt-2 text-[11px] text-ink/50 flex gap-2 flex-wrap items-center">
        <span className="uppercase tracking-wide bg-ink/5 px-1.5 py-0.5 rounded">
          {tag}
        </span>
        <span className={`px-1.5 py-0.5 rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
          {notification.priority}
        </span>
        <span className={sourceConfig.color}>{sourceConfig.label}</span>
        {notification.heldUntil && (
          <span>
            Hold until{' '}
            {new Date(notification.heldUntil).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {notification.deliveredAt && (
          <span>
            Delivered{' '}
            {new Date(notification.deliveredAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {notification.actionUrl && (
          <a
            href={notification.actionUrl}
            className="text-accent hover:underline"
          >
            View →
          </a>
        )}
      </div>
    </div>
  );
}
