// ============================================================================
// NOTIFICATION TRIGGERS SERVICE
// Wires real notification sources into the Bouncer system
// ============================================================================

import { useEventsStore } from '../stores/events.store';
import { useUserStore } from '../stores/user.store';
import { useBouncerStore } from '../stores/bouncer.store';
import { useRalphStore } from '../stores/ralph.store';
import { GOAL_CONFIG } from '../lib/config';
import type { ChronosEvent, Goal, NotificationPriority } from '../types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface NotificationTriggerConfig {
  eventReminderMinutes: number[];   // Minutes before event to remind
  goalCheckIntervalMs: number;       // How often to check goal drift
  ralphBridgeIntervalMs: number;     // How often to bridge Ralph notifications
  conflictCheckIntervalMs: number;   // How often to check for conflicts
}

const DEFAULT_CONFIG: NotificationTriggerConfig = {
  eventReminderMinutes: [15, 5],     // Remind 15 min and 5 min before
  goalCheckIntervalMs: 60 * 60 * 1000, // Check goals every hour
  ralphBridgeIntervalMs: 30 * 1000,    // Bridge Ralph notifications every 30s
  conflictCheckIntervalMs: 5 * 60 * 1000, // Check conflicts every 5 min
};

// Track sent notifications to avoid duplicates
const sentNotifications = new Set<string>();

// Interval handles for cleanup
let eventReminderInterval: ReturnType<typeof setInterval> | null = null;
let goalCheckInterval: ReturnType<typeof setInterval> | null = null;
let ralphBridgeInterval: ReturnType<typeof setInterval> | null = null;
let conflictCheckInterval: ReturnType<typeof setInterval> | null = null;

// ----------------------------------------------------------------------------
// Calendar Event Notifications
// ----------------------------------------------------------------------------

/**
 * Check for upcoming events and create reminders
 */
export function checkUpcomingEventReminders(reminderMinutes: number[] = DEFAULT_CONFIG.eventReminderMinutes): void {
  const events = useEventsStore.getState().events;
  const addNotification = useBouncerStore.getState().addNotification;
  const now = new Date();

  for (const event of events) {
    if (event.allDay) continue; // Skip all-day events

    const eventStart = new Date(event.start);
    const minutesUntil = (eventStart.getTime() - now.getTime()) / (1000 * 60);

    for (const reminderMin of reminderMinutes) {
      // Check if we're within the reminder window (±1 minute tolerance)
      if (minutesUntil > reminderMin - 1 && minutesUntil <= reminderMin + 1) {
        const notificationKey = `event-reminder-${event.id}-${reminderMin}`;
        
        if (!sentNotifications.has(notificationKey)) {
          sentNotifications.add(notificationKey);
          
          const priority: NotificationPriority = 
            event.grain === 'sacred' ? 'high' :
            reminderMin <= 5 ? 'high' : 'medium';

          addNotification({
            source: 'calendar',
            title: `${event.title} in ${reminderMin} min`,
            body: event.location 
              ? `Starting soon at ${event.location}`
              : 'Starting soon',
            priority,
            actionUrl: `/timeline?event=${event.id}`,
          });
        }
      }
    }
  }

  // Clean up old notification keys (older than 1 hour)
  cleanupSentNotifications('event-reminder');
}

/**
 * Check for calendar conflicts
 */
export function checkCalendarConflicts(): void {
  const events = useEventsStore.getState().events;
  const addNotification = useBouncerStore.getState().addNotification;
  const now = new Date();

  // Only check events in the next 24 hours
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcomingEvents = events.filter(
    (e) => new Date(e.start) >= now && new Date(e.start) <= next24h && !e.allDay
  );

  // Find overlapping events
  for (let i = 0; i < upcomingEvents.length; i++) {
    for (let j = i + 1; j < upcomingEvents.length; j++) {
      const eventA = upcomingEvents[i];
      const eventB = upcomingEvents[j];

      if (eventsOverlap(eventA, eventB)) {
        const notificationKey = `conflict-${[eventA.id, eventB.id].sort().join('-')}`;
        
        if (!sentNotifications.has(notificationKey)) {
          sentNotifications.add(notificationKey);

          addNotification({
            source: 'calendar',
            title: 'Schedule Conflict',
            body: `"${eventA.title}" overlaps with "${eventB.title}"`,
            priority: 'high',
            actionUrl: '/timeline',
          });
        }
      }
    }
  }
}

function eventsOverlap(a: ChronosEvent, b: ChronosEvent): boolean {
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();

  return aStart < bEnd && bStart < aEnd;
}

// ----------------------------------------------------------------------------
// Goal Notifications
// ----------------------------------------------------------------------------

/**
 * Check goals for drift and deadline warnings
 */
