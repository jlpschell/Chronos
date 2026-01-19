// ============================================================================
// Showcase Page
// Component gallery for UI preview - bypasses intake flow
// ============================================================================

import { useEffect, useMemo, useState } from 'react';

import { ThemeSelector } from '../components/features/ThemeSelector';
import { TimelineView } from '../components/features/TimelineView';
import { VoicePanel } from '../components/features/VoicePanel';
import { RalphTransparency } from '../components/features/RalphTransparency';
import { BouncerPanel } from '../components/features/BouncerPanel';
import { SummaryPanel } from '../components/features/SummaryPanel';
import { GoalsPanel } from '../components/features/GoalsPanel';
import { DataManagement } from '../components/features/DataManagement';
import { EncryptionSetup } from '../components/features/EncryptionSetup';
import { CoachingPanel } from '../components/features/CoachingPanel';
import {
  Spinner,
  LoadingInline,
  SkeletonList,
  EmptyState,
  EmptyGoals,
  ErrorState,
} from '../components/ui';
import { useUserStore } from '../stores/user.store';
import { useEventsStore } from '../stores/events.store';
import { useRalphStore } from '../stores/ralph.store';
import type { Goal } from '../types';
import type { 
  ChronosEvent, 
  Pattern, 
  Hypothesis, 
  Interaction,
  PatternTrigger,
  PatternAction,
  TriggerCondition,
  InteractionContext,
} from '../types';

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockEvents(): Omit<ChronosEvent, 'id' | 'createdAt' | 'updatedAt' | 'lastSynced'>[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [
    {
      externalId: null,
      provider: 'local',
      calendarId: 'local',
      title: 'Team Standup',
      description: 'Daily sync with the engineering team',
      start: new Date(today.getTime() + 9 * 60 * 60 * 1000),
      end: new Date(today.getTime() + 9.5 * 60 * 60 * 1000),
      allDay: false,
      location: 'Zoom',
      attendees: [],
      recurrenceRule: null,
      color: '#38bdf8',
      voiceMemos: [],
      goalLinks: [],
      bufferBefore: null,
      bufferAfter: null,
      grain: 'shallow',
      isBlocked: false,
    },
    {
      externalId: null,
      provider: 'local',
      calendarId: 'local',
      title: 'Deep Work Block',
      description: 'Focus time - no interruptions',
      start: new Date(today.getTime() + 10 * 60 * 60 * 1000),
      end: new Date(today.getTime() + 12 * 60 * 60 * 1000),
      allDay: false,
      location: null,
      attendees: [],
      recurrenceRule: null,
      color: '#a855f7',
      voiceMemos: [],
      goalLinks: [],
      bufferBefore: 15,
      bufferAfter: 10,
      grain: 'sacred',
      isBlocked: true,
    },
    {
      externalId: null,
      provider: 'local',
      calendarId: 'local',
      title: 'Lunch with Sarah',
      description: 'Catch up at the new cafe',
      start: new Date(today.getTime() + 12.5 * 60 * 60 * 1000),
      end: new Date(today.getTime() + 13.5 * 60 * 60 * 1000),
      allDay: false,
      location: 'Corner Cafe',
      attendees: [{ email: 'sarah@example.com', name: 'Sarah', responseStatus: 'accepted', isOrganizer: false }],
      recurrenceRule: null,
      color: '#22c55e',
      voiceMemos: [],
      goalLinks: [],
      bufferBefore: null,
      bufferAfter: null,
      grain: 'shallow',
      isBlocked: false,
    },
    {
      externalId: 'google-123',
      provider: 'google',
      calendarId: 'primary',
      title: 'Product Review',
      description: 'Q1 roadmap discussion',
      start: new Date(today.getTime() + 14 * 60 * 60 * 1000),
      end: new Date(today.getTime() + 15 * 60 * 60 * 1000),
      allDay: false,
      location: 'Conference Room A',
      attendees: [],
      recurrenceRule: null,
      color: '#f59e0b',
      voiceMemos: [],
      goalLinks: [],
      bufferBefore: null,
      bufferAfter: null,
      grain: 'shallow',
      isBlocked: false,
    },
    {
      externalId: null,
      provider: 'local',
      calendarId: 'local',
      title: 'Gym',
      description: 'Leg day',
      start: new Date(today.getTime() + 18 * 60 * 60 * 1000),
      end: new Date(today.getTime() + 19 * 60 * 60 * 1000),
      allDay: false,
      location: 'Fitness Center',
      attendees: [],
      recurrenceRule: null,
      color: '#ef4444',
      voiceMemos: [],
      goalLinks: [],
      bufferBefore: null,
      bufferAfter: null,
      grain: 'sacred',
      isBlocked: true,
    },
  ];
}

