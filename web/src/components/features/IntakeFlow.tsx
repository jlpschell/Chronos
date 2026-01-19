// ============================================================================
// IntakeFlow Component
// Enhanced onboarding calibration flow with 7 questions
// ============================================================================

import { useCallback, useState } from 'react';
import type {
  Velocity,
  Geometry,
  Constellation,
  Chronotype,
  BufferPreference,
  StressResponse,
  MotivationStyle,
  Persona,
} from '../../types';
import { useUserStore } from '../../stores/user.store';
import { useVoice } from '../../hooks/useVoice';

// ----------------------------------------------------------------------------
// Step Option Types
// ----------------------------------------------------------------------------

interface StepOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon: string;
  impact?: string; // What this choice affects
}

// ----------------------------------------------------------------------------
// Question Options
// ----------------------------------------------------------------------------

const VELOCITY_OPTIONS: StepOption<Velocity>[] = [
  {
    value: 'high_efficiency',
    label: 'Fill it',
    description: 'Every minute is opportunity. I optimize for productivity.',
    icon: '⚡',
    impact: 'AI will be more direct, suggest filling gaps',
  },
  {
    value: 'sustainable_pace',
    label: 'Protect it',
    description: 'Space is sacred. I guard my breathing room.',
    icon: '🛡️',
    impact: 'AI will be more gentle, protect your buffers',
  },
];

const GEOMETRY_OPTIONS: StepOption<Geometry>[] = [
  {
    value: 'linear_horizon',
    label: 'Path forward',
    description: 'Time flows like a river toward my goals.',
    icon: '→',
    impact: 'Timeline view emphasizes progress toward milestones',
  },
  {
    value: 'radial_watchface',
    label: 'Rhythm & cycle',
    description: 'Time moves in patterns—seasons, weeks, days.',
    icon: '◐',
    impact: 'Timeline view emphasizes recurring patterns and routines',
  },
];

const CONSTELLATION_OPTIONS: StepOption<Constellation>[] = [
  {
    value: 'solo_pilot',
    label: 'Just me',
    description: 'My calendar is my own.',
    icon: '🚀',
    impact: 'Suggestions focus on your personal optimization',
  },
  {
    value: 'co_pilot',
    label: 'Partner',
    description: 'I coordinate closely with one other person.',
    icon: '👥',
    impact: 'Suggestions consider shared scheduling',
  },
  {
    value: 'crew_captain',
    label: 'Family or team',
    description: 'Multiple schedules intersect with mine.',
    icon: '🌐',
    impact: 'Suggestions account for complex coordination',
  },
];

const CHRONOTYPE_OPTIONS: StepOption<Chronotype>[] = [
  {
    value: 'early_bird',
    label: 'Early bird',
    description: "I'm sharpest in the morning. Evenings are for winding down.",
    icon: '🌅',
    impact: 'Peak hours: 6-10am, scheduling prefers mornings',
  },
  {
    value: 'night_owl',
    label: 'Night owl',
    description: 'I hit my stride later. Mornings are for coffee.',
    icon: '🦉',
    impact: 'Peak hours: 8pm-12am, scheduling prefers evenings',
  },
  {
    value: 'flexible',
    label: 'Flexible',
    description: "I can be productive anytime if I'm in the zone.",
    icon: '🔄',
    impact: 'Peak hours adapt to your patterns',
  },
];

const BUFFER_OPTIONS: StepOption<BufferPreference>[] = [
  {
    value: 'packed',
    label: 'Back-to-back is fine',
    description: "I thrive in a packed schedule. Momentum keeps me going.",
    icon: '📦',
    impact: '5 min buffers, fluid bouncer mode',
  },
  {
    value: 'breathing_room',
    label: 'Some breathing room',
    description: 'A few minutes between things helps me reset.',
    icon: '🌿',
    impact: '15 min buffers, balanced notifications',
  },
  {
    value: 'generous_gaps',
    label: 'Generous gaps',
    description: 'I need space to think and transition.',
    icon: '🏔️',
    impact: '30 min buffers, strict bouncer mode',
  },
];