export function checkGoalNotifications(): void {
  const goals = useUserStore.getState().goals;
  const addNotification = useBouncerStore.getState().addNotification;
  const updateGoal = useUserStore.getState().updateGoal;
  const now = new Date();

  for (const goal of goals) {
    if (goal.status !== 'active' && goal.status !== 'drifting') continue;

    // Check for drift (no activity in X days)
    checkGoalDrift(goal, now, addNotification, updateGoal);

    // Check for deadline warnings
    checkGoalDeadline(goal, now, addNotification);
  }
}

function checkGoalDrift(
  goal: Goal,
  now: Date,
  addNotification: ReturnType<typeof useBouncerStore.getState>['addNotification'],
  updateGoal: ReturnType<typeof useUserStore.getState>['updateGoal']
): void {
  if (!goal.lastActivity) return;

  const daysSinceActivity = Math.floor(
    (now.getTime() - new Date(goal.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Mark as drifting if past threshold
  if (daysSinceActivity >= GOAL_CONFIG.driftThresholdDays && goal.status === 'active') {
    updateGoal(goal.id, { status: 'drifting' });

    const notificationKey = `goal-drift-${goal.id}`;
    if (!sentNotifications.has(notificationKey)) {
      sentNotifications.add(notificationKey);

      addNotification({
        source: 'goal',
        title: 'Goal needs attention',
        body: `"${goal.text}" hasn't had activity in ${daysSinceActivity} days`,
        priority: 'medium',
        actionUrl: '/settings',
      });
    }
  }

  // Send nudge if drifting and past nudge interval
  if (goal.status === 'drifting') {
    const daysSinceLastNudge = goal.nudgesSent > 0 
      ? Math.floor((now.getTime() - new Date(goal.lastActivity ?? goal.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : GOAL_CONFIG.nudgeIntervalDays;

    if (daysSinceLastNudge >= GOAL_CONFIG.nudgeIntervalDays && goal.nudgesSent < GOAL_CONFIG.maxNudgesBeforeEscalate) {
      const notificationKey = `goal-nudge-${goal.id}-${goal.nudgesSent}`;
      if (!sentNotifications.has(notificationKey)) {
        sentNotifications.add(notificationKey);

        addNotification({
          source: 'goal',
          title: 'Gentle nudge',
          body: `Time to make progress on "${goal.text}"?`,
          priority: 'low',
          actionUrl: '/settings',
        });

        updateGoal(goal.id, { nudgesSent: goal.nudgesSent + 1 });
      }
    }
  }
}

function checkGoalDeadline(
  goal: Goal,
  now: Date,
  addNotification: ReturnType<typeof useBouncerStore.getState>['addNotification']
): void {
  if (!goal.deadline) return;

  const deadline = new Date(goal.deadline);
  const daysUntilDeadline = Math.floor(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Check each warning threshold
  for (const warningDays of GOAL_CONFIG.deadlineWarningDays) {
    if (daysUntilDeadline === warningDays || (daysUntilDeadline <= warningDays && daysUntilDeadline > warningDays - 1)) {
      const notificationKey = `goal-deadline-${goal.id}-${warningDays}`;
      
      if (!sentNotifications.has(notificationKey)) {
        sentNotifications.add(notificationKey);

        const priority: NotificationPriority = 
          warningDays <= 1 ? 'critical' :
          warningDays <= 7 ? 'high' : 'medium';

        const progress = goal.targetValue 
          ? Math.round((goal.currentValue / goal.targetValue) * 100)
          : null;

        addNotification({
          source: 'goal',
          title: `${warningDays} day${warningDays === 1 ? '' : 's'} until deadline`,
          body: progress !== null
            ? `"${goal.text}" is at ${progress}%`
            : `"${goal.text}" deadline approaching`,
          priority,
          actionUrl: '/settings',
        });
      }
    }
  }
}

// ----------------------------------------------------------------------------
// Ralph Loop Bridge
// ----------------------------------------------------------------------------

/**
 * Bridge Ralph's internal notifications to the Bouncer system
 */
export function bridgeRalphNotifications(): void {
  const ralphNotifications = useRalphStore.getState().pendingNotifications;
  const dismissRalphNotification = useRalphStore.getState().dismissNotification;
  const addNotification = useBouncerStore.getState().addNotification;

  for (const notification of ralphNotifications) {
    if (notification.dismissed) continue;

    const notificationKey = `ralph-${notification.id}`;
    if (!sentNotifications.has(notificationKey)) {
      sentNotifications.add(notificationKey);

      const priority: NotificationPriority = 
        notification.type === 'decay_warning' ? 'medium' :
        notification.type === 'auto_action' ? 'low' : 'low';

      addNotification({
        source: 'ralph',
        title: notification.type === 'learned' ? '🧠 New Pattern Learned' :
               notification.type === 'auto_action' ? '⚡ Auto-action taken' :
               '⚠️ Pattern Review',
        body: notification.message,
        priority,
        actionUrl: '/ralph',
      });

      // Mark as bridged (dismiss from Ralph's internal queue)
      dismissRalphNotification(notification.id);
    }
  }
}

// ----------------------------------------------------------------------------
// System Notifications
// ----------------------------------------------------------------------------

/**
 * Create a system notification for calendar sync status
 */
export function notifyCalendarSyncComplete(calendarName: string, eventCount: number): void {
  const addNotification = useBouncerStore.getState().addNotification;
  const notificationKey = `sync-${calendarName}-${Date.now()}`;

  if (!sentNotifications.has(notificationKey)) {
    sentNotifications.add(notificationKey);

    addNotification({
      source: 'system',
      title: 'Calendar synced',
      body: `${calendarName}: ${eventCount} event${eventCount === 1 ? '' : 's'} updated`,
      priority: 'low',
      actionUrl: '/calendar',
    });
  }
}

/**
 * Create a system notification for errors
 */
export function notifySystemError(title: string, message: string): void {
  const addNotification = useBouncerStore.getState().addNotification;

  addNotification({
    source: 'system',
    title,
    body: message,
    priority: 'high',
    actionUrl: null,
  });
}

// ----------------------------------------------------------------------------
// Lifecycle Management
// ----------------------------------------------------------------------------

/**
 * Initialize all notification triggers
 */
export function initializeNotificationTriggers(config: Partial<NotificationTriggerConfig> = {}): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Clean up any existing intervals
  stopNotificationTriggers();

  // Start event reminder checks (every minute)
  eventReminderInterval = setInterval(
    () => checkUpcomingEventReminders(finalConfig.eventReminderMinutes),
    60 * 1000 // Check every minute for precise timing
  );

  // Start conflict checks
  conflictCheckInterval = setInterval(
    checkCalendarConflicts,
    finalConfig.conflictCheckIntervalMs
  );

  // Start goal checks
  goalCheckInterval = setInterval(
    checkGoalNotifications,
    finalConfig.goalCheckIntervalMs
  );

  // Start Ralph bridge
  ralphBridgeInterval = setInterval(
    bridgeRalphNotifications,
    finalConfig.ralphBridgeIntervalMs
  );

  // Run initial checks
  checkUpcomingEventReminders(finalConfig.eventReminderMinutes);
  checkCalendarConflicts();
  checkGoalNotifications();
  bridgeRalphNotifications();

  console.log('[NotificationTriggers] Initialized with config:', finalConfig);
}

/**
 * Stop all notification triggers
 */
export function stopNotificationTriggers(): void {
  if (eventReminderInterval) {
    clearInterval(eventReminderInterval);
    eventReminderInterval = null;
  }
  if (conflictCheckInterval) {
    clearInterval(conflictCheckInterval);
    conflictCheckInterval = null;
  }
  if (goalCheckInterval) {
    clearInterval(goalCheckInterval);
    goalCheckInterval = null;
  }
  if (ralphBridgeInterval) {
    clearInterval(ralphBridgeInterval);
    ralphBridgeInterval = null;
  }

  console.log('[NotificationTriggers] Stopped');
}

/**
 * Clean up old sent notification keys to prevent memory bloat
 */
function cleanupSentNotifications(prefix: string): void {
  // Simple cleanup - remove entries with the given prefix that are old
  // In production, you'd want timestamp tracking
  const keysToCheck = Array.from(sentNotifications);
  const maxKeys = 1000;

  if (keysToCheck.length > maxKeys) {
    // Remove oldest keys with the prefix
    const prefixKeys = keysToCheck.filter((k) => k.startsWith(prefix));
    const toRemove = prefixKeys.slice(0, prefixKeys.length - maxKeys / 2);
    toRemove.forEach((k) => sentNotifications.delete(k));
  }
}

/**
 * Manually trigger a check for all notification sources
 */
export function triggerAllNotificationChecks(): void {
  checkUpcomingEventReminders();
  checkCalendarConflicts();
  checkGoalNotifications();
  bridgeRalphNotifications();
}

// ----------------------------------------------------------------------------
// Exports
// ----------------------------------------------------------------------------

export const NotificationTriggers = {
  initialize: initializeNotificationTriggers,
  stop: stopNotificationTriggers,
  triggerAll: triggerAllNotificationChecks,
  checkEvents: checkUpcomingEventReminders,
  checkConflicts: checkCalendarConflicts,
  checkGoals: checkGoalNotifications,
  bridgeRalph: bridgeRalphNotifications,
  notifySyncComplete: notifyCalendarSyncComplete,
  notifyError: notifySystemError,
};
