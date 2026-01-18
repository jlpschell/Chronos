import { useCallback, useMemo, useState } from 'react';

import type { VoiceIntent } from '../../types';
import { classifyVoiceIntent, describeVoiceIntent, handleVoiceIntent } from '../../services/voice-intent.service';
import { useVoice } from '../../hooks/useVoice';
import { useVoiceMemo } from '../../hooks/useVoiceMemo';
import { useUserStore } from '../../stores/user.store';
import { VoiceMemoList } from './VoiceMemoList';

interface VoicePanelProps {
  defaultEventId?: string | null;
}

export function VoicePanel({ defaultEventId = null }: VoicePanelProps) {
  const [textInput, setTextInput] = useState('');
  const [eventId, setEventId] = useState(defaultEventId ?? '');

  const {
    isListening,
    transcript,
    error,
    hasWebSpeech,
    startListening,
    stopListening,
    speakText,
  } = useVoice();

  const {
    isRecording,
    lastBlob,
    transcript: memoTranscript,
    duration,
    startRecording,
    stopRecording,
    transcribeLastRecording,
    saveLastRecording,
  } = useVoiceMemo();

  const effectiveText = textInput || transcript;
  const intent = useMemo<VoiceIntent>(() => classifyVoiceIntent(effectiveText), [effectiveText]);
  const intentDescription = useMemo(() => describeVoiceIntent(intent), [intent]);
  const [intentResponse, setIntentResponse] = useState('');
  const incrementActiveDay = useUserStore((s) => s.incrementActiveDay);

  const handleSpeak = useCallback(async () => {
    if (!effectiveText) return;
    await speakText(effectiveText);
  }, [effectiveText, speakText]);

  const handleSaveMemo = useCallback(async () => {
    if (!eventId || !lastBlob) return;
    await saveLastRecording(eventId);
    incrementActiveDay('voice');
  }, [eventId, lastBlob, incrementActiveDay, saveLastRecording]);

  const handleIntent = useCallback(async () => {
    const result = handleVoiceIntent(intent, effectiveText);
    setIntentResponse(result.message);
    if (result.createdEvent) {
      setIntentResponse(`${result.message} (Event ID: ${result.createdEvent.id})`);
    }
    if (result.message) {
      incrementActiveDay('voice');
      await speakText(result.message);
    }
  }, [intent, effectiveText, incrementActiveDay, speakText]);

  return (
    <div className="rounded border border-border bg-surface p-4 space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Voice Input</h2>
        <p className="text-sm text-ink opacity-70">
          Use speech or text to classify intent. Web Speech is a fallback when offline.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Text input</label>
        <textarea
          className="w-full rounded border border-border bg-canvas px-3 py-2 text-sm text-ink"
          rows={3}
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          placeholder="Speak or type: “Block tomorrow morning”"
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-border px-3 py-2 text-sm"
            onClick={isListening ? stopListening : startListening}
            disabled={!hasWebSpeech}
          >
            {isListening ? 'Stop listening' : 'Start listening'}
          </button>
          <button
            type="button"
            className="rounded border border-border px-3 py-2 text-sm"
            onClick={handleSpeak}
          >
            Speak text
          </button>
        </div>
        {transcript && (
          <p className="text-xs text-ink opacity-70">Transcript: {transcript}</p>
        )}
        {error && (
          <p className="text-xs text-red-500">Voice error: {error}</p>
        )}
      </div>

      <div className="rounded bg-canvas p-3 text-sm space-y-2">
        <p className="font-medium">Intent</p>
        <p className="text-ink opacity-80">{intentDescription}</p>
        <button
          type="button"
          className="rounded border border-border px-3 py-2 text-sm"
          onClick={handleIntent}
        >
          Handle intent
        </button>
        {intentResponse && (
          <p className="text-xs text-ink opacity-70">{intentResponse}</p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Voice Memo</h3>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-border px-3 py-2 text-sm"
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? 'Stop recording' : 'Record memo'}
          </button>
          <button
            type="button"
            className="rounded border border-border px-3 py-2 text-sm"
            onClick={transcribeLastRecording}
            disabled={!lastBlob}
          >
            Transcribe
          </button>
        </div>
        {lastBlob && (
          <p className="text-xs text-ink opacity-70">
            Recorded {duration.toFixed(1)}s, {lastBlob.type}
          </p>
        )}
        {memoTranscript && (
          <p className="text-xs text-ink opacity-70">Memo transcript: {memoTranscript}</p>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-border bg-canvas px-3 py-2 text-sm text-ink"
            placeholder="Event ID for memo"
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          />
          <button
            type="button"
            className="rounded border border-border px-3 py-2 text-sm"
            onClick={handleSaveMemo}
            disabled={!eventId || !lastBlob}
          >
            Save memo
          </button>
        </div>
        {eventId && (
          <div className="pt-2">
            <VoiceMemoList eventId={eventId} />
          </div>
        )}
      </div>
    </div>
  );
}
