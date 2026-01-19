// ============================================================================
// LLM SERVICE
// Centralized LLM API client for all AI features
// ============================================================================

import { LLM_CONFIG, PERSONA_PROMPTS } from '../lib/config';
import type { Persona, LLMMessage, LLMResponse } from '../types';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface LLMRequestOptions {
  model?: keyof typeof LLM_CONFIG.models;
  temperature?: number;
  maxTokens?: number;
  persona?: Persona;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ----------------------------------------------------------------------------
// API Client
// ----------------------------------------------------------------------------

/**
 * Call the LLM API with automatic fallback
 */
export async function callLLM(
  prompt: string,
  options: LLMRequestOptions = {}
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY not configured');
  }

  const model = options.model
    ? LLM_CONFIG.models[options.model]
    : LLM_CONFIG.models.primary;

  const messages: LLMMessage[] = [];

  // Add system prompt if persona specified
  if (options.persona) {
    messages.push({
      role: 'system',
      content: PERSONA_PROMPTS[options.persona],
    });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Chronos Life OS',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? LLM_CONFIG.defaults.temperature,
      max_tokens: options.maxTokens ?? LLM_CONFIG.defaults.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`LLM request failed: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Chat with conversation history
 */
export async function chat(
  messages: ChatMessage[],
  options: LLMRequestOptions = {}
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_OPENROUTER_API_KEY not configured');
  }

  const model = options.model
    ? LLM_CONFIG.models[options.model]
    : LLM_CONFIG.models.primary;

  const llmMessages: LLMMessage[] = [];

  // Add system prompt if persona specified
  if (options.persona) {
    llmMessages.push({
      role: 'system',
      content: PERSONA_PROMPTS[options.persona],
    });
  }

  // Add conversation history
  llmMessages.push(...messages);

  const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Chronos Life OS',
    },
    body: JSON.stringify({
      model,
      messages: llmMessages,
      temperature: options.temperature ?? LLM_CONFIG.defaults.temperature,
      max_tokens: options.maxTokens ?? LLM_CONFIG.defaults.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`LLM request failed: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Quick classification using fast model
 */
export async function classify(
  prompt: string,
  options: string[]
): Promise<string> {
  const classifyPrompt = `${prompt}

Options: ${options.join(', ')}

Respond with ONLY one of the options above, nothing else.`;

  const response = await callLLM(classifyPrompt, { model: 'fast', temperature: 0.1 });
  
  // Find best match from options
  const normalized = response.toLowerCase().trim();
  const match = options.find((opt) => normalized.includes(opt.toLowerCase()));
  return match || options[0];
}

/**
 * Check if LLM is configured
 */
export function isLLMConfigured(): boolean {
  return !!import.meta.env.VITE_OPENROUTER_API_KEY;
}

// ----------------------------------------------------------------------------
// Coaching-specific API
// ----------------------------------------------------------------------------

export interface CoachingContext {
  persona: Persona;
  goalText?: string;
  goalProgress?: number;
  goalStatus?: string;
  recentPatterns?: string[];
}

/**
 * Get a coaching response
 */
export async function getCoachingResponse(
  userMessage: string,
  history: ChatMessage[],
  context: CoachingContext
): Promise<string> {
  // Build context-aware system prompt
  let systemPrompt = PERSONA_PROMPTS[context.persona];

  if (context.goalText) {
    systemPrompt += `\n\nThe user is working on this goal: "${context.goalText}"`;
    if (context.goalProgress !== undefined) {
      systemPrompt += `\nProgress: ${context.goalProgress}%`;
    }
    if (context.goalStatus) {
      systemPrompt += `\nStatus: ${context.goalStatus}`;
    }
  }

  if (context.recentPatterns && context.recentPatterns.length > 0) {
    systemPrompt += `\n\nPatterns I've learned about this user:\n${context.recentPatterns.map((p) => `- ${p}`).join('\n')}`;
  }

  systemPrompt += `\n\nYou are having a coaching conversation. Keep responses concise (2-3 sentences max). Focus on understanding, supporting, and suggesting next actions.`;

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    // Return simulated response if no API key
    return getSimulatedCoachingResponse(userMessage, context);
  }

  try {
    const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Chronos Life OS',
      },
      body: JSON.stringify({
        model: LLM_CONFIG.models.fast, // Use fast model for chat
        messages,
        temperature: 0.8,
        max_tokens: 256,
      }),
    });

    if (!response.ok) {
      throw new Error('LLM request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch {
    // Fallback to simulated response
    return getSimulatedCoachingResponse(userMessage, context);
  }
}

/**
 * Simulated coaching response when LLM is unavailable
 * Provides varied, context-aware responses without API
 */