function generateMockPatterns(): Pattern[] {
  const now = new Date();
  
  const trigger1: PatternTrigger = {
    type: 'time_of_day',
    conditions: { timeOfDay: 'morning' } as unknown as Record<string, unknown>,
  };
  const action1: PatternAction = { type: 'skip_suggestion', params: {} };

  const trigger2: PatternTrigger = {
    type: 'event_end',
    conditions: { energyIndicator: 'post_focus_dip' } as unknown as Record<string, unknown>,
  };
  const action2: PatternAction = { type: 'suggest_alternative', params: { suggest: 'recovery' } };

  const trigger3: PatternTrigger = {
    type: 'time_of_day',
    conditions: { dayOfWeek: 5 } as unknown as Record<string, unknown>,
  };
  const action3: PatternAction = { type: 'skip_suggestion', params: {} };

  return [
    {
      id: 'pat-1',
      description: 'You prefer not to schedule meetings before 10am',
      trigger: trigger1,
      action: action1,
      confidence: 0.85,
      confirmedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      sourceHypothesisId: 'hyp-old-1',
      applicationCount: 12,
      overridesSinceConfirm: 0,
      lastApplied: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      decayWarningIssued: false,
    },
    {
      id: 'pat-2',
      description: 'Deep work blocks work best in 2-hour chunks',
      trigger: trigger2,
      action: action2,
      confidence: 0.72,
      confirmedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      sourceHypothesisId: 'hyp-old-2',
      applicationCount: 8,
      overridesSinceConfirm: 1,
      lastApplied: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      decayWarningIssued: false,
    },
    {
      id: 'pat-3',
      description: 'Friday afternoons are protected for personal time',
      trigger: trigger3,
      action: action3,
      confidence: 0.45,
      confirmedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
      sourceHypothesisId: 'hyp-old-3',
      applicationCount: 4,
      overridesSinceConfirm: 3,
      lastApplied: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      decayWarningIssued: true,
    },
  ];
}

function generateMockHypotheses(): Hypothesis[] {
  const now = new Date();
  
  const triggerCondition: TriggerCondition = {
    suggestionType: 'gap_fill',
    contextMatchers: { timeOfDay: 'afternoon' },
  };

  return [
    {
      id: 'hyp-1',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      triggerInteractionIds: ['int-old-1', 'int-old-2', 'int-old-3'],
      observation: 'User rejected gap_fill suggestions 3x when timeOfDay=afternoon',
      hypothesis: 'You might prefer walking meetings for 1:1s',
      testApproach: 'Suggest walking meeting option for afternoon 1:1s',
      triggerCondition,
      testsRun: 3,
      confirmations: 2,
      rejections: 1,
      confidenceRequired: 3,
      status: 'testing',
      resolvedAt: null,
      resultingPatternId: null,
    },
  ];
}

