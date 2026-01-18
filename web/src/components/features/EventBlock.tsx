// ============================================================================
// EventBlock Component
// Renders an event at different detail levels based on zoom
// ============================================================================

import { useMemo } from 'react';
import type { ChronosEvent } from '../../types';

interface EventBlockProps {
  event: ChronosEvent;
  detailLevel: 'dot' | 'block' | 'card' | 'full';
  onClick?: (event: ChronosEvent) => void;
  isSelected?: boolean;
}

export function EventBlock({ event, detailLevel, onClick, isSelected }: EventBlockProps) {
  const grainColor = useMemo(() => {
    switch (event.grain) {
      case 'sacred':
        return 'bg-purple-500 border-purple-600';
      case 'shallow':
        return 'bg-ink/10 border-ink/20';
      case 'transition':
        return 'bg-accent/20 border-accent/40';
      default:
        return 'bg-ink/10 border-ink/20';
    }
  }, [event.grain]);

  const durationMinutes = useMemo(() => {
    return Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));
  }, [event.start, event.end]);

  const timeLabel = useMemo(() => {
    const start = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const end = event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${start} - ${end}`;
  }, [event.start, event.end]);

  // Dot view (year/quarter zoom)
  if (detailLevel === 'dot') {
    return (
      <button
        type="button"
        className={`w-2 h-2 rounded-full ${grainColor} ${isSelected ? 'ring-2 ring-accent' : ''}`}
        onClick={() => onClick?.(event)}
        title={event.title}
      />
    );
  }

  // Block view (month zoom)
  if (detailLevel === 'block') {
    return (
      <button
        type="button"
        className={`
          px-1 py-0.5 text-xs rounded truncate border
          ${grainColor}
          ${isSelected ? 'ring-2 ring-accent' : ''}
        `}
        onClick={() => onClick?.(event)}
        title={`${timeLabel}: ${event.title}`}
      >
        {event.title}
      </button>
    );
  }

  // Card view (week zoom)
  if (detailLevel === 'card') {
    return (
      <button
        type="button"
        className={`
          p-2 rounded border text-left w-full
          ${grainColor}
          ${isSelected ? 'ring-2 ring-accent' : ''}
          hover:brightness-95 transition-all
        `}
        onClick={() => onClick?.(event)}
      >
        <div className="text-sm font-medium truncate">{event.title}</div>
        <div className="text-xs text-ink/60 mt-0.5">{timeLabel}</div>
        {event.voiceMemos.length > 0 && (
          <div className="text-xs text-accent mt-1">
            🎤 {event.voiceMemos.length} memo{event.voiceMemos.length > 1 ? 's' : ''}
          </div>
        )}
      </button>
    );
  }

  // Full view (day/focus zoom)
  return (
    <button
      type="button"
      className={`
        p-3 rounded-lg border text-left w-full
        ${grainColor}
        ${isSelected ? 'ring-2 ring-accent' : ''}
        hover:brightness-95 transition-all
      `}
      onClick={() => onClick?.(event)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium">{event.title}</div>
        {event.isBlocked && (
          <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
            Protected
          </span>
        )}
      </div>
      <div className="text-sm text-ink/60 mt-1">{timeLabel}</div>
      <div className="text-xs text-ink/50 mt-0.5">{durationMinutes} min</div>

      {event.location && (
        <div className="text-xs text-ink/50 mt-2">📍 {event.location}</div>
      )}

      {event.attendees.length > 0 && (
        <div className="text-xs text-ink/50 mt-1">
          👥 {event.attendees.length} attendee{event.attendees.length > 1 ? 's' : ''}
        </div>
      )}

      {event.voiceMemos.length > 0 && (
        <div className="text-xs text-accent mt-2">
          🎤 {event.voiceMemos.length} voice memo{event.voiceMemos.length > 1 ? 's' : ''}
        </div>
      )}

      {event.goalLinks.length > 0 && (
        <div className="text-xs text-purple-400 mt-1">
          🎯 Linked to {event.goalLinks.length} goal{event.goalLinks.length > 1 ? 's' : ''}
        </div>
      )}

      {event.description && (
        <div className="text-xs text-ink/50 mt-2 line-clamp-2">{event.description}</div>
      )}
    </button>
  );
}
