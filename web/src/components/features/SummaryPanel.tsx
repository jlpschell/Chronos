// ============================================================================
// SummaryPanel Component
// Displays AI-generated temporal summaries
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { SummaryPeriod, TemporalSummary } from '../../types/life-os.types';
import { generateSummary } from '../../services/summary.service';
import { useUserStore } from '../../stores/user.store';

const PERIOD_OPTIONS: Array<{
  value: SummaryPeriod;
  label: string;
  description: string;
}> = [
  { value: 'day', label: 'Today', description: 'Last 24 hours' },
  { value: 'week', label: 'This week', description: 'Last 7 days' },
  { value: 'month', label: 'This month', description: 'Last 30 days' },
];

export function SummaryPanel() {
  const persona = useUserStore((s) => s.persona ?? 'supportive_peer');

  const [period, setPeriod] = useState<SummaryPeriod>('week');
  const [summary, setSummary] = useState<TemporalSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodLabel = useMemo(
    () => PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? 'Summary',
    [period]
  );

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getPeriodRange(period);
      const result = await generateSummary(period, start, end, persona);
      setSummary(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [period, persona]);

  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              period === option.value
                ? 'bg-accent text-white'
                : 'bg-surface hover:bg-ink/5'
            }`}
            onClick={() => setPeriod(option.value)}
          >
            <div className="font-medium">{option.label}</div>
            <div className="text-xs opacity-70">{option.description}</div>
          </button>
        ))}
      </div>

      {/* Summary Content */}
      <div className="rounded-lg border border-border bg-surface p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{periodLabel}</h3>
            <p className="text-sm text-ink/60">AI-powered overview</p>
          </div>
          <button
            type="button"
            className="px-4 py-2 text-sm rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded">
            {error}
          </div>
        )}

        {!summary && !loading && (
          <div className="text-center py-8 text-ink/50">
            <div className="text-3xl mb-2">📌</div>
            <p>No summary yet. Click refresh to generate one.</p>
          </div>
        )}

        {summary && (
          <>
            {/* Headline */}
            <div>
              <h2 className="text-2xl font-bold text-ink">{summary.headline}</h2>
              <p className="text-sm text-ink/50 mt-1">
                Generated {summary.generatedAt.toLocaleString()}
              </p>
            </div>

            {/* Story */}
            <div className="prose prose-sm max-w-none text-ink/80">
              {summary.story.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Insight */}
            <div className="border-l-4 border-accent pl-4 bg-accent/5 py-2 rounded-r">
              <div className="text-sm font-medium text-accent">Key Insight</div>
              <div className="text-sm text-ink/80 mt-1">{summary.insight}</div>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Metrics</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard
                  label="Hours worked"
                  value={`${summary.metrics.hoursWorked.toFixed(1)}h`}
                />
                <MetricCard
                  label="Deep work"
                  value={`${summary.metrics.hoursDeepWork.toFixed(1)}h`}
                />
                <MetricCard
                  label="Meetings"
                  value={`${summary.metrics.hoursInMeetings.toFixed(1)}h`}
                />
                <MetricCard
                  label="Events"
                  value={`${summary.metrics.eventsTotal}`}
                />
              </div>
            </div>

            {/* Goals */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Goal Progress</div>
              {summary.goalProgress.length === 0 ? (
                <div className="text-sm text-ink/50">No goals tracked yet.</div>
              ) : (
                <div className="space-y-2">
                  {summary.goalProgress.map((goal) => (
                    <div
                      key={goal.goalId}
                      className="p-3 rounded-lg bg-canvas border border-border"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm">{goal.goalText}</div>
                        <div className="text-xs text-ink/50">
                          {goal.progressPercent.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-xs text-ink/60 mt-1">
                        {goal.status}
                      </div>
                      <div className="mt-2 h-1 bg-ink/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${goal.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Patterns */}
            <div className="grid sm:grid-cols-2 gap-4">
              <PatternList
                title="Patterns learned"
                items={summary.patternsLearned}
              />
              <PatternList
                title="Patterns applied"
                items={summary.patternsApplied}
              />
            </div>

            {/* Focus + Risks */}
            <div className="grid sm:grid-cols-2 gap-4">
              <ListCard title="Focus for next period" items={summary.focusForNext} />
              <ListCard title="Risks identified" items={summary.risksIdentified} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getPeriodRange(period: SummaryPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);

  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start.setDate(start.getDate() - 7);
  } else if (period === 'month') {
    start.setDate(start.getDate() - 30);
  } else if (period === 'quarter') {
    start.setDate(start.getDate() - 90);
  } else if (period === 'year') {
    start.setDate(start.getDate() - 365);
  }

  return { start, end };
}

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="p-3 rounded-lg bg-canvas border border-border">
      <div className="text-xs text-ink/50">{label}</div>
      <div className="text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}

interface PatternListProps {
  title: string;
  items: string[];
}

function PatternList({ title, items }: PatternListProps) {
  return (
    <div className="p-3 rounded-lg bg-canvas border border-border space-y-2">
      <div className="text-sm font-medium">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-ink/50">None yet.</div>
      ) : (
        <ul className="text-xs text-ink/70 space-y-1">
          {items.map((item, idx) => (
            <li key={`${item}-${idx}`}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ListCardProps {
  title: string;
  items: string[];
}

function ListCard({ title, items }: ListCardProps) {
  return (
    <div className="p-3 rounded-lg bg-canvas border border-border space-y-2">
      <div className="text-sm font-medium">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-ink/50">None.</div>
      ) : (
        <ul className="text-xs text-ink/70 space-y-1">
          {items.map((item, idx) => (
            <li key={`${item}-${idx}`}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
