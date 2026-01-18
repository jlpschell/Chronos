// ============================================================================
// useTimeGPS Hook
// GPS-style pinch zoom and pan gestures for time visualization
// ============================================================================

import { useState, useCallback, useRef, useMemo } from 'react';
import type { ViewState, ZoomLevel, ZoomLevelConfig } from '../types/life-os.types';
import { ZOOM_CONFIGS } from '../types/life-os.types';

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const MIN_ZOOM = 0;
const MAX_ZOOM = 6;
const MOMENTUM_FRICTION = 0.95;
const MOMENTUM_THRESHOLD = 0.1;
const ANIMATION_DURATION = 300;

// ----------------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function addTime(date: Date, milliseconds: number): Date {
  return new Date(date.getTime() + milliseconds);
}

function getZoomConfig(level: number): ZoomLevelConfig {
  const floorLevel = Math.floor(clamp(level, MIN_ZOOM, MAX_ZOOM)) as ZoomLevel;
  return ZOOM_CONFIGS[floorLevel];
}

function interpolateTimeSpan(level: number): number {
  const floorLevel = Math.floor(level);
  const ceilLevel = Math.ceil(level);
  const t = level - floorLevel;

  const floorConfig = ZOOM_CONFIGS[clamp(floorLevel, MIN_ZOOM, MAX_ZOOM) as ZoomLevel];
  const ceilConfig = ZOOM_CONFIGS[clamp(ceilLevel, MIN_ZOOM, MAX_ZOOM) as ZoomLevel];

  return lerp(floorConfig.timeSpan, ceilConfig.timeSpan, easeOutCubic(t));
}

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

