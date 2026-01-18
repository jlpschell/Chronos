// ============================================================================
// IntakeFlow Component
// 60-second onboarding calibration flow
// ============================================================================

import { useCallback, useState, useEffect } from 'react';
import type { Velocity, Geometry, Constellation } from '../../types';
import { useUserStore } from '../../stores/user.store';
import { useVoice } from '../../hooks/useVoice';

// ----------------------------------------------------------------------------
// Step Content
// ----------------------------------------------------------------------------

interface StepOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon: string;
}

const VELOCITY_OPTIONS: StepOption<Velocity>[] = [
  {
    value: 'high_efficiency',
    label: 'Fill it',
    description: 'Every minute is opportunity. I optimize for productivity.',
    icon: '⚡',
  },
  {
    value: 'sustainable_pace',
    label: 'Protect it',
    description: 'Space is sacred. I guard my breathing room.',
    icon: '🛡️',
  },
];

const GEOMETRY_OPTIONS: StepOption<Geometry>[] = [
  {
    value: 'linear_horizon',
    label: 'Path forward',
    description: 'Time flows like a river toward my goals.',
    icon: '→',
  },
  {
    value: 'radial_watchface',
    label: 'Rhythm & cycle',
    description: 'Time moves in patterns—seasons, weeks, days.',
    icon: '◐',
  },
];

const CONSTELLATION_OPTIONS: StepOption<Constellation>[] = [
  {
    value: 'solo_pilot',
    label: 'Just me',
    description: 'My calendar is my own.',
    icon: '🚀',
  },
  {
    value: 'co_pilot',
    label: 'Partner',
    description: 'I coordinate closely with one other person.',
    icon: '👥',
  },
  {
    value: 'crew_captain',
    label: 'Family or team',
    description: 'Multiple schedules intersect with mine.',
    icon: '🌐',
  },
];

// ----------------------------------------------------------------------------
// Step Components
// ----------------------------------------------------------------------------

interface ChoiceCardProps<T extends string> {
  option: StepOption<T>;
  selected: boolean;
  onSelect: (value: T) => void;
}

