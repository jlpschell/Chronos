// ============================================================================
// CoachingPanel Component
// AI coaching conversations for goal support
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

import { useUserStore } from '../../stores/user.store';
import { PERSONA_PROMPTS } from '../../lib/config';
import type { Goal, Persona } from '../../types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CoachingPanelProps {
  goal?: Goal;
  onClose?: () => void;
}

// ----------------------------------------------------------------------------
// Coaching Prompts
// ----------------------------------------------------------------------------

function getCoachingPrompt(persona: Persona, goal?: Goal): string {
  const basePrompt = PERSONA_PROMPTS[persona];
  
  const goalContext = goal
    ? `\n\nThe user is working on this goal: "${goal.text}"
Current progress: ${goal.currentValue}${goal.targetValue ? ` / ${goal.targetValue}` : ''}${goal.unit ? ` ${goal.unit}` : ''}
Status: ${goal.status}
${goal.deadline ? `Deadline: ${new Date(goal.deadline).toLocaleDateString()}` : 'No deadline set'}
${goal.status === 'drifting' ? '\nNote: This goal has been inactive for a while.' : ''}`
    : '';

  return `${basePrompt}${goalContext}

You are having a coaching conversation. Keep responses concise (2-3 sentences max unless the user asks for more detail). Focus on:
- Understanding blockers
- Suggesting next actions
- Celebrating progress
- Adjusting goals when needed

Never be preachy or lecture. Be a supportive partner.`;
}

// ----------------------------------------------------------------------------
// Quick Actions
// ----------------------------------------------------------------------------

const QUICK_ACTIONS = [
  { label: "What's blocking me?", prompt: "I'm feeling stuck. What might be blocking me from making progress?" },
  { label: 'Celebrate a win', prompt: "I made some progress! Can we celebrate that?" },
  { label: 'Adjust my goal', prompt: "I'm thinking about adjusting this goal. Can you help me think through it?" },
  { label: "What's next?", prompt: "What should I focus on next to make progress?" },
];

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function CoachingPanel({ goal, onClose }: CoachingPanelProps) {
  const persona = useUserStore((s) => s.persona) ?? 'supportive_peer';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initial greeting
  useEffect(() => {
    const greeting = getInitialGreeting(persona, goal);
    setMessages([
      {
        id: 'greeting',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      },
    ]);
  }, [persona, goal]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        // Simulate AI response (in production, this would call OpenRouter)
        const response = await simulateCoachingResponse(persona, content, goal, messages);

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Coaching error:', error);
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: "I'm having trouble responding right now. Let's try again in a moment.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [persona, goal, messages]
  );

  const handleQuickAction = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  return (
    <div className="flex flex-col h-[500px] rounded-lg border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-canvas">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {persona === 'shop_foreman' ? '👷' : '🤝'}
          </span>
          <div>
            <h3 className="text-sm font-semibold">
              {persona === 'shop_foreman' ? 'Shop Foreman' : 'Supportive Peer'}
            </h3>
            {goal && (
              <p className="text-xs text-ink/50 truncate max-w-[200px]">
                Re: {goal.text}
              </p>
            )}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="text-ink/40 hover:text-ink transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-ink/5 text-ink'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-ink/5 rounded-lg px-3 py-2 text-sm text-ink/50">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-border bg-canvas/50">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                className="px-3 py-1 text-xs rounded-full bg-ink/5 hover:bg-ink/10 transition-colors"
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-canvas text-sm"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 disabled:opacity-50"
            disabled={!input.trim() || isLoading}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function getInitialGreeting(persona: Persona, goal?: Goal): string {
  if (goal) {
    if (goal.status === 'drifting') {
      return persona === 'shop_foreman'
        ? `I noticed "${goal.text}" has been quiet. What's getting in the way?`
        : `Hey, I see "${goal.text}" hasn't had activity lately. No judgment—life happens. What's going on?`;
    }

    if (goal.targetValue && goal.currentValue >= goal.targetValue * 0.8) {
      return persona === 'shop_foreman'
        ? `You're at ${Math.round((goal.currentValue / goal.targetValue) * 100)}% on "${goal.text}". Final push—what's the plan?`
        : `Wow, you're so close on "${goal.text}"! How are you feeling about the home stretch?`;
    }

    return persona === 'shop_foreman'
      ? `Let's talk about "${goal.text}". Where are you at?`
      : `I'm here to help with "${goal.text}". What's on your mind?`;
  }

  return persona === 'shop_foreman'
    ? "What do you want to work on? Let's make it happen."
    : "Hey! I'm here whenever you want to talk through something. What's on your mind?";
}

async function simulateCoachingResponse(
  persona: Persona,
  userMessage: string,
  goal: Goal | undefined,
  _history: Message[]
): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

  const lowerMessage = userMessage.toLowerCase();

  // Simple response logic (in production, this would be an LLM call)
  if (lowerMessage.includes('stuck') || lowerMessage.includes('block')) {
    return persona === 'shop_foreman'
      ? "What's the smallest next action you could take? Sometimes momentum beats perfection."
      : "That's frustrating. What feels like the biggest obstacle right now? Sometimes just naming it helps.";
  }

  if (lowerMessage.includes('progress') || lowerMessage.includes('celebrate') || lowerMessage.includes('win')) {
    return persona === 'shop_foreman'
      ? "Good work. Log it and keep moving. What's next?"
      : "That's wonderful! 🎉 Take a moment to appreciate that. You earned it. What made it happen?";
  }

  if (lowerMessage.includes('adjust') || lowerMessage.includes('change') || lowerMessage.includes('modify')) {
    return persona === 'shop_foreman'
      ? "Goals should serve you. What would make this more realistic or meaningful?"
      : "Goals can evolve—that's healthy. What would feel more right to you now?";
  }

  if (lowerMessage.includes('next') || lowerMessage.includes('focus')) {
    if (goal) {
      return persona === 'shop_foreman'
        ? `For "${goal.text}": What's one thing you could do in the next 24 hours?`
        : `Looking at "${goal.text}", what feels most important right now? Trust your gut.`;
    }
    return persona === 'shop_foreman'
      ? "Pick your top priority. What moves the needle most?"
      : "What's calling to you? Sometimes our instincts know what matters.";
  }

  // Default responses
  return persona === 'shop_foreman'
    ? "Got it. What action does that point to?"
    : "I hear you. Tell me more about what that means for you.";
}

// ----------------------------------------------------------------------------
// Compact Coaching Button
// ----------------------------------------------------------------------------

interface CoachingButtonProps {
  goal?: Goal;
  compact?: boolean;
}

export function CoachingButton({ goal, compact = false }: CoachingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (compact) {
    return (
      <>
        <button
          type="button"
          className="text-xs text-accent hover:underline"
          onClick={() => setIsOpen(true)}
        >
          💬 Coach me
        </button>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md">
              <CoachingPanel goal={goal} onClose={() => setIsOpen(false)} />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className="px-4 py-2 text-sm rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <span>💬</span>
        <span>Talk to Coach</span>
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md">
            <CoachingPanel goal={goal} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
