// ============================================================================
// SUMMARY GENERATION SERVICE
// AI-powered temporal summaries that connect back to goals
// ============================================================================

import { LLM_CONFIG, PERSONA_PROMPTS } from '../lib/config';
import type {
  TemporalSummary,
  SummaryPeriod,
  SummaryMetrics,
  GoalProgressSummary,
  HealthSummary,
  HealthCorrelation,
} from '../types/life-os.types';
import type { ChronosEvent, Goal, Interaction, Pattern, Persona } from '../types';
import { db } from '../db/schema';
import { nanoid } from 'nanoid';

// ----------------------------------------------------------------------------
// Summary Generation
// ----------------------------------------------------------------------------

export async function generateSummary(
  period: SummaryPeriod,
  startDate: Date,
  endDate: Date,
  persona: Persona
): Promise<TemporalSummary> {
  // 1. Gather data
  const [events, goals, interactions, patterns] = await Promise.all([
    getEventsInPeriod(startDate, endDate),
    db.goals.toArray(),
    getInteractionsInPeriod(startDate, endDate),
    db.patterns.toArray(),
  ]);

  // 2. Calculate metrics
  const metrics = calculateMetrics(events, interactions);

  // 3. Calculate goal progress
  const goalProgress = calculateGoalProgress(goals, events, startDate, endDate);

  // 4. Get health summary if available
  const healthSummary = await calculateHealthSummary(startDate, endDate);

  // 5. Generate narrative via LLM
  const narrative = await generateNarrative(
    period,
    startDate,
    endDate,
    metrics,
    goalProgress,
    healthSummary,
    patterns,
    persona
  );

  // 6. Generate forward-looking insights
  const { focusForNext, risksIdentified } = await generateInsights(
    period,
    goalProgress,
    metrics,
    patterns,
    persona
  );

  return {
    id: nanoid(),
    period,
    startDate,
    endDate,
    generatedAt: new Date(),
    headline: narrative.headline,
    story: narrative.story,
    insight: narrative.insight,
    metrics,
    goalProgress,
    patternsLearned: getPatternsLearnedInPeriod(patterns, startDate, endDate),
    patternsApplied: getPatternsAppliedInPeriod(patterns, startDate, endDate),
    healthSummary,
    focusForNext,
    risksIdentified,
  };
}

// ----------------------------------------------------------------------------
// Data Gathering
// ----------------------------------------------------------------------------

async function getEventsInPeriod(start: Date, end: Date): Promise<ChronosEvent[]> {
  return db.events
    .where('start')
    .between(start, end, true, true)
    .toArray();
}

async function getInteractionsInPeriod(start: Date, end: Date): Promise<Interaction[]> {
  return db.interactions
    .where('timestamp')
    .between(start, end, true, true)
    .toArray();
}

// ----------------------------------------------------------------------------
// Metrics Calculation
// ----------------------------------------------------------------------------

function calculateMetrics(events: ChronosEvent[], interactions: Interaction[]): SummaryMetrics {
  const meetings = events.filter((e) => e.attendees.length > 0);
  const deepWork = events.filter((e) => e.grain === 'sacred');
  const protected_ = events.filter((e) => e.isBlocked);

  const hoursFromEvents = (evts: ChronosEvent[]) =>
    evts.reduce((sum, e) => sum + (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60), 0);

  const accepted = interactions.filter((i) => i.userResponse === 'accepted').length;
  const rejected = interactions.filter((i) => i.userResponse === 'rejected').length;

  return {
    hoursWorked: hoursFromEvents(events.filter((e) => e.grain !== 'transition')),
    hoursInMeetings: hoursFromEvents(meetings),
    hoursDeepWork: hoursFromEvents(deepWork),
    hoursProtected: hoursFromEvents(protected_),
    eventsTotal: events.length,
    eventsCompleted: events.filter((e) => e.end < new Date()).length,
    eventsCancelled: 0, // Would need to track this
    conflictsResolved: 0, // Would need to track this
    goalsProgressed: 0, // Calculated below
    goalActionsCompleted: 0,
    goalActionsTotal: 0,
    suggestionsAccepted: accepted,
    suggestionsRejected: rejected,
    autonomousActionsCount: interactions.filter((i) => i.hypothesisId).length,
  };
}