function ChoiceCard<T extends string>({ option, selected, onSelect }: ChoiceCardProps<T>) {
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
        <div>
          <div className="font-semibold text-ink">{option.label}</div>
          <div className="text-sm text-ink/60 mt-1">{option.description}</div>
        </div>
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

  useEffect(() => {
    if (hasWebSpeech) {
      speakText("Welcome to Chronos. I'm going to ask you three quick questions to understand how you think about time.");
    }
  }, [hasWebSpeech, speakText]);

  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <div className="text-6xl mb-4">⏱️</div>
        <h1 className="text-3xl font-bold text-ink">Welcome to Chronos</h1>
        <p className="text-lg text-ink/70">Let's calibrate in 60 seconds</p>
      </div>

      <div className="bg-surface/50 rounded-xl p-6 max-w-md mx-auto">
        <p className="text-ink/80">
          Three quick questions will help me understand how you think about time.
          There are no wrong answers—just go with your gut.
        </p>
      </div>

      <button
        type="button"
        className="px-8 py-4 text-lg font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors"
        onClick={onStart}
      >
        Let's go
      </button>

      <p className="text-xs text-ink/40">Takes about 60 seconds</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Question Steps
// ----------------------------------------------------------------------------

interface QuestionStepProps<T extends string> {
  title: string;
  question: string;
  options: StepOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  onNext: () => void;
  stepNumber: number;
  totalSteps: number;
}

function QuestionStep<T extends string>({
  title,
  question,
  options,
  value,
  onChange,
  onNext,
  stepNumber,
  totalSteps,
}: QuestionStepProps<T>) {
  const { speakText, hasWebSpeech } = useVoice();

  useEffect(() => {
    if (hasWebSpeech) {
      speakText(question);
    }
  }, [hasWebSpeech, question, speakText]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="text-sm text-accent font-medium">
          Question {stepNumber} of {totalSteps}
        </div>
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        <p className="text-lg text-ink/70">{question}</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            option={option}
            selected={value === option.value}
            onSelect={onChange}
          />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < stepNumber ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
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
  persona: 'shop_foreman' | 'supportive_peer' | null;
  onConfirm: () => void;
  onReset: () => void;
}

function ConfirmationStep({
  velocity,
  geometry,
  constellation,
  persona,
  onConfirm,
  onReset,
}: ConfirmationStepProps) {
  const { speakText, hasWebSpeech } = useVoice();

  const velocityLabel = velocity === 'high_efficiency' ? 'efficiency-focused' : 'rhythm-conscious';
  const geometryLabel = geometry === 'linear_horizon' ? 'linear' : 'cyclical';
  const constellationLabel =
    constellation === 'solo_pilot'
      ? 'solo'
      : constellation === 'co_pilot'
      ? 'partnered'
      : 'team';
  const personaLabel = persona === 'shop_foreman' ? 'Shop Foreman' : 'Supportive Peer';

  useEffect(() => {
    if (hasWebSpeech) {
      speakText(`Perfect. You're ${velocityLabel} with a ${geometryLabel} view of time and a ${constellationLabel} calendar. I'll be your ${personaLabel}.`);
    }
  }, [hasWebSpeech, speakText, velocityLabel, geometryLabel, constellationLabel, personaLabel]);

  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-2xl font-bold text-ink">Calibration Complete</h2>
        <p className="text-ink/70">Here's what I learned about you:</p>
      </div>

      <div className="bg-surface rounded-xl p-6 space-y-4 text-left max-w-md mx-auto">
        <div className="flex justify-between">
          <span className="text-ink/60">Pace</span>
          <span className="font-medium text-ink capitalize">{velocityLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Time view</span>
          <span className="font-medium text-ink capitalize">{geometryLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink/60">Calendar</span>
          <span className="font-medium text-ink capitalize">{constellationLabel}</span>
        </div>
        <div className="border-t border-border my-4" />
        <div className="flex justify-between">
          <span className="text-ink/60">Your AI persona</span>
          <span className="font-semibold text-accent">{personaLabel}</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="w-full max-w-md px-6 py-4 font-semibold rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors"
          onClick={onConfirm}
        >
          Looks right — let's go!
        </button>
        <button
          type="button"
          className="w-full max-w-md px-6 py-3 text-sm rounded-xl border border-border hover:bg-ink/5 transition-colors"
          onClick={onReset}
        >
          Start over
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main IntakeFlow Component
// ----------------------------------------------------------------------------

type IntakeStep = 'welcome' | 'velocity' | 'geometry' | 'constellation' | 'confirm';

export function IntakeFlow() {
  const {
    velocity,
    geometry,
    constellation,
    persona,
    onboardingStep,
    setVelocity,
    setGeometry,
    setConstellation,
    completeIntake,
    resetIntake,
  } = useUserStore();

  // Determine current step from store state
  const getInitialStep = (): IntakeStep => {
    if (onboardingStep >= 3 && velocity && geometry && constellation) return 'confirm';
    if (onboardingStep >= 2 && velocity && geometry) return 'constellation';
    if (onboardingStep >= 1 && velocity) return 'geometry';
    if (onboardingStep > 0) return 'velocity';
    return 'welcome';
  };

  const [step, setStep] = useState<IntakeStep>(getInitialStep);

  const handleStart = useCallback(() => setStep('velocity'), []);

  const handleVelocity = useCallback(
    (v: Velocity) => {
      setVelocity(v);
    },
    [setVelocity]
  );

  const handleGeometry = useCallback(
    (g: Geometry) => {
      setGeometry(g);
    },
    [setGeometry]
  );

  const handleConstellation = useCallback(
    (c: Constellation) => {
      setConstellation(c);
    },
    [setConstellation]
  );

  const handleConfirm = useCallback(() => {
    completeIntake();
  }, [completeIntake]);

  const handleReset = useCallback(() => {
    resetIntake();
    setStep('welcome');
  }, [resetIntake]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {step === 'welcome' && <WelcomeStep onStart={handleStart} />}

        {step === 'velocity' && (
          <QuestionStep
            title="Your Pace"
            question="30 minutes just opened up unexpectedly. What's your instinct?"
            options={VELOCITY_OPTIONS}
            value={velocity}
            onChange={handleVelocity}
            onNext={() => setStep('geometry')}
            stepNumber={1}
            totalSteps={3}
          />
        )}

        {step === 'geometry' && (
          <QuestionStep
            title="Your View"
            question="When you picture time, how do you see it?"
            options={GEOMETRY_OPTIONS}
            value={geometry}
            onChange={handleGeometry}
            onNext={() => setStep('constellation')}
            stepNumber={2}
            totalSteps={3}
          />
        )}

        {step === 'constellation' && (
          <QuestionStep
            title="Your Orbit"
            question="Who shares your schedule?"
            options={CONSTELLATION_OPTIONS}
            value={constellation}
            onChange={handleConstellation}
            onNext={() => setStep('confirm')}
            stepNumber={3}
            totalSteps={3}
          />
        )}

        {step === 'confirm' && velocity && geometry && constellation && (
          <ConfirmationStep
            velocity={velocity}
            geometry={geometry}
            constellation={constellation}
            persona={persona}
            onConfirm={handleConfirm}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