export function useTimeGPS(initialDate: Date = new Date()) {
  // State
  const [viewState, setViewState] = useState<ViewState>({
    zoomLevel: 4, // Start at week view
    focalPoint: initialDate,
    velocity: { x: 0, y: 0 },
    isAnimating: false,
  });

  // Refs for gesture handling
  const gestureStartRef = useRef<{
    zoomLevel: number;
    focalPoint: Date;
    touches: { x: number; y: number }[];
  } | null>(null);

  const momentumRef = useRef<number | null>(null);

  // Derived values
  const config = useMemo(() => getZoomConfig(viewState.zoomLevel), [viewState.zoomLevel]);
  const timeSpan = useMemo(() => interpolateTimeSpan(viewState.zoomLevel), [viewState.zoomLevel]);
  const visibleRange = useMemo(() => {
    const halfSpan = timeSpan / 2;
    return {
      start: addTime(viewState.focalPoint, -halfSpan),
      end: addTime(viewState.focalPoint, halfSpan),
    };
  }, [viewState.focalPoint, timeSpan]);

  // --------------------------------------------------------------------
  // Zoom Controls
  // --------------------------------------------------------------------

  const zoomTo = useCallback((targetLevel: number, focalDate?: Date, animate = true) => {
    const clampedLevel = clamp(targetLevel, MIN_ZOOM, MAX_ZOOM);

    if (!animate) {
      setViewState((prev) => ({
        ...prev,
        zoomLevel: clampedLevel,
        focalPoint: focalDate ?? prev.focalPoint,
        isAnimating: false,
      }));
      return;
    }

    // Animated zoom
    setViewState((prev) => ({ ...prev, isAnimating: true }));

    const startLevel = viewState.zoomLevel;
    const startTime = performance.now();

    const animateZoom = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = easeOutCubic(progress);

      const newLevel = lerp(startLevel, clampedLevel, easedProgress);

      setViewState((prev) => ({
        ...prev,
        zoomLevel: newLevel,
        focalPoint: focalDate ?? prev.focalPoint,
        isAnimating: progress < 1,
      }));

      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      }
    };

    requestAnimationFrame(animateZoom);
  }, [viewState.zoomLevel]);

  const zoomIn = useCallback(() => {
    zoomTo(Math.min(viewState.zoomLevel + 1, MAX_ZOOM));
  }, [viewState.zoomLevel, zoomTo]);

  const zoomOut = useCallback(() => {
    zoomTo(Math.max(viewState.zoomLevel - 1, MIN_ZOOM));
  }, [viewState.zoomLevel, zoomTo]);

  // --------------------------------------------------------------------
  // Pan Controls
  // --------------------------------------------------------------------

  const panTo = useCallback((date: Date, animate = true) => {
    if (!animate) {
      setViewState((prev) => ({ ...prev, focalPoint: date }));
      return;
    }

    const startPoint = viewState.focalPoint.getTime();
    const endPoint = date.getTime();
    const startTime = performance.now();

    const animatePan = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = easeOutCubic(progress);

      const newPoint = lerp(startPoint, endPoint, easedProgress);

      setViewState((prev) => ({
        ...prev,
        focalPoint: new Date(newPoint),
        isAnimating: progress < 1,
      }));

      if (progress < 1) {
        requestAnimationFrame(animatePan);
      }
    };

    setViewState((prev) => ({ ...prev, isAnimating: true }));
    requestAnimationFrame(animatePan);
  }, [viewState.focalPoint]);

  const goToToday = useCallback(() => {
    panTo(new Date());
  }, [panTo]);

  const goToDate = useCallback((date: Date) => {
    panTo(date);
  }, [panTo]);

  // --------------------------------------------------------------------
  // Gesture Handlers (for use with gesture library)
  // --------------------------------------------------------------------

  const onPinchStart = useCallback((event: { origin: [number, number] }) => {
    gestureStartRef.current = {
      zoomLevel: viewState.zoomLevel,
      focalPoint: viewState.focalPoint,
      touches: [{ x: event.origin[0], y: event.origin[1] }],
    };
  }, [viewState]);

  const onPinch = useCallback((event: {
    scale: number;
    origin: [number, number];
    velocity: number;
  }) => {
    if (!gestureStartRef.current) return;

    // Scale maps to zoom level change
    const scaleFactor = Math.log2(event.scale);
    const newLevel = clamp(
      gestureStartRef.current.zoomLevel - scaleFactor,
      MIN_ZOOM,
      MAX_ZOOM
    );

    setViewState((prev) => ({
      ...prev,
      zoomLevel: newLevel,
      velocity: { x: event.velocity, y: 0 },
    }));
  }, []);

  const onPinchEnd = useCallback(() => {
    gestureStartRef.current = null;

    // Snap to nearest zoom level
    const targetLevel = Math.round(viewState.zoomLevel);
    if (Math.abs(viewState.zoomLevel - targetLevel) > 0.1) {
      zoomTo(targetLevel);
    }
  }, [viewState.zoomLevel, zoomTo]);

  const onDragStart = useCallback(() => {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }

    gestureStartRef.current = {
      zoomLevel: viewState.zoomLevel,
      focalPoint: viewState.focalPoint,
      touches: [],
    };
  }, [viewState]);

  const onDrag = useCallback((event: {
    movement: [number, number];
    velocity: [number, number];
  }) => {
    // Convert pixel movement to time based on current zoom
    const pixelsPerMs = 1000 / timeSpan; // Adjust based on screen width
    const timeDelta = event.movement[0] / pixelsPerMs;

    setViewState((prev) => ({
      ...prev,
      focalPoint: addTime(prev.focalPoint, -timeDelta),
      velocity: { x: event.velocity[0], y: event.velocity[1] },
    }));
  }, [timeSpan]);

  const onDragEnd = useCallback(() => {
    gestureStartRef.current = null;

    // Apply momentum
    const { velocity } = viewState;
    if (Math.abs(velocity.x) < MOMENTUM_THRESHOLD) return;

    const applyMomentum = () => {
      setViewState((prev) => {
        const newVelocityX = prev.velocity.x * MOMENTUM_FRICTION;

        if (Math.abs(newVelocityX) < MOMENTUM_THRESHOLD) {
          momentumRef.current = null;
          return { ...prev, velocity: { x: 0, y: 0 } };
        }

        const pixelsPerMs = 1000 / timeSpan;
        const timeDelta = newVelocityX / pixelsPerMs;

        momentumRef.current = requestAnimationFrame(applyMomentum);

        return {
          ...prev,
          focalPoint: addTime(prev.focalPoint, -timeDelta),
          velocity: { x: newVelocityX, y: 0 },
        };
      });
    };

    momentumRef.current = requestAnimationFrame(applyMomentum);
  }, [viewState.velocity, timeSpan]);

  // --------------------------------------------------------------------
  // Coordinate Conversion
  // --------------------------------------------------------------------

  const screenXToDate = useCallback((screenX: number, containerWidth: number): Date => {
    const centerX = containerWidth / 2;
    const offsetRatio = (screenX - centerX) / containerWidth;
    const timeOffset = offsetRatio * timeSpan;
    return addTime(viewState.focalPoint, timeOffset);
  }, [viewState.focalPoint, timeSpan]);

  const dateToScreenX = useCallback((date: Date, containerWidth: number): number => {
    const timeDiff = date.getTime() - viewState.focalPoint.getTime();
    const offsetRatio = timeDiff / timeSpan;
    return (containerWidth / 2) + (offsetRatio * containerWidth);
  }, [viewState.focalPoint, timeSpan]);

  // --------------------------------------------------------------------
  // Keyboard Shortcuts
  // --------------------------------------------------------------------

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
      case 'ArrowLeft':
        panTo(addTime(viewState.focalPoint, -timeSpan * 0.25));
        break;
      case 'ArrowRight':
        panTo(addTime(viewState.focalPoint, timeSpan * 0.25));
        break;
      case 't':
      case 'T':
        goToToday();
        break;
      case '1':
        zoomTo(1); // Year
        break;
      case '2':
        zoomTo(2); // Quarter
        break;
      case '3':
        zoomTo(3); // Month
        break;
      case '4':
        zoomTo(4); // Week
        break;
      case '5':
        zoomTo(5); // Day
        break;
    }
  }, [zoomIn, zoomOut, panTo, goToToday, zoomTo, viewState.focalPoint, timeSpan]);

  return {
    // State
    viewState,
    config,
    timeSpan,
    visibleRange,

    // Zoom
    zoomTo,
    zoomIn,
    zoomOut,

    // Pan
    panTo,
    goToToday,
    goToDate,

    // Gesture handlers (for gesture library integration)
    onPinchStart,
    onPinch,
    onPinchEnd,
    onDragStart,
    onDrag,
    onDragEnd,

    // Coordinate conversion
    screenXToDate,
    dateToScreenX,

    // Keyboard
    handleKeyDown,
  };
}

// ----------------------------------------------------------------------------
// Zoom Level Helpers
// ----------------------------------------------------------------------------

export function getZoomLevelName(level: number): string {
  const config = getZoomConfig(level);
  return config.name;
}

export function shouldShowDetail(level: number, detail: 'goals' | 'health' | 'patterns'): boolean {
  const config = getZoomConfig(level);
  switch (detail) {
    case 'goals':
      return config.showGoals;
    case 'health':
      return config.showHealth;
    case 'patterns':
      return config.showPatterns;
  }
}

export function getEventDetailLevel(level: number): 'dot' | 'block' | 'card' | 'full' {
  const config = getZoomConfig(level);
  return config.eventDetail;
}