function generateMockInteractions(): Interaction[] {
  const now = new Date();
  
  const baseContext: InteractionContext = {
    timeOfDay: 'afternoon',
    dayOfWeek: 1,
    dayType: 'weekday',
    currentLoad: 'moderate',
    previousTaskType: 'meeting',
    minutesSincePreviousTask: 30,
    energyIndicator: 'medium',
    recentOverrideCount: 1,
    activeGoalIds: [],
  };

  return [
    {
      id: 'int-1',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      suggestionType: 'gap_fill',
      suggestionText: 'Add "Quick break" at 3pm?',
      targetEventId: null,
      userResponse: 'accepted',
      userActionText: null,
      context: { ...baseContext },
      hypothesisId: null,
    },
    {
      id: 'int-2',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      suggestionType: 'gap_fill',
      suggestionText: 'Schedule prep time before Product Review?',
      targetEventId: 'mock-4',
      userResponse: 'rejected',
      userActionText: null,
      context: { ...baseContext },
      hypothesisId: null,
    },
    {
      id: 'int-3',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      suggestionType: 'buffer_add',
      suggestionText: 'Block 2 hours for deep work tomorrow morning?',
      targetEventId: null,
      userResponse: 'accepted',
      userActionText: null,
      context: { ...baseContext, timeOfDay: 'morning' },
      hypothesisId: null,
    },
  ];
}

function generateMockGoals(): Goal[] {
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return [
    {
      id: 'goal-1',
      text: 'Land 3 new clients by end of quarter',
      targetValue: 3,
      currentValue: 2,
      unit: 'clients',
      deadline: nextMonth,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      linkedEventIds: [],
      status: 'active',
      nudgesSent: 0,
    },
    {
      id: 'goal-2',
      text: 'Exercise 3x per week',
      targetValue: 12,
      currentValue: 8,
      unit: 'sessions',
      deadline: nextMonth,
      createdAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      linkedEventIds: [],
      status: 'active',
      nudgesSent: 0,
    },
    {
      id: 'goal-3',
      text: 'Read 2 books this month',
      targetValue: 2,
      currentValue: 1,
      unit: 'books',
      deadline: nextWeek,
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      linkedEventIds: [],
      status: 'drifting',
      nudgesSent: 1,
    },
    {
      id: 'goal-4',
      text: 'Launch MVP',
      targetValue: null,
      currentValue: 0,
      unit: null,
      deadline: null,
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      linkedEventIds: [],
      status: 'completed',
      nudgesSent: 0,
    },
  ];
}

// ============================================================================
// Intake Preview (static, non-functional)
// ============================================================================

