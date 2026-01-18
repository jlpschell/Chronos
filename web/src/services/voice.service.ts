import { ENV } from '../lib/config';

export interface TtsRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
  voiceSettings?: Record<string, unknown>;
}

export interface SttRequest {
  audioBase64: string;
  mimeType?: string;
  modelId?: string;
  language?: string;
}

export interface SttResponse {
  text: string;
  language?: string;
  words?: Array<{
    start: number;
    end: number;
    word: string;
  }>;
}

function getVoiceProxyBaseUrl(): string {
  return ENV.VOICE_PROXY_URL() || 'http://localhost:8787';
}

export async function fetchTtsAudio(request: TtsRequest, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(`${getVoiceProxyBaseUrl()}/api/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS failed: ${errorText}`);
  }

  return response.blob();
}

export async function playTts(request: TtsRequest, signal?: AbortSignal): Promise<void> {
  const audioBlob = await fetchTtsAudio(request, signal);
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  await audio.play();
  audio.addEventListener('ended', () => URL.revokeObjectURL(audioUrl), { once: true });
}

export async function transcribeAudio(request: SttRequest, signal?: AbortSignal): Promise<SttResponse> {
  const response = await fetch(`${getVoiceProxyBaseUrl()}/api/voice/stt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`STT failed: ${errorText}`);
  }

  return response.json() as Promise<SttResponse>;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}
