import type { VoiceIntent, CommandAction, ChronosEvent } from '../types';
import { VOICE_CONFIG } from '../lib/config';
import { createEventFromVoice } from '../stores/events.store';

const MEMO_PATTERN = /\b(for my|note for|remember|memo)\b/i;
const QUERY_PATTERN = /\b(what|when|how|show|tell me|whats)\b/i;

function inferCommandAction(text: string): CommandAction {
  const lower = text.toLowerCase();
  if (lower.includes('move')) return 'move_event';
  if (lower.includes('cancel') || lower.includes('delete')) return 'cancel_event';
  if (lower.includes('block')) return 'block_time';
  if (lower.includes('remind')) return 'set_reminder';
  if (lower.includes('update')) return 'update_goal';
  if (lower.includes('complete')) return 'complete_goal';
  return 'create_event';
}

// ----------------------------------------------------------------------------
// Time Parsing Helpers
// ----------------------------------------------------------------------------

function parseRelativeTime(text: string): Date | null {
  const now = new Date();
  const lower = text.toLowerCase();

  // "tomorrow" patterns
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return parseTimeOfDay(lower, tomorrow);
  }

  // "today" patterns
  if (lower.includes('today')) {
    return parseTimeOfDay(lower, now);
  }

  // Day of week patterns
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lower.includes(days[i])) {
      const target = new Date(now);
      const currentDay = now.getDay();
      const daysUntil = (i - currentDay + 7) % 7 || 7;
      target.setDate(target.getDate() + daysUntil);
      return parseTimeOfDay(lower, target);
    }
  }

  // "in X hours/minutes" patterns
  const inHoursMatch = lower.match(/in\s+(\d+)\s*hours?/);
  if (inHoursMatch) {
    const hours = parseInt(inHoursMatch[1], 10);
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  const inMinutesMatch = lower.match(/in\s+(\d+)\s*min(utes?)?/);
  if (inMinutesMatch) {
    const minutes = parseInt(inMinutesMatch[1], 10);
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  // Default to 1 hour from now
  return new Date(now.getTime() + 60 * 60 * 1000);
}

function parseTimeOfDay(text: string, date: Date): Date {
  const result = new Date(date);
  const lower = text.toLowerCase();

  // Specific time patterns
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3];

    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  // Time of day words
  if (lower.includes('morning')) {
    result.setHours(9, 0, 0, 0);
  } else if (lower.includes('afternoon')) {
    result.setHours(14, 0, 0, 0);
  } else if (lower.includes('evening')) {
    result.setHours(18, 0, 0, 0);
  } else if (lower.includes('night')) {
    result.setHours(20, 0, 0, 0);
  } else if (lower.includes('noon') || lower.includes('lunch')) {
    result.setHours(12, 0, 0, 0);
  } else {
    // Default to next hour
    result.setHours(result.getHours() + 1, 0, 0, 0);
  }

  return result;
}

function parseDuration(text: string): number {
  const lower = text.toLowerCase();

  // "for X hours" pattern
  const hoursMatch = lower.match(/for\s+(\d+)\s*hours?/);
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10) * 60;
  }

  // "for X minutes" pattern
  const minutesMatch = lower.match(/for\s+(\d+)\s*min(utes?)?/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10);
  }

  // Default 1 hour
  return 60;
}

function extractEventTitle(text: string, action: CommandAction): string {
  const lower = text.toLowerCase();

  // Remove command keywords
  let title = text
    .replace(/\b(schedule|create|add|block|set up|book)\b/gi, '')
    .replace(/\b(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    .replace(/\b(morning|afternoon|evening|night|noon|lunch)\b/gi, '')
    .replace(/\b(at|for|in|on)\b/gi, '')
    .replace(/\d{1,2}(:\d{2})?\s*(am|pm)?/gi, '')
    .replace(/\d+\s*(hours?|min(utes?)?)/gi, '')
    .trim();

  // Clean up extra spaces
  title = title.replace(/\s+/g, ' ').trim();

  if (!title || title.length < 2) {
    if (action === 'block_time') return 'Focus Time';
    return 'New Event';
  }

  return title.charAt(0).toUpperCase() + title.slice(1);
}

function isKeywordMatch(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.toLowerCase().includes(keyword));
}

export function classifyVoiceIntent(text: string): VoiceIntent {
  const trimmed = text.trim();
  if (!trimmed) {
    return { type: 'conversation', content: '' };
  }

  if (MEMO_PATTERN.test(trimmed) || isKeywordMatch(trimmed, VOICE_CONFIG.intentClassification.memoKeywords)) {
    return { type: 'memo', targetEventId: null, content: trimmed };
  }

  if (QUERY_PATTERN.test(trimmed) || isKeywordMatch(trimmed, VOICE_CONFIG.intentClassification.queryKeywords)) {
    return { type: 'query', question: trimmed };
  }

  if (isKeywordMatch(trimmed, VOICE_CONFIG.intentClassification.commandKeywords)) {
    return { type: 'command', action: inferCommandAction(trimmed), params: {} };
  }

  return { type: 'conversation', content: trimmed };
}

export function describeVoiceIntent(intent: VoiceIntent): string {
  switch (intent.type) {
    case 'command':
      return `Command: ${intent.action}`;
    case 'query':
      return `Query: ${intent.question}`;
    case 'memo':
      return `Memo: ${intent.content}`;
    case 'conversation':
      return intent.content ? `Conversation: ${intent.content}` : 'Conversation';
    default:
      return 'Conversation';
  }
}

export interface VoiceIntentResult {
  message: string;
  requiresEventId?: boolean;
  createdEvent?: ChronosEvent;
}

export function handleVoiceIntent(intent: VoiceIntent, rawText: string = ''): VoiceIntentResult {
  switch (intent.type) {
    case 'query':
      return {
        message: "I heard your question. I'll answer once data is wired in.",
      };

    case 'command':
      return handleCommandIntent(intent, rawText);

    case 'memo':
      return {
        message: 'Memo captured. You can save it to an event below.',
        requiresEventId: true,
      };

    case 'conversation':
      return {
        message: intent.content ? "I'm listening. Tell me more." : 'I am here.',
      };

    default:
      return { message: 'I am here.' };
  }
}

function handleCommandIntent(intent: VoiceIntent & { type: 'command' }, rawText: string): VoiceIntentResult {
  const { action } = intent;

  switch (action) {
    case 'create_event':
    case 'block_time': {
      const startTime = parseRelativeTime(rawText);
      if (!startTime) {
        return { message: "I couldn't understand the time. Try 'tomorrow morning' or '3pm'." };
      }

      const duration = parseDuration(rawText);
      const title = extractEventTitle(rawText, action);
      const grain = action === 'block_time' ? 'sacred' : 'shallow';

      const event = createEventFromVoice(title, startTime, duration, grain);

      const timeStr = startTime.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      return {
        message: `Created "${title}" on ${timeStr} for ${duration} minutes.`,
        createdEvent: event,
      };
    }

    case 'cancel_event':
      return { message: 'To cancel an event, select it first in the timeline.' };

    case 'move_event':
      return { message: 'To move an event, select it first in the timeline.' };

    case 'set_reminder':
      return { message: 'Reminders coming soon.' };

    case 'update_goal':
    case 'complete_goal':
      return { message: 'Goal updates coming soon.' };

    default:
      return { message: `Command "${action}" not yet implemented.` };
  }
}