function getSimulatedCoachingResponse(
  userMessage: string,
  context: CoachingContext
): string {
  const isForeman = context.persona === 'shop_foreman';
  const lowerMessage = userMessage.toLowerCase();

  // More keywords for better matching
  const isAboutStuck = /stuck|block|can'?t|difficult|hard|struggling|obstacle|problem/.test(lowerMessage);
  const isAboutProgress = /progress|celebrate|win|did it|finished|completed|success|proud|accomplished/.test(lowerMessage);
  const isAboutAdjust = /adjust|change|modify|different|rethink|pivot|reconsider/.test(lowerMessage);
  const isAboutNext = /next|focus|priority|should i|what do|start|begin/.test(lowerMessage);
  const isAboutFeeling = /feel|anxious|stressed|worried|overwhelmed|tired|exhausted|scared/.test(lowerMessage);
  const isAboutMotivation = /motivat|inspir|energy|drive|why|purpose|point/.test(lowerMessage);
  const isQuestion = /\?|how|what|why|when|should/.test(lowerMessage);
  const isGreeting = /^(hi|hello|hey|good morning|good evening|sup)/i.test(lowerMessage.trim());

  // Varied responses with randomization
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  if (isGreeting) {
    return isForeman
      ? pick(["Let's get to work. What's on your plate?", "Ready when you are. What's the priority?", "Good. What needs doing?"])
      : pick(["Hey there! How are you feeling today?", "Hi! What's on your mind?", "Hello! I'm glad you're here. What would you like to talk about?"]);
  }

  if (isAboutFeeling) {
    return isForeman
      ? pick([
          "Feelings are data. What's causing this?",
          "Noted. But what can you actually control here?",
          "That's real. Now—what's one thing you CAN do about it?",
        ])
      : pick([
          "Thank you for sharing that. Those feelings are valid. What's weighing on you most?",
          "It takes courage to acknowledge how we feel. What would help right now?",
          "I hear you. Sometimes just naming our feelings helps. What else is going on?",
          "That sounds tough. Remember, it's okay to not be okay. What do you need?",
        ]);
  }

  if (isAboutStuck) {
    return isForeman
      ? pick([
          "What's the smallest next action? Just one thing.",
          "Break it down. What's the actual blocker?",
          "Stuck means unclear. What specifically is unclear?",
          "Sometimes the answer is stepping away. When did you last take a break?",
        ])
      : pick([
          "That's frustrating. What feels like the biggest obstacle right now?",
          "Sometimes we're stuck because the goal needs adjusting, not us. Does this still feel right?",
          "What helped you get unstuck in the past? You've overcome obstacles before.",
          "Let's think smaller—what's the tiniest step forward you can imagine?",
        ]);
  }

  if (isAboutProgress) {
    return isForeman
      ? pick([
          "Good work. Log it, then what's next?",
          "That's execution. Keep that momentum.",
          "Solid. Don't celebrate too long—what's the next milestone?",
        ])
      : pick([
          "That's wonderful! 🎉 Take a moment to really feel that accomplishment.",
          "You did that! How does it feel to have made that progress?",
          "Amazing! What made the difference this time? That's worth remembering.",
          "Celebrate this! Progress builds on progress. What's exciting you about what's next?",
        ]);
  }

  if (isAboutMotivation) {
    return isForeman
      ? pick([
          "Motivation follows action, not the other way around. Start small.",
          "You don't need to feel like it. You need to do it anyway.",
          "Remember why you started. Is that reason still true?",
        ])
      : pick([
          "It's natural for motivation to ebb and flow. What first drew you to this goal?",
          "Sometimes reconnecting with our 'why' helps. What would achieving this mean for you?",
          "Motivation often returns once we start moving. What's the gentlest first step?",
          "What would you tell a friend who felt this way?",
        ]);
  }

  if (isAboutAdjust) {
    return isForeman
      ? pick([
          "Goals should serve you. What would make this more realistic?",
          "Adjust fast, adjust often. What's the right target now?",
          "If it's not working, change it. What's the new plan?",
        ])
      : pick([
          "Goals can evolve—that's healthy and wise. What would feel more right to you now?",
          "It's brave to reassess. What would serve you better at this point in your life?",
          "Our needs change, and that's okay. What does success look like to you now?",
        ]);
  }

  if (isAboutNext) {
    return isForeman
      ? pick([
          "Pick your top priority. What moves the needle most?",
          "One thing. What's the ONE thing that matters most today?",
          "What would make everything else easier or unnecessary?",
        ])
      : pick([
          "What's calling to you? Sometimes our instincts know what matters.",
          "If you had to pick just one thing, what would feel most meaningful?",
          "What would future-you thank you for doing today?",
        ]);
  }

  if (isQuestion) {
    return isForeman
      ? pick([
          "What do YOU think? You probably already know.",
          "Trust your gut. What's it telling you?",
          "You're asking the right questions. Now answer them.",
        ])
      : pick([
          "That's a great question to sit with. What comes up for you?",
          "What does your intuition say?",
          "If you knew you couldn't fail, what would you choose?",
        ]);
  }

  // Default varied responses
  return isForeman
    ? pick([
        "Got it. What action does that point to?",
        "And? What are you going to do about it?",
        "Interesting. How does that affect your priorities?",
        "Okay. So what's the move?",
      ])
    : pick([
        "I hear you. Tell me more about what that means for you.",
        "Thank you for sharing. What else is on your mind?",
        "That's interesting. How do you feel about it?",
        "I appreciate you opening up. What would be helpful to explore?",
      ]);
}

// Note shown when LLM is not configured
export const LLM_NOT_CONFIGURED_MESSAGE = 
  "💡 For smarter AI responses, add VITE_OPENROUTER_API_KEY to web/.env (free at openrouter.ai)";
