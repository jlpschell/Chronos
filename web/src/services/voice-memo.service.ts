import type { VoiceMemo } from '../types';
import { db } from '../db/schema';
import { useEventsStore } from '../stores/events.store';

export interface SaveVoiceMemoInput {
  eventId: string;
  audioBlob: Blob;
  transcript: string;
  duration: number;
}

export async function saveVoiceMemo(input: SaveVoiceMemoInput): Promise<VoiceMemo> {
  const memo: VoiceMemo = {
    id: crypto.randomUUID(),
    eventId: input.eventId,
    audioUrl: '',
    audioBlob: input.audioBlob,
    transcript: input.transcript,
    duration: input.duration,
    createdAt: new Date(),
  };

  // Save to voice memos table
  await db.voiceMemos.add(memo);

  // Also attach to event if it exists in the events store
  const eventsStore = useEventsStore.getState();
  const event = eventsStore.getEventById(input.eventId);
  if (event) {
    eventsStore.attachVoiceMemo(input.eventId, memo);
  }

  return memo;
}

export async function getVoiceMemosForEvent(eventId: string): Promise<VoiceMemo[]> {
  return db.voiceMemos.where('eventId').equals(eventId).toArray();
}

export function getVoiceMemoAudioUrl(memo: VoiceMemo): string | null {
  if (memo.audioUrl) return memo.audioUrl;
  if (memo.audioBlob) {
    return URL.createObjectURL(memo.audioBlob);
  }
  return null;
}