function IntakePreview() {
  const [selectedVelocity, setSelectedVelocity] = useState<string | null>('sustainable_pace');

  const velocityOptions = [
    { value: 'high_efficiency', label: 'Fill it', description: 'Every minute is opportunity.', icon: '⚡' },
    { value: 'sustainable_pace', label: 'Protect it', description: 'Space is sacred.', icon: '🛡️' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">⏱️</div>
        <h3 className="text-xl font-bold">Welcome to Chronos</h3>
        <p className="text-sm text-ink/60">60-second calibration preview</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-ink/80">
          30 minutes just opened up. What's your instinct?
        </p>
        {velocityOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`
              w-full text-left p-4 rounded-xl border-2 transition-all duration-200
              ${selectedVelocity === option.value
                ? 'border-accent bg-accent/10 shadow-md'
                : 'border-border bg-surface hover:border-accent/50'
              }
            `}
            onClick={() => setSelectedVelocity(option.value)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div>
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm text-ink/60">{option.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Section Wrapper
// ============================================================================

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="border-b border-border pb-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-ink/50">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

// ============================================================================
// Main Showcase Page
// ============================================================================

export function ShowcasePage() {
  const themeId = useUserStore((s) => s.themeId);
  const [mockDataLoaded, setMockDataLoaded] = useState(false);

  // Apply theme
  useEffect(() => {
    document.body.dataset.theme = themeId ?? 'moonlit';
  }, [themeId]);

  // Load mock data into stores for preview
  useEffect(() => {
    if (mockDataLoaded) return;

    const eventsStore = useEventsStore.getState();
    const ralphStore = useRalphStore.getState();

    // Only add mock events if store is empty
    if (eventsStore.events.length === 0) {
      const mockEvents = generateMockEvents();
      mockEvents.forEach((event) => {
        eventsStore.createEvent(event);
      });
    }

    // Add mock Ralph data if empty
    const currentPatterns = ralphStore.patterns;
    const currentHypotheses = ralphStore.hypotheses;
    const currentInteractions = ralphStore.interactions;

    if (currentPatterns.length === 0 && currentHypotheses.length === 0 && currentInteractions.length === 0) {
      // Directly set state for preview
      useRalphStore.setState({
        patterns: generateMockPatterns(),
        hypotheses: generateMockHypotheses(),
        interactions: generateMockInteractions(),
      });
    }

    // Add mock goals if empty
    const userStore = useUserStore.getState();
    if (userStore.goals.length === 0) {
      const mockGoals = generateMockGoals();
      mockGoals.forEach((goal) => {
        userStore.addGoal(goal);
      });
    }

    setMockDataLoaded(true);
  }, [mockDataLoaded]);

  const themes = useMemo(() => ['moonlit', 'sepia', 'warm', 'cool', 'fun'], []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chronos UI Showcase</h1>
            <p className="text-sm text-ink/50">Component gallery preview</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-accent hover:underline"
            >
              ← Back to App
            </a>
            <ThemeSelector />
          </div>
        </div>
      </header>

      {/* Theme Quick Switch */}
      <div className="bg-surface/50 border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center gap-3">
          <span className="text-sm text-ink/50">Quick theme:</span>
          <div className="flex gap-1">
            {themes.map((theme) => (
              <button
                key={theme}
                type="button"
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  themeId === theme
                    ? 'bg-accent text-white'
                    : 'bg-ink/5 hover:bg-ink/10'
                }`}
                onClick={() => useUserStore.getState().setThemeId(theme as 'moonlit' | 'sepia' | 'warm' | 'cool' | 'fun')}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl p-6 space-y-12">
        {/* Intake Flow Preview */}
        <Section
          title="Intake Flow"
          description="60-second onboarding calibration cards"
        >
          <div className="max-w-md mx-auto">
            <IntakePreview />
          </div>
        </Section>

        {/* Time GPS / Timeline */}
        <Section
          title="Time GPS"
          description="Zoomable timeline from year down to 15-minute focus view"
        >
          <TimelineView />
        </Section>

        {/* Voice Input */}
        <Section
          title="Voice Input"
          description="Speech recognition, intent classification, and voice memos"
        >
          <VoicePanel />
        </Section>

        {/* Ralph Learning */}
        <Section
          title="Ralph AI"
          description="Pattern learning and transparency panel"
        >
          <RalphTransparency />
        </Section>

        {/* Bouncer Notifications */}
        <Section
          title="Bouncer"
          description="Notification filtering and lobby queue"
        >
          <BouncerPanel />
        </Section>

        {/* Summary Panel */}
        <Section
          title="Temporal Summaries"
          description="AI-generated daily, weekly, monthly overviews"
        >
          <SummaryPanel />
        </Section>

        {/* Goals Panel */}
        <Section
          title="Goals"
          description="CRUD interface with progress tracking"
        >
          <GoalsPanel />
        </Section>

        {/* Data Management */}
        <Section
          title="Data Management"
          description="Export/import for offline-first data portability"
        >
          <DataManagement />
        </Section>

        {/* Encryption */}
        <Section
          title="Encryption"
          description="Client-side encryption for sensitive data"
        >
          <EncryptionSetup />
        </Section>

        {/* Coaching */}
        <Section
          title="Coaching Conversations"
          description="AI coaching for goal support"
        >
          <CoachingPanel />
        </Section>

        {/* Loading States */}
        <Section
          title="Loading & Empty States"
          description="Consistent UI states across the app"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Loading States</h4>
              <div className="flex items-center gap-4">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
              <LoadingInline message="Loading data..." />
              <SkeletonList count={2} />
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Empty States</h4>
              <EmptyGoals />
              <ErrorState message="Something went wrong" onRetry={() => alert('Retry clicked')} />
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border text-sm text-ink/40">
          <p>Chronos Life Operating System — UI Showcase</p>
          <p className="mt-1">All components shown with mock data for preview</p>
        </footer>
      </main>
    </div>
  );
}
