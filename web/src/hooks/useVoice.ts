import { useCallback, useMemo, useRef, useState } from 'react';

import { blobToBase64, playTts, transcribeAudio } from '../services/voice.service';

type VoiceError = 'unsupported' | 'permission_denied' | 'network' | 'unknown';

interface UseVoiceState {
  isListening: boolean;
  transcript: string;
  error: VoiceError | null;
}

export function useVoice() {
  const [state, setState] = useState<UseVoiceState>({
    isListening: false,
    transcript: '',
    error: null,
  });

  const recognitionRef = useRef<any>(null);

  const hasWebSpeech = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }, []);

  const startListening = useCallback(() => {
    if (!hasWebSpeech) {
      setState((prev) => ({ ...prev, error: 'unsupported' }));
      return;
    }

    const RecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new RecognitionCtor();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onerror = (event: any) => {
      const error = event?.error === 'not-allowed' ? 'permission_denied' : 'unknown';
      setState((prev) => ({ ...prev, isListening: false, error }));
    };

    recognition.onresult = (event: any) => {
      const latest = event.results[event.results.length - 1];
      const text = latest[0]?.transcript ?? '';
      setState((prev) => ({ ...prev, transcript: text }));
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
    };

    recognition.start();
  }, [hasWebSpeech]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const speakText = useCallback(async (text: string) => {
    try {
      if (navigator.onLine) {
        await playTts({ text });
        return;
      }
    } catch {
      // Fall through to browser TTS
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      setState((prev) => ({ ...prev, error: 'unsupported' }));
    }
  }, []);

  const transcribeBlob = useCallback(async (audio: Blob) => {
    try {
      const audioBase64 = await blobToBase64(audio);
      const response = await transcribeAudio({ audioBase64, mimeType: audio.type });
      setState((prev) => ({ ...prev, transcript: response.text, error: null }));
      return response.text;
    } catch {
      setState((prev) => ({ ...prev, error: 'network' }));
      return '';
    }
  }, []);

  return {
    ...state,
    hasWebSpeech,
    startListening,
    stopListening,
    speakText,
    transcribeBlob,
  };
}
