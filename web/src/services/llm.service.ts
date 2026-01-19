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
 */
function getSimulatedCoachingResponse(
  userMessage: string,
  context: CoachingContext
): string {
  const isForeman = context.persona === 'shop_foreman';
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('stuck') || lowerMessage.includes('block')) {
    return isForeman
      ? "What's the smallest next action you could take? Sometimes momentum beats perfection."
      : "That's frustrating. What feels like the biggest obstacle right now? Sometimes just naming it helps.";
  }

  if (lowerMessage.includes('progress') || lowerMessage.includes('celebrate') || lowerMessage.includes('win')) {
    return isForeman
      ? "Good work. Log it and keep moving. What's next?"
      : "That's wonderful! 🎉 Take a moment to appreciate that. You earned it.";
  }

  if (lowerMessage.includes('adjust') || lowerMessage.includes('change')) {
    return isForeman
      ? "Goals should serve you. What would make this more realistic?"
      : "Goals can evolve—that's healthy. What would feel more right to you now?";
  }

  if (lowerMessage.includes('next') || lowerMessage.includes('focus')) {
    return isForeman
      ? "Pick your top priority. What moves the needle most?"
      : "What's calling to you? Sometimes our instincts know what matters.";
  }

  return isForeman
    ? "Got it. What action does that point to?"
    : "I hear you. Tell me more about what that means for you.";
}