const STRESS_RESPONSE_OPTIONS: StepOption<StressResponse>[] = [
  {
    value: 'more_structure',
    label: 'More structure',
    description: 'When stressed, I want clear tasks and a plan.',
    icon: '📋',
    impact: 'AI gives direct instructions and clear next steps',
  },
  {
    value: 'more_space',
    label: 'More space',
    description: 'When stressed, I need room to breathe and think.',
    icon: '💨',
    impact: 'AI asks questions and supports without pressure',
  },
];

const MOTIVATION_OPTIONS: StepOption<MotivationStyle>[] = [
  {
    value: 'streaks',
    label: 'Streaks',
    description: "Don't break the chain! Consistency is my superpower.",
    icon: '🔥',
    impact: 'Gamification emphasizes daily streaks',
  },
  {
    value: 'milestones',
    label: 'Milestones',
    description: 'Big wins matter more than daily grind.',
    icon: '🏆',
    impact: 'Gamification emphasizes goal completion',
  },
  {
    value: 'both',
    label: 'Both',
    description: 'I like tracking progress AND celebrating achievements.',
    icon: '⭐',
    impact: 'Mixed gamification approach',
  },
];

// ----------------------------------------------------------------------------
// Question Configuration
// ----------------------------------------------------------------------------

interface QuestionConfig {
  id: string;
  title: string;
  question: string;
  voiceQuestion?: string;
}

const QUESTIONS: QuestionConfig[] = [
  {
    id: 'velocity',
    title: 'Your Pace',
    question: '30 minutes just opened up. What\'s your instinct?',
    voiceQuestion: 'Thirty minutes just opened up unexpectedly. What\'s your instinct?',
  },
  {
    id: 'geometry',
    title: 'Your View',
    question: 'When you picture time, how do you see it?',
  },
  {
    id: 'constellation',
    title: 'Your Orbit',
    question: 'Who shares your schedule?',
  },
  {
    id: 'chronotype',
    title: 'Your Energy',
    question: 'When are you at your best?',
    voiceQuestion: 'When during the day are you at your best?',
  },
  {
    id: 'buffer',
    title: 'Your Buffer',
    question: 'How do you feel about back-to-back meetings?',
  },
  {
    id: 'stress',
    title: 'Under Pressure',
    question: 'When stressed, what do you need more of?',
    voiceQuestion: "When you're feeling stressed, what do you need more of?",
  },
  {
    id: 'motivation',
    title: 'Your Fuel',
    question: 'What motivates you to keep going?',
  },
];

// ----------------------------------------------------------------------------
// Choice Card Component
// ----------------------------------------------------------------------------

interface ChoiceCardProps<T extends string> {
  option: StepOption<T>;
  selected: boolean;
  onSelect: (value: T) => void;
  showImpact?: boolean;
}

