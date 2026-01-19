// ============================================================================
// BOUNCER SERVICE
// Notification filtering and routing logic
// ============================================================================

import { BOUNCER_CONFIG } from '../lib/config';
import type { ChronosNotification, NotificationPriority, UserState } from '../types';

export type BouncerDecision = 'bypass' | 'lobby';

const LOW_PRIORITY_KEYWORDS = ['fyi', 'when you get a chance', 'no rush'];

export function routeNotification(
  notification: ChronosNotification,
  userState: UserState
): BouncerDecision {
  if (!userState.preferences.notificationsEnabled) {
    return 'lobby';
  }

  const score = calculatePriorityScore(notification, userState);
  if (score >= BOUNCER_CONFIG.bypassThreshold) {
    return 'bypass';
  }

  if (score <= BOUNCER_CONFIG.lobbyThreshold) {
    return 'lobby';
  }

  // Mid-range defaults based on mode
  if (userState.bouncerMode === 'strict') {
    return notification.priority === 'critical' || notification.priority === 'high'
      ? 'bypass'
      : 'lobby';
  }

  return notification.priority === 'low' ? 'lobby' : 'bypass';
}

export function calculatePriorityScore(
  notification: ChronosNotification,
  userState: UserState
): number {
  let score = 0;

  // Priority baseline
  score += priorityToScore(notification.priority);

  // Keyword signals
  const combined = `${notification.title} ${notification.body}`.toLowerCase();
  if (containsAny(combined, BOUNCER_CONFIG.emergencySignals)) {
    score += BOUNCER_CONFIG.scoring.urgentKeywords;
  }
  if (containsAny(combined, LOW_PRIORITY_KEYWORDS)) {
    score += BOUNCER_CONFIG.scoring.lowPriorityKeywords;
  }

  // Bouncer mode signal
  if (userState.bouncerMode === 'strict') {
    score += BOUNCER_CONFIG.scoring.sacredTimeActive;
  }

  return score;
}

function priorityToScore(priority: NotificationPriority): number {
  switch (priority) {
    case 'critical':
      return 80;
    case 'high':
      return 60;
    case 'medium':
      return 40;
    case 'low':
      return 10;
    default:
      return 0;
  }
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}
