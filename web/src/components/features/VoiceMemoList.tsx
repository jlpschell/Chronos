import { useEffect, useMemo, useState } from 'react';

import type { VoiceMemo } from '../../types';
import { getVoiceMemoAudioUrl, getVoiceMemosForEvent } from '../../services/voice-memo.service';

interface VoiceMemoListProps {
  eventId: string;
}

export function VoiceMemoList({ eventId }: VoiceMemoListProps) {
  const [memos, setMemos] = useState<VoiceMemo[]>([]);

  useEffect(() => {
    let isActive = true;
    getVoiceMemosForEvent(eventId).then((results) => {
      if (isActive) setMemos(results);
    });
    return () => {
      isActive = false;
    };
  }, [eventId]);

  const memoItems = useMemo(() => {
    return memos.map((memo) => ({
      ...memo,
      audioUrl: getVoiceMemoAudioUrl(memo),
    }));
  }, [memos]);

  if (memos.length === 0) {
    return (
      <p className="text-xs text-ink opacity-70">No voice memos for this event yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {memoItems.map((memo) => (
        <div key={memo.id} className="rounded border border-border bg-canvas p-2 text-sm">
          <div className="text-xs text-ink opacity-70">
            {memo.duration.toFixed(1)}s · {memo.createdAt.toLocaleString()}
          </div>
          <div className="mt-1 text-ink opacity-80">{memo.transcript}</div>
          {memo.audioUrl && (
            <audio className="mt-2 w-full" controls src={memo.audioUrl} />
          )}
        </div>
      ))}
    </div>
  );
}
