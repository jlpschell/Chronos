// ============================================================================
// TimelineView Component
// DOM-based zoomable timeline for Time GPS visualization
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTimeGPS, getZoomLevelName, getEventDetailLevel } from '../../hooks/useTimeGPS';
import { useEventsStore } from '../../stores/events.store';
import { EventBlock } from './EventBlock';
import type { ChronosEvent } from '../../types';

interface TimelineViewProps {
  onEventClick?: (event: ChronosEvent) => void;
  selectedEventId?: string | null;
}

export function TimelineView({ onEventClick, selectedEventId }: TimelineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  const {
    viewState,
    config,
    visibleRange,
    zoomIn,
    zoomOut,
    zoomTo,
    goToToday,
    handleKeyDown,
  } = useTimeGPS();

  const events = useEventsStore((s) => s.events);

  // Get events in visible range
  const visibleEvents = useMemo(() => {
    return events.filter(
      (e) => e.start <= visibleRange.end && e.end >= visibleRange.start
    );
  }, [events, visibleRange]);

  // Measure container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown]);

  const zoomLevelName = useMemo(() => getZoomLevelName(viewState.zoomLevel), [viewState.zoomLevel]);
  const detailLevel = useMemo(() => getEventDetailLevel(viewState.zoomLevel), [viewState.zoomLevel]);

  // Generate time slots based on zoom level
  const timeSlots = useMemo(() => {
    const slots: { date: Date; label: string; isToday: boolean }[] = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startMs = visibleRange.start.getTime();
    const endMs = visibleRange.end.getTime();

    // Determine slot interval based on zoom
    let intervalMs: number;
    let formatOptions: Intl.DateTimeFormatOptions;

    if (viewState.zoomLevel <= 1) {
      // Year view: show months
      intervalMs = 30 * 24 * 60 * 60 * 1000;
      formatOptions = { month: 'short', year: '2-digit' };
    } else if (viewState.zoomLevel <= 2) {
      // Quarter view: show weeks
      intervalMs = 7 * 24 * 60 * 60 * 1000;
      formatOptions = { month: 'short', day: 'numeric' };
    } else if (viewState.zoomLevel <= 3) {
      // Month view: show days
      intervalMs = 24 * 60 * 60 * 1000;
      formatOptions = { weekday: 'short', day: 'numeric' };
    } else if (viewState.zoomLevel <= 4) {
      // Week view: show days
      intervalMs = 24 * 60 * 60 * 1000;
      formatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    } else if (viewState.zoomLevel <= 5) {
      // Day view: show hours
      intervalMs = 60 * 60 * 1000;
      formatOptions = { hour: 'numeric', minute: '2-digit' };
    } else {
      // Focus view: show 15-min slots
      intervalMs = 15 * 60 * 1000;
      formatOptions = { hour: 'numeric', minute: '2-digit' };
    }

    // Align start to interval boundary
    const alignedStart = Math.floor(startMs / intervalMs) * intervalMs;

    for (let ms = alignedStart; ms <= endMs; ms += intervalMs) {
      const date = new Date(ms);
      const slotDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      slots.push({
        date,
        label: date.toLocaleString(undefined, formatOptions),
        isToday: slotDay.getTime() === todayStart.getTime(),
      });
    }

    return slots;
  }, [visibleRange, viewState.zoomLevel]);

  // Group events by time slot for rendering
  const eventsBySlot = useMemo(() => {
    const grouped = new Map<number, ChronosEvent[]>();

    for (const event of visibleEvents) {
      // Find the slot this event starts in
      const slotIdx = timeSlots.findIndex((slot, idx) => {
        const nextSlot = timeSlots[idx + 1];
        if (!nextSlot) return true;
        return event.start >= slot.date && event.start < nextSlot.date;
      });

      if (slotIdx >= 0) {
        const existing = grouped.get(slotIdx) || [];
        existing.push(event);
        grouped.set(slotIdx, existing);
      }
    }

    return grouped;
  }, [visibleEvents, timeSlots]);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      {/* Header with zoom controls */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-canvas">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">
            {zoomLevelName.charAt(0).toUpperCase() + zoomLevelName.slice(1)} View
          </span>
          <span className="text-xs text-ink/50">
            {visibleRange.start.toLocaleDateString()} – {visibleRange.end.toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="px-2 py-1 text-xs rounded border border-border hover:bg-ink/5"
            onClick={goToToday}
          >
            Today
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs rounded border border-border hover:bg-ink/5"
            onClick={zoomOut}
            disabled={viewState.zoomLevel <= 0}
          >
            −
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs rounded border border-border hover:bg-ink/5"
            onClick={zoomIn}
            disabled={viewState.zoomLevel >= 6}
          >
            +
          </button>
        </div>
      </div>

      {/* Zoom level quick select */}
      <div className="flex gap-1 p-2 border-b border-border bg-canvas/50">
        {['Year', 'Quarter', 'Month', 'Week', 'Day', 'Focus'].map((label, idx) => (
          <button
            key={label}
            type="button"
            className={`
              px-2 py-1 text-xs rounded transition-colors
              ${Math.floor(viewState.zoomLevel) === idx + 1
                ? 'bg-accent text-white'
                : 'hover:bg-ink/5'
              }
            `}
            onClick={() => zoomTo(idx + 1)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline grid */}
      <div ref={containerRef} className="overflow-x-auto">
        <div
          className="flex min-w-full"
          style={{ minHeight: viewState.zoomLevel >= 5 ? '500px' : '200px' }}
        >
          {timeSlots.map((slot, idx) => (
            <div
              key={slot.date.getTime()}
              className={`
                flex-shrink-0 border-r border-border
                ${slot.isToday ? 'bg-accent/5' : ''}
              `}
              style={{
                width: viewState.zoomLevel >= 5 ? '80px' : viewState.zoomLevel >= 4 ? '120px' : '60px',
              }}
            >
              {/* Slot header */}
              <div
                className={`
                  text-xs px-1 py-1 border-b border-border text-center sticky top-0
                  ${slot.isToday ? 'bg-accent/10 text-accent font-medium' : 'bg-canvas/80 text-ink/60'}
                `}
              >
                {slot.label}
              </div>

              {/* Events in this slot */}
              <div className="p-1 space-y-1">
                {(eventsBySlot.get(idx) || []).map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    detailLevel={detailLevel}
                    onClick={onEventClick}
                    isSelected={event.id === selectedEventId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with keyboard hints */}
      <div className="flex items-center justify-between p-2 border-t border-border bg-canvas/50 text-xs text-ink/40">
        <span>{visibleEvents.length} event{visibleEvents.length !== 1 ? 's' : ''}</span>
        <span>← → pan • + − zoom • T today • 1-5 views</span>
      </div>
    </div>
  );
}