function ChoiceCard<T extends string>({
  option,
  selected,
  onSelect,
  showImpact = false,
}: ChoiceCardProps<T>) {
  return (
    <button
      type="button"
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-all duration-200
        ${selected
          ? 'border-accent bg-accent/10 shadow-md'
          : 'border-border bg-surface hover:border-accent/50 hover:bg-accent/5'
        }
      `}
      onClick={() => onSelect(option.value)}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{option.icon}</span>
        <div className="flex-1">
          <div className="font-semibold text-ink">{option.label}</div>
          <div className="text-sm text-ink/60 mt-1">{option.description}</div>
          {showImpact && option.impact && (
            <div className="text-xs text-accent mt-2 flex items-center gap-1">
              <span>→</span>
              <span>{option.impact}</span>
            </div>
          )}
        </div>
        {selected && (
          <span className="text-accent text-xl">✓</span>
        )}
      </div>
    </button>
  );
}

// ----------------------------------------------------------------------------
// Welcome Step
// ----------------------------------------------------------------------------

interface WelcomeStepProps {
  onStart: () => void;
}

function WelcomeStep({ onStart }: WelcomeStepProps) {
  const { speakText, hasWebSpeech } = useVoice();
  const [hasSpoken, setHasSpoken] = useState(false);

  const handleSpeak = useCallback(() => {
    if (hasWebSpeech && !hasSpoken) {
      speakText("Welcome to Chronos. I'm going to ask you seven quick questions to understand how you think about time. There are no wrong answers.");
      setHasSpoken(true);
    }
  }, [hasWebSpeech, hasSpoken, speakText]);

  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <div className="text-6xl mb-4">⏱️</div>
        <h1 className="text-3xl font-bold text-ink">Welcome to Chronos</h1>
        <p className="text-lg text-ink/70">Let's calibrate your experience</p>
      </div>

      <div className="bg-surface/50 rounded-xl p-6 max-w-md mx-auto space-y-4">
        <p className="text-ink/80">
          Seven quick questions will help me understand how you think about time.
          There are no wrong answers—just go with your gut.
        </p>
        <p className="text-sm text-ink/60">
          You'll see a summary at the end and can adjust any answer.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="px-8 py-4 text-lg font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors"
          onClick={onStart}
        >
          Let's go
        </button>

        {hasWebSpeech && (
          <button
            type="button"
            className="block mx-auto text-sm text-ink/50 hover:text-accent transition-colors"
            onClick={handleSpeak}
          >
            🔊 {hasSpoken ? 'Replay audio' : 'Listen to intro'}
          </button>
        )}
      </div>

      <p className="text-xs text-ink/40">Takes about 2 minutes</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Question Step
// ----------------------------------------------------------------------------

interface QuestionStepProps<T extends string> {
  config: QuestionConfig;
  options: StepOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  onNext: () => void;
  onBack?: () => void;
  stepNumber: number;
  totalSteps: number;
}

function QuestionStep<T extends string>({
  config,
  options,
  value,
  onChange,
  onNext,
  onBack,
  stepNumber,
  totalSteps,
}: QuestionStepProps<T>) {
  const { speakText, hasWebSpeech } = useVoice();

  const handleSpeak = useCallback(() => {
    speakText(config.voiceQuestion || config.question);
  }, [speakText, config]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-accent font-medium">
            Question {stepNumber} of {totalSteps}
          </span>
          {hasWebSpeech && (
            <button
              type="button"
              className="text-ink/40 hover:text-accent transition-colors"
              onClick={handleSpeak}
            >
              🔊 Listen
            </button>
          )}
        </div>
        <h2 className="text-2xl font-bold text-ink">{config.title}</h2>
        <p className="text-lg text-ink/70">{config.question}</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            option={option}
            selected={value === option.value}
            onSelect={onChange}
            showImpact={true}
          />
        ))}
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-ink/5 transition-colors"
              onClick={onBack}
            >
              ← Back
            </button>
          )}
          <div className="flex gap-1 ml-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < stepNumber ? 'bg-accent' : i === stepNumber - 1 ? 'bg-accent' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="px-6 py-3 font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          onClick={onNext}
          disabled={!value}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Confirmation Step
// ----------------------------------------------------------------------------

interface ConfirmationStepProps {
  velocity: Velocity;
  geometry: Geometry;
  constellation: Constellation;
  chronotype: Chronotype;
  bufferPreference: BufferPreference;
  stressResponse: StressResponse;
  motivationStyle: MotivationStyle;
  derivedPersona: Persona;
  onConfirm: () => void;
  onEditQuestion: (questionId: string) => void;
}

function ConfirmationStep({
  velocity,
  geometry,
  constellation,
  chronotype,
  bufferPreference,
  stressResponse,
  motivationStyle,
  derivedPersona,
  onConfirm,
  onEditQuestion,
}: ConfirmationStepProps) {
  const { speakText, hasWebSpeech } = useVoice();

  const handleSpeak = useCallback(() => {
    const personaLabel = derivedPersona === 'shop_foreman' ? 'Shop Foreman' : 'Supportive Peer';
    speakText(`Perfect. Based on your answers, I'll be your ${personaLabel}. Review your choices below and confirm when ready.`);
  }, [speakText, derivedPersona]);

  // Build summary items
  const summaryItems = [
    {
      id: 'velocity',
      label: 'Pace',
      value: velocity === 'high_efficiency' ? '⚡ Efficiency-focused' : '🛡️ Sustainable pace',
    },
    {
      id: 'geometry',
      label: 'Time view',
      value: geometry === 'linear_horizon' ? '→ Linear (goals)' : '◐ Cyclical (rhythms)',
    },
    {
      id: 'constellation',
      label: 'Calendar',
      value: constellation === 'solo_pilot' ? '🚀 Solo' : constellation === 'co_pilot' ? '👥 Partner' : '🌐 Team',
    },
    {
      id: 'chronotype',
      label: 'Energy',
      value: chronotype === 'early_bird' ? '🌅 Early bird' : chronotype === 'night_owl' ? '🦉 Night owl' : '🔄 Flexible',
    },
    {
      id: 'buffer',
      label: 'Buffer',
      value: bufferPreference === 'packed' ? '📦 Minimal' : bufferPreference === 'breathing_room' ? '🌿 Moderate' : '🏔️ Generous',
    },
    {
      id: 'stress',
      label: 'Under pressure',
      value: stressResponse === 'more_structure' ? '📋 More structure' : '💨 More space',
    },
    {
      id: 'motivation',
      label: 'Motivation',
      value: motivationStyle === 'streaks' ? '🔥 Streaks' : motivationStyle === 'milestones' ? '🏆 Milestones' : '⭐ Both',
    },
  ];

  const personaEmoji = derivedPersona === 'shop_foreman' ? '👷' : '🤝';
  const personaLabel = derivedPersona === 'shop_foreman' ? 'Shop Foreman' : 'Supportive Peer';
  const personaDescription = derivedPersona === 'shop_foreman'
    ? 'Direct, efficient, action-oriented'
    : 'Warm, empathetic, supportive';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-2xl font-bold text-ink">Your Chronos Profile</h2>
        <p className="text-ink/70">Review and adjust if needed</p>
        {hasWebSpeech && (
          <button
            type="button"
            className="text-sm text-ink/40 hover:text-accent transition-colors"
            onClick={handleSpeak}
          >
            🔊 Listen
          </button>
        )}
      </div>

      {/* AI Persona Card */}
      <div className="bg-accent/10 border-2 border-accent rounded-xl p-4 text-center">
        <div className="text-3xl mb-2">{personaEmoji}</div>
        <div className="font-semibold text-accent text-lg">{personaLabel}</div>
        <div className="text-sm text-ink/70">{personaDescription}</div>
      </div>

      {/* Summary Grid */}
      <div className="bg-surface rounded-xl divide-y divide-border">
        {summaryItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3">
            <span className="text-ink/60 text-sm">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{item.value}</span>
              <button
                type="button"
                className="text-xs text-accent hover:underline"
                onClick={() => onEditQuestion(item.id)}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Button */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          className="w-full px-6 py-4 font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors"
          onClick={onConfirm}
        >
          Looks good — let's go!
        </button>
        <p className="text-xs text-center text-ink/40">
          You can change these anytime in Settings
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main IntakeFlow Component
// ----------------------------------------------------------------------------

type IntakeStep = 'welcome' | 'velocity' | 'geometry' | 'constellation' | 'chronotype' | 'buffer' | 'stress' | 'motivation' | 'confirm';

const STEP_ORDER: IntakeStep[] = ['welcome', 'velocity', 'geometry', 'constellation', 'chronotype', 'buffer', 'stress', 'motivation', 'confirm'];

function getQuestionIndex(step: IntakeStep): number {
  const idx = STEP_ORDER.indexOf(step);
  return idx > 0 ? idx : 0;
}

export function IntakeFlow() {
  const {
    velocity,
    geometry,
    constellation,
    chronotype,
    bufferPreference,
    stressResponse,
    motivationStyle,
    persona,
    setVelocity,
    setGeometry,
    setConstellation,
    setChronotype,
    setBufferPreference,
    setStressResponse,
    setMotivationStyle,
    completeIntake,
    resetIntake,
  } = useUserStore();

  const [step, setStep] = useState<IntakeStep>('welcome');

  // Derive persona based on current answers
  const derivedPersona: Persona = (() => {
    if (!velocity) return 'supportive_peer';
    if (velocity === 'high_efficiency') {
      return stressResponse === 'more_space' ? 'supportive_peer' : 'shop_foreman';
    } else {
      return stressResponse === 'more_structure' ? 'shop_foreman' : 'supportive_peer';
    }
  })();

  const goToStep = useCallback((targetStep: IntakeStep) => {
    setStep(targetStep);
  }, []);

  const handleNext = useCallback(() => {
    const currentIdx = STEP_ORDER.indexOf(step);
    if (currentIdx < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[currentIdx + 1]);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    const currentIdx = STEP_ORDER.indexOf(step);
    if (currentIdx > 1) { // Don't go back to welcome
      setStep(STEP_ORDER[currentIdx - 1]);
    }
  }, [step]);

  const handleEditQuestion = useCallback((questionId: string) => {
    const stepMap: Record<string, IntakeStep> = {
      velocity: 'velocity',
      geometry: 'geometry',
      constellation: 'constellation',
      chronotype: 'chronotype',
      buffer: 'buffer',
      stress: 'stress',
      motivation: 'motivation',
    };
    if (stepMap[questionId]) {
      setStep(stepMap[questionId]);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    completeIntake();
  }, [completeIntake]);

  const handleReset = useCallback(() => {
    resetIntake();
    setStep('welcome');
  }, [resetIntake]);

  const totalQuestions = 7;

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {step === 'welcome' && <WelcomeStep onStart={() => goToStep('velocity')} />}

        {step === 'velocity' && (
          <QuestionStep
            config={QUESTIONS[0]}
            options={VELOCITY_OPTIONS}
            value={velocity}
            onChange={setVelocity}
            onNext={handleNext}
            stepNumber={1}
            totalSteps={totalQuestions}
          />
        )}

        {step === 'geometry' && (
          <QuestionStep
            config={QUESTIONS[1]}
            options={GEOMETRY_OPTIONS}
            value={geometry}
            onChange={setGeometry}
            onNext={handleNext}
            onBack={handleBack}
            stepNumber={2}
            totalSteps={totalQuestions}
          />
        )}

        {step === 'constellation' && (
          <QuestionStep
            config={QUESTIONS[2]}
            options={CONSTELLATION_OPTIONS}
            value={constellation}
            onChange={setConstellation}
            onNext={handleNext}
            onBack={handleBack}
            stepNumber={3}
            totalSteps={totalQuestions}
          />
        )}

        {step === 'chronotype' && (
          <QuestionStep
            config={QUESTIONS[3]}
            options={CHRONOTYPE_OPTIONS}
            value={chronotype}
            onChange={setChronotype}
            onNext={handleNext}
            onBack={handleBack}
            stepNumber={4}
            totalSteps={totalQuestions}
          />
        )}

        {step === 'buffer' && (
          <QuestionStep
            config={QUESTIONS[4]}
            options={BUFFER_OPTIONS}
            value={bufferPreference}
            onChange={setBufferPreference}
            onNext={handleNext}
            onBack={handleBack}
            stepNumber={5}
            totalSteps={totalQuestions}
          />
        )}

        {step === 'stress' && (
          <QuestionStep
            config={QUESTIONS[5]}
            options={STRESS_RESPONSE_OPTIONS}
            value={stressResponse}
            onChange={setStressResponse}
            onNext={handleNext}
            onBack={handleBack}
            stepNumber={6}
            totalSteps={totalQuestions}
          />
        )}

        {step === 'motivation' && (
          <QuestionStep
            config={QUESTIONS[6]}
            options={MOTIVATION_OPTIONS}
            value={motivationStyle}
            onChange={setMotivationStyle}
            onNext={handleNext}
            onBack={handleBack}
            stepNumber={7}
            totalSteps={totalQuestions}
          />
        )}

        {step === 'confirm' && velocity && geometry && constellation && chronotype && bufferPreference && stressResponse && motivationStyle && (
          <ConfirmationStep
            velocity={velocity}
            geometry={geometry}
            constellation={constellation}
            chronotype={chronotype}
            bufferPreference={bufferPreference}
            stressResponse={stressResponse}
            motivationStyle={motivationStyle}
            derivedPersona={derivedPersona}
            onConfirm={handleConfirm}
            onEditQuestion={handleEditQuestion}
          />
        )}
      </div>
    </div>
  );
}