// ----------------------------------------------------------------------------
// Goal Progress Calculation
// ----------------------------------------------------------------------------

function calculateGoalProgress(
  goals: Goal[],
  events: ChronosEvent[],
  startDate: Date,
  endDate: Date
): GoalProgressSummary[] {
  return goals.map((goal) => {
    // Find events linked to this goal
    const linkedEvents = events.filter((e) => e.goalLinks.includes(goal.id));

    // Calculate progress
    const progressPercent = goal.targetValue
      ? (goal.currentValue / goal.targetValue) * 100
      : 0;

    // Determine trend
    const trend = determineTrend(goal, linkedEvents);

    // Calculate projection
    const daysRemaining = goal.deadline
      ? Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const projectedCompletion = projectCompletion(goal, linkedEvents);

    return {
      goalId: goal.id,
      goalText: goal.text,
      startValue: 0, // Would need historical tracking
      endValue: goal.currentValue,
      targetValue: goal.targetValue ?? 0,
      progressPercent,
      trend,
      daysRemaining,
      projectedCompletion,
      status: generateGoalStatus(goal, progressPercent, trend, daysRemaining),
    };
  });
}

function determineTrend(
  goal: Goal,
  linkedEvents: ChronosEvent[]
): 'accelerating' | 'on_track' | 'slowing' | 'stalled' | 'declining' {
  // Simple heuristic based on recent activity
  const daysSinceActivity = goal.lastActivity
    ? (Date.now() - goal.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  if (daysSinceActivity > 14) return 'stalled';
  if (daysSinceActivity > 7) return 'slowing';
  if (linkedEvents.length > 5) return 'accelerating';
  return 'on_track';
}

function projectCompletion(goal: Goal, linkedEvents: ChronosEvent[]): Date | null {
  if (!goal.targetValue || goal.currentValue >= goal.targetValue) return null;

  // Simple linear projection
  const remaining = goal.targetValue - goal.currentValue;
  const createdDaysAgo = (Date.now() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const ratePerDay = goal.currentValue / Math.max(createdDaysAgo, 1);

  if (ratePerDay <= 0) return null;

  const daysToComplete = remaining / ratePerDay;
  return new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);
}

function generateGoalStatus(
  goal: Goal,
  progressPercent: number,
  trend: string,
  daysRemaining: number | null
): string {
  if (goal.status === 'completed') return 'Completed!';
  if (goal.status === 'archived') return 'Archived';

  if (daysRemaining !== null && daysRemaining < 0) {
    return `Overdue by ${Math.abs(daysRemaining)} days`;
  }

  if (trend === 'stalled') {
    return `Stalled at ${progressPercent.toFixed(0)}%`;
  }

  if (trend === 'accelerating') {
    return `Accelerating - ${progressPercent.toFixed(0)}% complete`;
  }

  return `${progressPercent.toFixed(0)}% complete, ${trend}`;
}

// ----------------------------------------------------------------------------
// Health Summary
// ----------------------------------------------------------------------------

async function calculateHealthSummary(
  startDate: Date,
  endDate: Date
): Promise<HealthSummary | null> {
  // In a real implementation, this would query health data
  // For now, return null (health integration is Phase 2)
  return null;
}

// ----------------------------------------------------------------------------
// Pattern Analysis
// ----------------------------------------------------------------------------

function getPatternsLearnedInPeriod(patterns: Pattern[], start: Date, end: Date): string[] {
  return patterns
    .filter((p) => p.confirmedAt >= start && p.confirmedAt <= end)
    .map((p) => p.description);
}

function getPatternsAppliedInPeriod(patterns: Pattern[], start: Date, end: Date): string[] {
  return patterns
    .filter((p) => p.lastApplied && p.lastApplied >= start && p.lastApplied <= end)
    .map((p) => p.description);
}

// ----------------------------------------------------------------------------
// LLM Narrative Generation
// ----------------------------------------------------------------------------

interface Narrative {
  headline: string;
  story: string;
  insight: string;
}

async function generateNarrative(
  period: SummaryPeriod,
  startDate: Date,
  endDate: Date,
  metrics: SummaryMetrics,
  goalProgress: GoalProgressSummary[],
  healthSummary: HealthSummary | null,
  patterns: Pattern[],
  persona: Persona
): Promise<Narrative> {
  const prompt = buildNarrativePrompt(period, startDate, endDate, metrics, goalProgress, healthSummary, patterns);

  try {
    const response = await callLLM(prompt, persona);
    return parseNarrativeResponse(response);
  } catch (error) {
    // Fallback to template-based narrative
    return generateFallbackNarrative(period, metrics, goalProgress);
  }
}

function buildNarrativePrompt(
  period: SummaryPeriod,
  startDate: Date,
  endDate: Date,
  metrics: SummaryMetrics,
  goalProgress: GoalProgressSummary[],
  healthSummary: HealthSummary | null,
  patterns: Pattern[]
): string {
  const periodLabel = {
    day: 'today',
    week: 'this week',
    month: 'this month',
    quarter: 'this quarter',
    year: 'this year',
  }[period];

  return `Generate a ${period} summary for ${periodLabel}.

DATA:
- Hours worked: ${metrics.hoursWorked.toFixed(1)}
- Hours in meetings: ${metrics.hoursInMeetings.toFixed(1)}
- Hours deep work: ${metrics.hoursDeepWork.toFixed(1)}
- Events: ${metrics.eventsTotal} total
- Suggestions accepted: ${metrics.suggestionsAccepted}
- Suggestions rejected: ${metrics.suggestionsRejected}

GOALS:
${goalProgress.map((g) => `- ${g.goalText}: ${g.status}`).join('\n')}

PATTERNS LEARNED:
${patterns.slice(0, 3).map((p) => `- ${p.description}`).join('\n') || 'None yet'}

Generate:
1. HEADLINE: A punchy 5-8 word summary
2. STORY: 2-3 paragraphs telling the narrative of ${periodLabel}
3. INSIGHT: One key observation or learning

Format as JSON:
{"headline": "...", "story": "...", "insight": "..."}`;
}

function parseNarrativeResponse(response: string): Narrative {
  try {
    const parsed = JSON.parse(response);
    return {
      headline: parsed.headline || 'Summary Generated',
      story: parsed.story || 'No story available.',
      insight: parsed.insight || 'Keep going!',
    };
  } catch {
    return {
      headline: 'Summary Generated',
      story: response,
      insight: 'Keep going!',
    };
  }
}

function generateFallbackNarrative(
  period: SummaryPeriod,
  metrics: SummaryMetrics,
  goalProgress: GoalProgressSummary[]
): Narrative {
  const activeGoals = goalProgress.filter((g) => g.progressPercent < 100);
  const completedGoals = goalProgress.filter((g) => g.progressPercent >= 100);

  return {
    headline: `${metrics.eventsTotal} events, ${metrics.hoursDeepWork.toFixed(0)}h deep work`,
    story: `You had ${metrics.eventsTotal} events ${period === 'day' ? 'today' : 'this ' + period}, ` +
      `spending ${metrics.hoursInMeetings.toFixed(1)} hours in meetings and ` +
      `${metrics.hoursDeepWork.toFixed(1)} hours in deep work. ` +
      (completedGoals.length > 0
        ? `You completed ${completedGoals.length} goal(s). `
        : '') +
      (activeGoals.length > 0
        ? `${activeGoals.length} goal(s) are still in progress.`
        : ''),
    insight: metrics.suggestionsRejected > metrics.suggestionsAccepted
      ? "You've been overriding suggestions frequently. Ralph is learning from this."
      : 'Keep up the momentum!',
  };
}

// ----------------------------------------------------------------------------
// Insights Generation
// ----------------------------------------------------------------------------

async function generateInsights(
  period: SummaryPeriod,
  goalProgress: GoalProgressSummary[],
  metrics: SummaryMetrics,
  patterns: Pattern[],
  persona: Persona
): Promise<{ focusForNext: string[]; risksIdentified: string[] }> {
  // Identify risks
  const risks: string[] = [];

  // Stalled goals
  const stalledGoals = goalProgress.filter((g) => g.trend === 'stalled');
  if (stalledGoals.length > 0) {
    risks.push(`${stalledGoals.length} goal(s) have stalled and need attention`);
  }

  // Overcommitment
  if (metrics.hoursWorked > 50) {
    risks.push('High hours worked - watch for burnout');
  }

  // Low deep work ratio
  const deepWorkRatio = metrics.hoursDeepWork / Math.max(metrics.hoursWorked, 1);
  if (deepWorkRatio < 0.2) {
    risks.push('Low deep work ratio - consider protecting more focus time');
  }

  // Generate focus suggestions
  const focus: string[] = [];

  // Goals needing attention
  const urgentGoals = goalProgress.filter(
    (g) => g.daysRemaining !== null && g.daysRemaining < 14 && g.progressPercent < 80
  );
  if (urgentGoals.length > 0) {
    focus.push(`Prioritize: ${urgentGoals[0].goalText} (${urgentGoals[0].daysRemaining} days left)`);
  }

  // Pattern-based suggestions
  const newPatterns = patterns.filter(
    (p) => Date.now() - p.confirmedAt.getTime() < 7 * 24 * 60 * 60 * 1000
  );
  if (newPatterns.length > 0) {
    focus.push(`Apply new learning: ${newPatterns[0].description}`);
  }

  return {
    focusForNext: focus.length > 0 ? focus : ['Maintain current momentum'],
    risksIdentified: risks,
  };
}

// ----------------------------------------------------------------------------
// LLM Client
// ----------------------------------------------------------------------------

async function callLLM(prompt: string, persona: Persona): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: LLM_CONFIG.models.fast, // Use fast model for summaries
      messages: [
        { role: 'system', content: PERSONA_PROMPTS[persona] },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ----------------------------------------------------------------------------
// Scheduled Summary Generation
// ----------------------------------------------------------------------------

export function scheduleDailySummary(
  callback: (summary: TemporalSummary) => void,
  persona: Persona,
  timeOfDay: string = '18:00' // Default to 6pm
): () => void {
  const checkAndGenerate = async () => {
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);

    if (now.getHours() === hours && now.getMinutes() === minutes) {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const summary = await generateSummary('day', startOfDay, endOfDay, persona);
      callback(summary);
    }
  };

  // Check every minute
  const intervalId = setInterval(checkAndGenerate, 60 * 1000);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

export function scheduleWeeklySummary(
  callback: (summary: TemporalSummary) => void,
  persona: Persona,
  dayOfWeek: number = 0, // Sunday
  timeOfDay: string = '18:00'
): () => void {
  const checkAndGenerate = async () => {
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);

    if (
      now.getDay() === dayOfWeek &&
      now.getHours() === hours &&
      now.getMinutes() === minutes
    ) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(now);
      endOfWeek.setHours(23, 59, 59, 999);

      const summary = await generateSummary('week', startOfWeek, endOfWeek, persona);
      callback(summary);
    }
  };

  const intervalId = setInterval(checkAndGenerate, 60 * 1000);
  return () => clearInterval(intervalId);
}
