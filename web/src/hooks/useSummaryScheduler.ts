// ============================================================================
// useSummaryScheduler Hook
// Schedules and manages temporal summary generation
// ============================================================================

import { useEffect, useCallback, useRef, useState } from 'react';

import { generateSummary, scheduleDailySummary, scheduleWeeklySummary } from '../services/summary.service';
import { useUserStore } from '../stores/user.store';
import { useBouncerStore } from '../stores/bouncer.store';
import type { TemporalSummary, SummaryPeriod } from '../types/life-os.types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface SummarySchedulerState {
  lastDailySummary: TemporalSummary | null;
  lastWeeklySummary: TemporalSummary | null;
  isGenerating: boolean;
  error: string | null;
}

interface UseSummarySchedulerReturn extends SummarySchedulerState {
  generateNow: (period: SummaryPeriod) => Promise<TemporalSummary | null>;
  clearSummaries: () => void;
}

// Storage keys
const DAILY_SUMMARY_KEY = 'chronos_last_daily_summary';
const WEEKLY_SUMMARY_KEY = 'chronos_last_weekly_summary';

// ----------------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------------

export function useSummaryScheduler(): UseSummarySchedulerReturn {
  const persona = useUserStore((s) => s.persona);
  const preferences = useUserStore((s) => s.preferences);
  const addNotification = useBouncerStore((s) => s.addNotification);

  const [state, setState] = useState<SummarySchedulerState>({
    lastDailySummary: null,
    lastWeeklySummary: null,
    isGenerating: false,
    error: null,
  });

  const cleanupRef = useRef<(() => void)[]>([]);

  // Load stored summaries on mount
  useEffect(() => {
    try {
      const storedDaily = localStorage.getItem(DAILY_SUMMARY_KEY);
      const storedWeekly = localStorage.getItem(WEEKLY_SUMMARY_KEY);

      setState((prev) => ({
        ...prev,
        lastDailySummary: storedDaily ? JSON.parse(storedDaily) : null,
        lastWeeklySummary: storedWeekly ? JSON.parse(storedWeekly) : null,
      }));
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Handle new summary
  const handleNewSummary = useCallback(
    (summary: TemporalSummary) => {
      const key = summary.period === 'day' ? DAILY_SUMMARY_KEY : WEEKLY_SUMMARY_KEY;
      localStorage.setItem(key, JSON.stringify(summary));

      setState((prev) => ({
        ...prev,
        lastDailySummary: summary.period === 'day' ? summary : prev.lastDailySummary,
        lastWeeklySummary: summary.period === 'week' ? summary : prev.lastWeeklySummary,
      }));

      // Send notification
      addNotification({
        source: 'system',
        title: `${summary.period === 'day' ? 'Daily' : 'Weekly'} Summary Ready`,
        body: summary.headline,
        priority: 'low',
        actionUrl: '/summary',
      });
    },
    [addNotification]
  );

  // Set up scheduled summaries
  useEffect(() => {
    if (!persona) return;

    // Clean up previous schedulers
    cleanupRef.current.forEach((cleanup) => cleanup());
    cleanupRef.current = [];

    // Schedule daily summary (default: 6pm, or user's evening cutoff)
    const dailyTime = preferences.eveningCutoff || '18:00';
    const dailyCleanup = scheduleDailySummary(handleNewSummary, persona, dailyTime);
    cleanupRef.current.push(dailyCleanup);

    // Schedule weekly summary (Sunday at 6pm)
    const weeklyCleanup = scheduleWeeklySummary(handleNewSummary, persona, 0, dailyTime);
    cleanupRef.current.push(weeklyCleanup);

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
    };
  }, [persona, preferences.eveningCutoff, handleNewSummary]);

  // Manual generation
  const generateNow = useCallback(
    async (period: SummaryPeriod): Promise<TemporalSummary | null> => {
      if (!persona) return null;

      setState((prev) => ({ ...prev, isGenerating: true, error: null }));

      try {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (period) {
          case 'day':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'month':
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
          default:
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
        }

        const summary = await generateSummary(period, startDate, endDate, persona);
        handleNewSummary(summary);

        setState((prev) => ({ ...prev, isGenerating: false }));
        return summary;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error: String(error),
        }));
        return null;
      }
    },
    [persona, handleNewSummary]
  );

  // Clear summaries
  const clearSummaries = useCallback(() => {
    localStorage.removeItem(DAILY_SUMMARY_KEY);
    localStorage.removeItem(WEEKLY_SUMMARY_KEY);
    setState((prev) => ({
      ...prev,
      lastDailySummary: null,
      lastWeeklySummary: null,
    }));
  }, []);

  return {
    ...state,
    generateNow,
    clearSummaries,
  };
}
