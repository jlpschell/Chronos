import { useCallback, useRef, useState } from 'react';

import { transcribeAudio, blobToBase64 } from '../services/voice.service';
import { saveVoiceMemo } from '../services/voice-memo.service';

interface VoiceMemoState {
  isRecording: boolean;
  lastBlob: Blob | null;
  transcript: string;
  duration: number;
  error: string | null;
}

export function useVoiceMemo() {
  const [state, setState] = useState<VoiceMemoState>({
    isRecording: false,
    lastBlob: null,
    transcript: '',
    duration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: 'Microphone access denied' }));
    }
  }, []);

  const stopRecording = useCallback((): Blob | null => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return null;

    recorder.stop();
    mediaRecorderRef.current = null;

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const duration = (Date.now() - startTimeRef.current) / 1000;

    setState((prev) => ({
      ...prev,
      isRecording: false,
      lastBlob: blob,
      duration,
    }));

    return blob;
  }, []);

  const transcribeLastRecording = useCallback(async () => {
    if (!state.lastBlob) return '';
    try {
      const audioBase64 = await blobToBase64(state.lastBlob);
      const response = await transcribeAudio({ audioBase64, mimeType: state.lastBlob.type });
      setState((prev) => ({ ...prev, transcript: response.text, error: null }));
      return response.text;
    } catch (error) {
      setState((prev) => ({ ...prev, error: 'Transcription failed' }));
      return '';
    }
  }, [state.lastBlob]);

  const saveLastRecording = useCallback(
    async (eventId: string) => {
      if (!state.lastBlob) return null;
      const transcript = state.transcript || (await transcribeLastRecording());
      return saveVoiceMemo({
        eventId,
        audioBlob: state.lastBlob,
        transcript,
        duration: state.duration,
      });
    },
    [state.lastBlob, state.transcript, state.duration, transcribeLastRecording]
  );

  return {
    ...state,
    startRecording,
    stopRecording,
    transcribeLastRecording,
    saveLastRecording,
  };
}
